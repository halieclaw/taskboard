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
      <header className="border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white text-sm font-bold">T</div>
          <h1 className="text-lg font-semibold tracking-tight">Taskboard</h1>
          <span className="text-xs text-gray-500 hidden sm:inline">Agent Pipeline</span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-sm rounded-lg transition-colors font-medium"
        >
          + New Task
        </button>
      </header>

      <main className="flex-1 overflow-x-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>
        ) : (
          <div className="flex gap-4 min-w-max h-full">
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
