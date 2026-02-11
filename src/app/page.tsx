'use client'

import { useState, useEffect, useCallback } from 'react'
import { Task, Status, COLUMNS } from '@/lib/types'
import { KanbanColumn } from '@/components/KanbanColumn'
import { TaskModal } from '@/components/TaskModal'
import { CreateTaskModal } from '@/components/CreateTaskModal'

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks')
      if (res.ok) setTasks(await res.json())
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const moveTask = async (id: string, status: Status) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  const handleDrop = (status: Status) => {
    if (draggedId) { moveTask(draggedId, status); setDraggedId(null) }
  }

  const updateTask = async (task: Task) => {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
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
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const task = await res.json()
      setTasks(prev => [task, ...prev])
      setShowCreate(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass-heavy sticky top-0 z-40 px-5 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-xl btn-primary flex items-center justify-center text-white text-sm font-bold shadow-lg">
            T
          </div>
          <div>
            <h1 className="text-[15px] font-semibold tracking-tight text-white/90">Taskboard</h1>
            <span className="text-[11px] text-white/30 font-medium tracking-wide">Agent Pipeline</span>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary px-4 py-2 text-white text-[13px] rounded-xl font-medium flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/></svg>
          New Task
        </button>
      </header>

      {/* Board */}
      <main className="flex-1 overflow-x-auto px-5 sm:px-8 py-6">
        {loading ? (
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
        )}
      </main>

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
    </div>
  )
}
