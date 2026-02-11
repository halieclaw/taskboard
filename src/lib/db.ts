import { sql } from '@vercel/postgres'
import { Task } from './types'

export async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'inbox',
      priority TEXT NOT NULL DEFAULT 'medium',
      needs_human_input BOOLEAN DEFAULT false,
      sub_tasks JSONB DEFAULT '[]'::jsonb,
      agent_logs JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
}

function rowToTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    status: row.status,
    priority: row.priority,
    needs_human_input: row.needs_human_input,
    sub_tasks: typeof row.sub_tasks === 'string' ? JSON.parse(row.sub_tasks) : row.sub_tasks || [],
    agent_logs: typeof row.agent_logs === 'string' ? JSON.parse(row.agent_logs) : row.agent_logs || [],
    created_at: row.created_at?.toISOString?.() || row.created_at,
    updated_at: row.updated_at?.toISOString?.() || row.updated_at,
  }
}

export async function getTasks(): Promise<Task[]> {
  await ensureTable()
  const { rows } = await sql`SELECT * FROM tasks ORDER BY created_at DESC`
  return rows.map(rowToTask)
}

export async function getTask(id: string): Promise<Task | null> {
  await ensureTable()
  const { rows } = await sql`SELECT * FROM tasks WHERE id = ${id}`
  return rows[0] ? rowToTask(rows[0]) : null
}

export async function createTask(data: Partial<Task>): Promise<Task> {
  await ensureTable()
  const { rows } = await sql`
    INSERT INTO tasks (title, description, status, priority, needs_human_input, sub_tasks, agent_logs)
    VALUES (
      ${data.title || 'Untitled'},
      ${data.description || ''},
      ${data.status || 'inbox'},
      ${data.priority || 'medium'},
      ${data.needs_human_input || false},
      ${JSON.stringify(data.sub_tasks || [])},
      ${JSON.stringify(data.agent_logs || [])}
    )
    RETURNING *
  `
  return rowToTask(rows[0])
}

export async function updateTask(id: string, data: Partial<Task>): Promise<Task | null> {
  await ensureTable()
  const existing = await getTask(id)
  if (!existing) return null

  const merged = { ...existing, ...data, updated_at: new Date().toISOString() }
  const { rows } = await sql`
    UPDATE tasks SET
      title = ${merged.title},
      description = ${merged.description},
      status = ${merged.status},
      priority = ${merged.priority},
      needs_human_input = ${merged.needs_human_input},
      sub_tasks = ${JSON.stringify(merged.sub_tasks)},
      agent_logs = ${JSON.stringify(merged.agent_logs)},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
  return rows[0] ? rowToTask(rows[0]) : null
}

export async function deleteTask(id: string): Promise<boolean> {
  await ensureTable()
  const { rowCount } = await sql`DELETE FROM tasks WHERE id = ${id}`
  return (rowCount ?? 0) > 0
}
