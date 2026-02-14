import { sql } from '@vercel/postgres'
import { Pipeline, PipelineStage, PipelineItem, AgentConfig, DEFAULT_AGENT_CONFIG } from './types'

// ── Schema ──────────────────────────────────────────────────

export async function ensurePipelineTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS pipelines (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS pipeline_stages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      position INT NOT NULL DEFAULT 0,
      is_start BOOLEAN DEFAULT false,
      is_end BOOLEAN DEFAULT false,
      agent_config JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS pipeline_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
      current_stage_id UUID NOT NULL REFERENCES pipeline_stages(id),
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      payload JSONB DEFAULT '{}'::jsonb,
      status TEXT NOT NULL DEFAULT 'active',
      logs JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
}

// ── Helpers ─────────────────────────────────────────────────

function parseJson(val: any, fallback: any = {}) {
  if (typeof val === 'string') return JSON.parse(val)
  return val || fallback
}

function rowToStage(row: any): PipelineStage {
  return {
    id: row.id,
    pipeline_id: row.pipeline_id,
    name: row.name,
    position: row.position,
    is_start: row.is_start,
    is_end: row.is_end,
    agent_config: { ...DEFAULT_AGENT_CONFIG, ...parseJson(row.agent_config) },
    created_at: row.created_at?.toISOString?.() || row.created_at,
    updated_at: row.updated_at?.toISOString?.() || row.updated_at,
  }
}

function rowToItem(row: any): PipelineItem {
  return {
    id: row.id,
    pipeline_id: row.pipeline_id,
    current_stage_id: row.current_stage_id,
    title: row.title,
    description: row.description || '',
    payload: parseJson(row.payload),
    status: row.status,
    logs: parseJson(row.logs, []),
    created_at: row.created_at?.toISOString?.() || row.created_at,
    updated_at: row.updated_at?.toISOString?.() || row.updated_at,
  }
}

// ── Pipelines CRUD ──────────────────────────────────────────

export async function getPipelines(): Promise<Pipeline[]> {
  await ensurePipelineTables()
  const { rows: pipelines } = await sql`SELECT * FROM pipelines ORDER BY created_at DESC`
  const { rows: stages } = await sql`SELECT * FROM pipeline_stages ORDER BY position ASC`
  const { rows: items } = await sql`SELECT * FROM pipeline_items ORDER BY created_at ASC`

  return pipelines.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    stages: stages.filter(s => s.pipeline_id === p.id).map(rowToStage),
    items: items.filter(i => i.pipeline_id === p.id).map(rowToItem),
    created_at: p.created_at?.toISOString?.() || p.created_at,
    updated_at: p.updated_at?.toISOString?.() || p.updated_at,
  }))
}

export async function getPipeline(id: string): Promise<Pipeline | null> {
  await ensurePipelineTables()
  const { rows } = await sql`SELECT * FROM pipelines WHERE id = ${id}`
  if (!rows[0]) return null
  const p = rows[0]
  const { rows: stages } = await sql`SELECT * FROM pipeline_stages WHERE pipeline_id = ${id} ORDER BY position ASC`
  const { rows: items } = await sql`SELECT * FROM pipeline_items WHERE pipeline_id = ${id} ORDER BY created_at ASC`

  return {
    id: p.id,
    name: p.name,
    description: p.description || '',
    stages: stages.map(rowToStage),
    items: items.map(rowToItem),
    created_at: p.created_at?.toISOString?.() || p.created_at,
    updated_at: p.updated_at?.toISOString?.() || p.updated_at,
  }
}

export async function createPipeline(data: { name: string; description?: string; stages?: string[] }): Promise<Pipeline> {
  await ensurePipelineTables()

  const { rows } = await sql`
    INSERT INTO pipelines (name, description) VALUES (${data.name}, ${data.description || ''})
    RETURNING *
  `
  const pipeline = rows[0]

  // Always create Start State and End State
  const stageNames = ['Start', ...(data.stages || []), 'End']
  const stageRows: PipelineStage[] = []

  for (let i = 0; i < stageNames.length; i++) {
    const isStart = i === 0
    const isEnd = i === stageNames.length - 1
    const config = JSON.stringify(DEFAULT_AGENT_CONFIG)
    const { rows: sRows } = await sql`
      INSERT INTO pipeline_stages (pipeline_id, name, position, is_start, is_end, agent_config)
      VALUES (${pipeline.id}, ${stageNames[i]}, ${i}, ${isStart}, ${isEnd}, ${config})
      RETURNING *
    `
    stageRows.push(rowToStage(sRows[0]))
  }

  return {
    id: pipeline.id,
    name: pipeline.name,
    description: pipeline.description || '',
    stages: stageRows,
    items: [],
    created_at: pipeline.created_at?.toISOString?.() || pipeline.created_at,
    updated_at: pipeline.updated_at?.toISOString?.() || pipeline.updated_at,
  }
}

export async function updatePipeline(id: string, data: { name?: string; description?: string }): Promise<Pipeline | null> {
  await ensurePipelineTables()
  const existing = await getPipeline(id)
  if (!existing) return null

  await sql`
    UPDATE pipelines SET
      name = ${data.name ?? existing.name},
      description = ${data.description ?? existing.description},
      updated_at = NOW()
    WHERE id = ${id}
  `
  return getPipeline(id)
}

export async function deletePipeline(id: string): Promise<boolean> {
  await ensurePipelineTables()
  const { rowCount } = await sql`DELETE FROM pipelines WHERE id = ${id}`
  return (rowCount ?? 0) > 0
}

// ── Stages CRUD ─────────────────────────────────────────────

export async function createStage(pipelineId: string, data: { name: string; position?: number }): Promise<PipelineStage> {
  await ensurePipelineTables()

  // Get current stages to figure out position (insert before End)
  const { rows: existing } = await sql`
    SELECT * FROM pipeline_stages WHERE pipeline_id = ${pipelineId} ORDER BY position ASC
  `
  const endStage = existing.find(s => s.is_end)
  const insertPos = data.position ?? (endStage ? endStage.position : existing.length)

  // Shift stages at or after insert position
  await sql`
    UPDATE pipeline_stages SET position = position + 1
    WHERE pipeline_id = ${pipelineId} AND position >= ${insertPos}
  `

  const config = JSON.stringify(DEFAULT_AGENT_CONFIG)
  const { rows } = await sql`
    INSERT INTO pipeline_stages (pipeline_id, name, position, is_start, is_end, agent_config)
    VALUES (${pipelineId}, ${data.name}, ${insertPos}, false, false, ${config})
    RETURNING *
  `
  return rowToStage(rows[0])
}

export async function updateStage(id: string, data: { name?: string; agent_config?: Partial<AgentConfig> }): Promise<PipelineStage | null> {
  await ensurePipelineTables()
  const { rows: existing } = await sql`SELECT * FROM pipeline_stages WHERE id = ${id}`
  if (!existing[0]) return null

  const stage = rowToStage(existing[0])
  const newName = data.name ?? stage.name
  const newConfig = JSON.stringify({ ...stage.agent_config, ...(data.agent_config || {}) })

  const { rows } = await sql`
    UPDATE pipeline_stages SET name = ${newName}, agent_config = ${newConfig}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  return rowToStage(rows[0])
}

export async function deleteStage(id: string): Promise<boolean> {
  await ensurePipelineTables()
  // Don't allow deleting start/end
  const { rows } = await sql`SELECT * FROM pipeline_stages WHERE id = ${id}`
  if (!rows[0] || rows[0].is_start || rows[0].is_end) return false

  const pipelineId = rows[0].pipeline_id
  const position = rows[0].position

  await sql`DELETE FROM pipeline_stages WHERE id = ${id}`
  // Re-order remaining
  await sql`
    UPDATE pipeline_stages SET position = position - 1
    WHERE pipeline_id = ${pipelineId} AND position > ${position}
  `
  return true
}

// ── Items CRUD ──────────────────────────────────────────────

export async function createItem(pipelineId: string, data: { title: string; description?: string; stage_id?: string }): Promise<PipelineItem> {
  await ensurePipelineTables()

  // Default to start stage
  let stageId = data.stage_id
  if (!stageId) {
    const { rows } = await sql`
      SELECT id FROM pipeline_stages WHERE pipeline_id = ${pipelineId} AND is_start = true LIMIT 1
    `
    stageId = rows[0]?.id
  }

  const log = JSON.stringify([{
    timestamp: new Date().toISOString(),
    message: 'Item created',
    agent: 'user',
    action: 'created',
  }])

  const { rows } = await sql`
    INSERT INTO pipeline_items (pipeline_id, current_stage_id, title, description, payload, status, logs)
    VALUES (${pipelineId}, ${stageId}, ${data.title}, ${data.description || ''}, '{}'::jsonb, 'active', ${log})
    RETURNING *
  `
  return rowToItem(rows[0])
}

export async function updateItem(id: string, data: Partial<PipelineItem>): Promise<PipelineItem | null> {
  await ensurePipelineTables()
  const { rows: existing } = await sql`SELECT * FROM pipeline_items WHERE id = ${id}`
  if (!existing[0]) return null

  const item = rowToItem(existing[0])
  const merged = {
    title: data.title ?? item.title,
    description: data.description ?? item.description,
    current_stage_id: data.current_stage_id ?? item.current_stage_id,
    payload: data.payload ?? item.payload,
    status: data.status ?? item.status,
    logs: data.logs ?? item.logs,
  }

  const { rows } = await sql`
    UPDATE pipeline_items SET
      title = ${merged.title},
      description = ${merged.description},
      current_stage_id = ${merged.current_stage_id},
      payload = ${JSON.stringify(merged.payload)},
      status = ${merged.status},
      logs = ${JSON.stringify(merged.logs)},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  return rowToItem(rows[0])
}

export async function moveItem(id: string, toStageId: string, agentName?: string): Promise<PipelineItem | null> {
  await ensurePipelineTables()
  const { rows: existing } = await sql`SELECT * FROM pipeline_items WHERE id = ${id}`
  if (!existing[0]) return null

  const item = rowToItem(existing[0])
  const { rows: fromStage } = await sql`SELECT name FROM pipeline_stages WHERE id = ${item.current_stage_id}`
  const { rows: toStage } = await sql`SELECT name, is_end FROM pipeline_stages WHERE id = ${toStageId}`

  const log = {
    timestamp: new Date().toISOString(),
    message: `Moved from ${fromStage[0]?.name || '?'} → ${toStage[0]?.name || '?'}`,
    agent: agentName || 'system',
    action: 'moved',
  }

  const newStatus = toStage[0]?.is_end ? 'completed' : item.status

  const { rows } = await sql`
    UPDATE pipeline_items SET
      current_stage_id = ${toStageId},
      status = ${newStatus},
      logs = ${JSON.stringify([...item.logs, log])},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  return rowToItem(rows[0])
}

export async function deleteItem(id: string): Promise<boolean> {
  await ensurePipelineTables()
  const { rowCount } = await sql`DELETE FROM pipeline_items WHERE id = ${id}`
  return (rowCount ?? 0) > 0
}

// ── Processing ──────────────────────────────────────────────

export interface PendingItem {
  item: PipelineItem
  stage: PipelineStage
  pipeline_name: string
  pipeline_id: string
  next_stage_id: string | null
}

export async function getPendingItems(): Promise<PendingItem[]> {
  await ensurePipelineTables()

  const pipelines = await getPipelines()
  const pending: PendingItem[] = []

  for (const pipeline of pipelines) {
    for (let i = 0; i < pipeline.stages.length; i++) {
      const stage = pipeline.stages[i]
      if (!stage.agent_config.enabled || stage.is_end) continue

      const nextStage = pipeline.stages[i + 1] || null
      const intervalMs = stage.agent_config.cron_interval_ms

      for (const item of pipeline.items) {
        if (item.current_stage_id !== stage.id) continue
        if (item.status !== 'active') continue

        // Check if enough time has passed since last processing
        const lastLog = item.logs.filter(l => l.action === 'processed').pop()
        if (lastLog) {
          const elapsed = Date.now() - new Date(lastLog.timestamp).getTime()
          if (elapsed < intervalMs) continue
        }

        pending.push({
          item,
          stage,
          pipeline_name: pipeline.name,
          pipeline_id: pipeline.id,
          next_stage_id: nextStage?.id || null,
        })
      }
    }
  }

  return pending
}

export async function writeItemResult(
  id: string,
  result: { output?: string; payload_updates?: Record<string, any>; move_to_next?: boolean },
  agentName: string = 'pipeline-engine'
): Promise<PipelineItem | null> {
  await ensurePipelineTables()
  const { rows: existing } = await sql`SELECT * FROM pipeline_items WHERE id = ${id}`
  if (!existing[0]) return null

  const item = rowToItem(existing[0])

  // Merge payload
  const newPayload = { ...item.payload, ...(result.payload_updates || {}) }

  // Add processing log
  const processLog = {
    timestamp: new Date().toISOString(),
    message: result.output ? `Processed: ${result.output.substring(0, 200)}` : 'Processed',
    agent: agentName,
    action: 'processed',
  }
  const newLogs = [...item.logs, processLog]

  const { rows } = await sql`
    UPDATE pipeline_items SET
      payload = ${JSON.stringify(newPayload)},
      logs = ${JSON.stringify(newLogs)},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `

  return rowToItem(rows[0])
}
