'use client'

import { useState, useEffect, useCallback } from 'react'
import { Task, Status, COLUMNS, AgentLog, Pipeline, PipelineItem, AgentConfig } from '@/lib/types'
import { KanbanColumn } from '@/components/KanbanColumn'
import { TaskModal } from '@/components/TaskModal'
import { CreateTaskModal } from '@/components/CreateTaskModal'
import { ActivityLog } from '@/components/ActivityLog'
import { HeartbeatTimer } from '@/components/HeartbeatTimer'
import { PipelineList } from '@/components/PipelineList'
import { PipelineBoard } from '@/components/PipelineBoard'
import { CreatePipelineModal } from '@/components/CreatePipelineModal'

type View = 'tasks' | 'pipelines'
type TaskTab = 'board' | 'activity'

function addLog(task: Task, action: string, message: string): AgentLog[] {
  const log: AgentLog = {
    timestamp: new Date().toISOString(),
    message,
    agent: 'user',
    action,
  }
  return [...task.agent_logs, log]
}

export default function Home() {
  // View state
  const [view, setView] = useState<View>('tasks')
  const [taskTab, setTaskTab] = useState<TaskTab>('board')

  // Task state
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [draggedId, setDraggedId] = useState<string | null>(null)

  // Pipeline state
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null)
  const [showCreatePipeline, setShowCreatePipeline] = useState(false)
  const [pipelinesLoading, setPipelinesLoading] = useState(true)

  // ── Tasks ─────────────────────────────────────────────────

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks')
      if (res.ok) setTasks(await res.json())
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const moveTask = async (id: string, status: Status) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const fromLabel = COLUMNS.find(c => c.key === task.status)?.label || task.status
    const toLabel = COLUMNS.find(c => c.key === status)?.label || status
    const logs = addLog(task, 'moved', `Moved from ${fromLabel} to ${toLabel}`)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status, agent_logs: logs } : t))
    await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, agent_logs: logs }),
    })
  }

  const handleDrop = (status: Status) => {
    if (draggedId) { moveTask(draggedId, status); setDraggedId(null) }
  }

  const updateTask = async (task: Task) => {
    const existing = tasks.find(t => t.id === task.id)
    let logs = task.agent_logs
    if (existing) {
      const changes: string[] = []
      if (existing.title !== task.title) changes.push('title')
      if (existing.description !== task.description) changes.push('description')
      if (existing.priority !== task.priority) changes.push(`priority → ${task.priority}`)
      if (existing.status !== task.status) {
        const fromLabel = COLUMNS.find(c => c.key === existing.status)?.label || existing.status
        const toLabel = COLUMNS.find(c => c.key === task.status)?.label || task.status
        changes.push(`moved ${fromLabel} → ${toLabel}`)
      }
      if (existing.sub_tasks.length !== task.sub_tasks.length) changes.push('sub-tasks')
      if (existing.needs_human_input !== task.needs_human_input) changes.push('human input flag')
      if (changes.length > 0) {
        const log: AgentLog = {
          timestamp: new Date().toISOString(),
          message: `Edited: ${changes.join(', ')}`,
          agent: 'user',
          action: 'edited',
        }
        logs = [...logs, log]
      }
    }
    const payload = { ...task, agent_logs: logs }
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const updated = await res.json()
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
      setSelectedTask(updated)
    }
  }

  const deleteTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t.id !== id))
    setSelectedTask(null)
  }

  const createTask = async (data: Partial<Task>) => {
    const createLog: AgentLog = {
      timestamp: new Date().toISOString(),
      message: 'Task created',
      agent: 'user',
      action: 'created',
    }
    const payload = { ...data, agent_logs: [createLog] }
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const task = await res.json()
      setTasks(prev => [task, ...prev])
      setShowCreate(false)
    }
  }

  // ── Pipelines ─────────────────────────────────────────────

  const fetchPipelines = useCallback(async () => {
    try {
      const res = await fetch('/api/pipelines')
      if (res.ok) setPipelines(await res.json())
    } catch {} finally { setPipelinesLoading(false) }
  }, [])

  useEffect(() => { fetchPipelines() }, [fetchPipelines])

  const refreshPipeline = async () => {
    if (!selectedPipeline) return
    const res = await fetch(`/api/pipelines/${selectedPipeline.id}`)
    if (res.ok) {
      const updated = await res.json()
      setSelectedPipeline(updated)
      setPipelines(prev => prev.map(p => p.id === updated.id ? updated : p))
    }
  }

  const createPipeline = async (data: { name: string; description: string; stages: string[] }) => {
    const res = await fetch('/api/pipelines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const pipeline = await res.json()
      setPipelines(prev => [pipeline, ...prev])
      setShowCreatePipeline(false)
      setSelectedPipeline(pipeline)
    }
  }

  const deletePipeline = async () => {
    if (!selectedPipeline) return
    await fetch(`/api/pipelines/${selectedPipeline.id}`, { method: 'DELETE' })
    setPipelines(prev => prev.filter(p => p.id !== selectedPipeline.id))
    setSelectedPipeline(null)
  }

  const updateStage = async (stageId: string, data: { name?: string; agent_config?: Partial<AgentConfig> }) => {
    if (!selectedPipeline) return
    await fetch(`/api/pipelines/${selectedPipeline.id}/stages/${stageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    refreshPipeline()
  }

  const deleteStage = async (stageId: string) => {
    if (!selectedPipeline) return
    await fetch(`/api/pipelines/${selectedPipeline.id}/stages/${stageId}`, { method: 'DELETE' })
    refreshPipeline()
  }

  const addStage = async (name: string) => {
    if (!selectedPipeline) return
    await fetch(`/api/pipelines/${selectedPipeline.id}/stages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    refreshPipeline()
  }

  const createItem = async (title: string, description?: string, stageId?: string) => {
    if (!selectedPipeline) return
    await fetch(`/api/pipelines/${selectedPipeline.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, stage_id: stageId }),
    })
    refreshPipeline()
  }

  const moveItem = async (itemId: string, toStageId: string) => {
    if (!selectedPipeline) return
    await fetch(`/api/pipelines/${selectedPipeline.id}/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ move_to_stage: toStageId }),
    })
    refreshPipeline()
  }

  const updateItem = async (itemId: string, data: Partial<PipelineItem>) => {
    if (!selectedPipeline) return
    await fetch(`/api/pipelines/${selectedPipeline.id}/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    refreshPipeline()
  }

  const deleteItem = async (itemId: string) => {
    if (!selectedPipeline) return
    await fetch(`/api/pipelines/${selectedPipeline.id}/items/${itemId}`, { method: 'DELETE' })
    refreshPipeline()
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass-heavy sticky top-0 z-40 px-5 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-white text-sm font-bold shadow-sm">
            {view === 'tasks' ? 'T' : '⚡'}
          </div>
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight text-text">
              {selectedPipeline ? selectedPipeline.name : view === 'tasks' ? 'Taskboard' : 'Pipelines'}
            </h1>
            <span className="text-[11px] text-text-tertiary font-medium tracking-wide">
              {selectedPipeline ? 'Agent Pipeline' : view === 'tasks' ? 'Agent Pipeline' : 'Agent Assembly Lines'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <HeartbeatTimer />

          {/* Main nav */}
          <div className="flex gap-0 border-b border-black/[0.06]">
            <button
              onClick={() => { setView('tasks'); setSelectedPipeline(null) }}
              className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${view === 'tasks' && !selectedPipeline ? 'tab-active' : 'tab-inactive'}`}
            >
              Tasks
            </button>
            <button
              onClick={() => { setView('pipelines'); setSelectedPipeline(null) }}
              className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${view === 'pipelines' || selectedPipeline ? 'tab-active' : 'tab-inactive'}`}
            >
              Pipelines
            </button>
            {view === 'tasks' && !selectedPipeline && (
              <>
                <div className="w-px bg-black/[0.06] mx-1" />
                <button
                  onClick={() => setTaskTab('board')}
                  className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${taskTab === 'board' ? 'tab-active' : 'tab-inactive'}`}
                >
                  Board
                </button>
                <button
                  onClick={() => setTaskTab('activity')}
                  className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${taskTab === 'activity' ? 'tab-active' : 'tab-inactive'}`}
                >
                  Activity
                </button>
              </>
            )}
          </div>

          {/* Action buttons */}
          {view === 'tasks' && !selectedPipeline && (
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary px-4 py-2 text-white text-[13px] rounded-xl font-medium flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>
              New Task
            </button>
          )}
          {view === 'pipelines' && !selectedPipeline && (
            <button
              onClick={() => setShowCreatePipeline(true)}
              className="btn-primary px-4 py-2 text-white text-[13px] rounded-xl font-medium flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>
              New Pipeline
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-x-auto px-5 sm:px-8 py-6">
        {/* Tasks view */}
        {view === 'tasks' && !selectedPipeline && (
          taskTab === 'board' ? (
            loading ? (
              <div className="flex gap-5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-72 flex-shrink-0 space-y-3">
                    <div className="shimmer h-5 w-24 rounded-lg" />
                    <div className="shimmer h-24 rounded-2xl" />
                    <div className="shimmer h-20 rounded-2xl" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-5 min-w-max h-full">
                {COLUMNS.map(col => (
                  <KanbanColumn
                    key={col.key}
                    column={col}
                    tasks={tasks.filter(t => t.status === col.key)}
                    onTaskClick={setSelectedTask}
                    onDragStart={setDraggedId}
                    onDrop={() => handleDrop(col.key)}
                    onMoveTask={moveTask}
                  />
                ))}
              </div>
            )
          ) : (
            <ActivityLog tasks={tasks} />
          )
        )}

        {/* Pipelines list view */}
        {view === 'pipelines' && !selectedPipeline && (
          pipelinesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="shimmer h-32 rounded-2xl" />
              ))}
            </div>
          ) : (
            <PipelineList
              pipelines={pipelines}
              onSelect={(p) => { setSelectedPipeline(p); setView('pipelines') }}
              onCreate={() => setShowCreatePipeline(true)}
            />
          )
        )}

        {/* Pipeline detail view */}
        {selectedPipeline && (
          <PipelineBoard
            pipeline={selectedPipeline}
            onBack={() => setSelectedPipeline(null)}
            onRefresh={refreshPipeline}
            onUpdateStage={updateStage}
            onDeleteStage={deleteStage}
            onAddStage={addStage}
            onCreateItem={createItem}
            onMoveItem={moveItem}
            onUpdateItem={updateItem}
            onDeleteItem={deleteItem}
            onDeletePipeline={deletePipeline}
          />
        )}
      </main>

      {/* Task modals */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      )}
      {showCreate && (
        <CreateTaskModal
          onClose={() => setShowCreate(false)}
          onCreate={createTask}
        />
      )}

      {/* Pipeline modals */}
      {showCreatePipeline && (
        <CreatePipelineModal
          onClose={() => setShowCreatePipeline(false)}
          onCreate={createPipeline}
        />
      )}
    </div>
  )
}
