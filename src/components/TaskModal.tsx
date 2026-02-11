'use client'

import { useState } from 'react'
import { Task, Status, Priority, COLUMNS, PRIORITY_COLORS } from '@/lib/types'

interface Props {
  task: Task
  onClose: () => void
  onUpdate: (task: Task) => void
  onDelete: (id: string) => void
}

export function TaskModal({ task, onClose, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [priority, setPriority] = useState<Priority>(task.priority)
  const [status, setStatus] = useState<Status>(task.status)
  const [needsHuman, setNeedsHuman] = useState(task.needs_human_input)
  const [newSubTask, setNewSubTask] = useState('')

  const save = () => {
    onUpdate({ ...task, title, description, priority, status, needs_human_input: needsHuman })
    setEditing(false)
  }

  const toggleSubTask = (idx: number) => {
    const updated = [...task.sub_tasks]
    updated[idx] = { ...updated[idx], done: !updated[idx].done }
    onUpdate({ ...task, sub_tasks: updated })
  }

  const addSubTask = () => {
    if (!newSubTask.trim()) return
    const sub = { id: crypto.randomUUID(), title: newSubTask.trim(), done: false }
    onUpdate({ ...task, sub_tasks: [...task.sub_tasks, sub] })
    setNewSubTask('')
  }

  const removeSubTask = (idx: number) => {
    onUpdate({ ...task, sub_tasks: task.sub_tasks.filter((_, i) => i !== idx) })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center pt-[10vh] z-50 px-4" onClick={onClose}>
      <div className="bg-bg-card border border-border rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-border flex items-start justify-between gap-3">
          {editing ? (
            <input value={title} onChange={e => setTitle(e.target.value)} className="bg-transparent text-lg font-semibold flex-1 outline-none border-b border-accent pb-1" autoFocus />
          ) : (
            <h2 className="text-lg font-semibold flex-1">{task.title}</h2>
          )}
          <div className="flex gap-2 flex-shrink-0">
            {editing ? (
              <button onClick={save} className="text-xs px-2 py-1 bg-accent rounded text-white">Save</button>
            ) : (
              <button onClick={() => setEditing(true)} className="text-xs px-2 py-1 bg-bg-hover rounded text-gray-400 hover:text-white">Edit</button>
            )}
            <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none">&times;</button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Meta */}
          <div className="flex flex-wrap gap-2 text-xs">
            {editing ? (
              <>
                <select value={status} onChange={e => setStatus(e.target.value as Status)} className="bg-bg-hover border border-border rounded px-2 py-1 text-gray-300">
                  {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
                <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className="bg-bg-hover border border-border rounded px-2 py-1 text-gray-300">
                  {(['critical','high','medium','low'] as Priority[]).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <label className="flex items-center gap-1 text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={needsHuman} onChange={e => setNeedsHuman(e.target.checked)} className="rounded" />
                  🖐️ Human input
                </label>
              </>
            ) : (
              <>
                <span className="bg-bg-hover px-2 py-1 rounded text-gray-400">{COLUMNS.find(c => c.key === task.status)?.label}</span>
                <span className={`px-2 py-1 rounded border ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                {task.needs_human_input && <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">🖐️ Needs human</span>}
              </>
            )}
          </div>

          {/* Description */}
          {editing ? (
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-bg-hover border border-border rounded-lg p-3 text-sm text-gray-300 outline-none resize-none" placeholder="Description..." />
          ) : task.description ? (
            <p className="text-sm text-gray-400 whitespace-pre-wrap">{task.description}</p>
          ) : null}

          {/* Sub-tasks */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Sub-tasks</h3>
            <div className="space-y-1">
              {task.sub_tasks.map((sub, idx) => (
                <div key={sub.id} className="flex items-center gap-2 text-sm group">
                  <input type="checkbox" checked={sub.done} onChange={() => toggleSubTask(idx)} className="rounded" />
                  <span className={sub.done ? 'line-through text-gray-600' : 'text-gray-300'}>{sub.title}</span>
                  <button onClick={() => removeSubTask(idx)} className="text-gray-600 hover:text-red-400 ml-auto opacity-0 group-hover:opacity-100 text-xs">×</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input value={newSubTask} onChange={e => setNewSubTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSubTask()} placeholder="Add sub-task..." className="flex-1 bg-bg-hover border border-border rounded px-2 py-1 text-xs text-gray-300 outline-none" />
              <button onClick={addSubTask} className="text-xs px-2 py-1 bg-bg-hover rounded text-gray-400 hover:text-white">Add</button>
            </div>
          </div>

          {/* Agent Logs */}
          {task.agent_logs.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Agent Logs</h3>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {task.agent_logs.map((log, idx) => (
                  <div key={idx} className="text-xs text-gray-500 font-mono">
                    <span className="text-gray-600">{new Date(log.timestamp).toLocaleString()}</span>
                    {log.agent && <span className="text-accent ml-1">[{log.agent}]</span>}
                    <span className="text-gray-400 ml-1">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps & delete */}
          <div className="flex items-center justify-between text-[10px] text-gray-600 pt-2 border-t border-border">
            <span>Created {new Date(task.created_at).toLocaleString()}</span>
            <button onClick={() => { if (confirm('Delete this task?')) onDelete(task.id) }} className="text-red-500/60 hover:text-red-400">Delete task</button>
          </div>
        </div>
      </div>
    </div>
  )
}
