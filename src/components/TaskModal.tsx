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
    <div className="fixed inset-0 modal-overlay flex items-start justify-center pt-[10vh] z-50 px-4" onClick={onClose}>
      <div className="modal-panel rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b border-white/[0.06] flex items-start justify-between gap-3">
          {editing ? (
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="glass-input rounded-xl text-[15px] font-semibold flex-1 px-3 py-1.5 text-white/90"
              autoFocus
            />
          ) : (
            <h2 className="text-[15px] font-semibold flex-1 text-white/90 tracking-tight">{task.title}</h2>
          )}
          <div className="flex gap-2 flex-shrink-0">
            {editing ? (
              <button onClick={save} className="btn-primary text-[12px] px-3 py-1.5 rounded-lg text-white font-medium">Save</button>
            ) : (
              <button onClick={() => setEditing(true)} className="text-[12px] px-3 py-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all">Edit</button>
            )}
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Meta */}
          <div className="flex flex-wrap gap-2 text-[12px]">
            {editing ? (
              <>
                <select value={status} onChange={e => setStatus(e.target.value as Status)} className="glass-input rounded-lg px-2.5 py-1.5 text-white/70 text-[12px]">
                  {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
                <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className="glass-input rounded-lg px-2.5 py-1.5 text-white/70 text-[12px]">
                  {(['critical','high','medium','low'] as Priority[]).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <label className="flex items-center gap-1.5 text-white/40 cursor-pointer hover:text-white/60 transition-colors">
                  <input type="checkbox" checked={needsHuman} onChange={e => setNeedsHuman(e.target.checked)} className="rounded accent-accent" />
                  🖐️ Human input
                </label>
              </>
            ) : (
              <>
                <span className="bg-white/[0.05] px-2.5 py-1 rounded-lg text-white/40 font-medium">{COLUMNS.find(c => c.key === task.status)?.label}</span>
                <span className={`px-2.5 py-1 rounded-lg font-medium ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                {task.needs_human_input && <span className="px-2.5 py-1 rounded-lg bg-amber-400/10 text-amber-300/70 font-medium">🖐️ Needs human</span>}
              </>
            )}
          </div>

          {/* Description */}
          {editing ? (
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="glass-input w-full rounded-xl p-3 text-[13px] text-white/60 resize-none"
              placeholder="Description..."
            />
          ) : task.description ? (
            <p className="text-[13px] text-white/40 whitespace-pre-wrap leading-relaxed">{task.description}</p>
          ) : null}

          {/* Sub-tasks */}
          <div>
            <h3 className="text-[11px] font-semibold text-white/25 uppercase tracking-wider mb-3">Sub-tasks</h3>
            <div className="space-y-1.5">
              {task.sub_tasks.map((sub, idx) => (
                <div key={sub.id} className="flex items-center gap-2.5 text-[13px] group py-1 px-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                  <input type="checkbox" checked={sub.done} onChange={() => toggleSubTask(idx)} className="rounded accent-accent" />
                  <span className={`flex-1 ${sub.done ? 'line-through text-white/20' : 'text-white/60'} transition-colors`}>{sub.title}</span>
                  <button onClick={() => removeSubTask(idx)} className="text-white/15 hover:text-red-400/70 ml-auto opacity-0 group-hover:opacity-100 transition-all text-xs">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <input
                value={newSubTask}
                onChange={e => setNewSubTask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSubTask()}
                placeholder="Add sub-task..."
                className="glass-input flex-1 rounded-lg px-3 py-1.5 text-[12px] text-white/60"
              />
              <button onClick={addSubTask} className="text-[12px] px-3 py-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all font-medium">Add</button>
            </div>
          </div>

          {/* Agent Logs */}
          {task.agent_logs.length > 0 && (
            <div>
              <h3 className="text-[11px] font-semibold text-white/25 uppercase tracking-wider mb-3">Agent Logs</h3>
              <div className="space-y-1 max-h-40 overflow-y-auto rounded-xl bg-white/[0.02] p-3">
                {task.agent_logs.map((log, idx) => (
                  <div key={idx} className="text-[11px] text-white/30 font-mono leading-relaxed">
                    <span className="text-white/15">{new Date(log.timestamp).toLocaleString()}</span>
                    {log.agent && <span className="text-accent/60 ml-1.5">[{log.agent}]</span>}
                    <span className="text-white/40 ml-1.5">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-[11px] text-white/15 pt-3 border-t border-white/[0.04]">
            <span>Created {new Date(task.created_at).toLocaleString()}</span>
            <button
              onClick={() => { if (confirm('Delete this task?')) onDelete(task.id) }}
              className="text-red-400/40 hover:text-red-400/70 transition-colors font-medium"
            >
              Delete task
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
