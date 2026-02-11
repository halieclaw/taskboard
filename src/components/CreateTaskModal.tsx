'use client'

import { useState } from 'react'
import { Task, Priority } from '@/lib/types'

interface Props {
  onClose: () => void
  onCreate: (data: Partial<Task>) => void
}

export function CreateTaskModal({ onClose, onCreate }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [needsHuman, setNeedsHuman] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onCreate({ title: title.trim(), description, priority, needs_human_input: needsHuman, status: 'inbox' })
  }

  return (
    <div className="fixed inset-0 modal-overlay flex items-start justify-center pt-[10vh] z-50 px-4" onClick={onClose}>
      <form onSubmit={submit} className="modal-panel rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-black/[0.06]">
          <h2 className="text-[15px] font-semibold text-text tracking-tight">New Task</h2>
        </div>
        <div className="p-5 space-y-4">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Task title..."
            className="glass-input w-full rounded-xl px-3.5 py-2.5 text-[13px]"
            autoFocus
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)..."
            rows={3}
            className="glass-input w-full rounded-xl px-3.5 py-2.5 text-[13px] resize-none"
          />
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as Priority)}
              className="glass-input rounded-xl px-3 py-2 text-[13px]"
            >
              <option value="critical">🔴 Critical</option>
              <option value="high">🟡 High</option>
              <option value="medium">🔵 Medium</option>
              <option value="low">⚪ Low</option>
            </select>
            <label className="flex items-center gap-2 text-[13px] text-text-secondary cursor-pointer hover:text-text transition-colors">
              <input type="checkbox" checked={needsHuman} onChange={e => setNeedsHuman(e.target.checked)} className="rounded accent-accent" />
              🖐️ Needs human input
            </label>
          </div>
        </div>
        <div className="p-5 border-t border-black/[0.04] flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[13px] text-text-secondary hover:text-text rounded-xl hover:bg-black/[0.04] transition-all font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim()}
            className="btn-primary px-5 py-2 text-white text-[13px] rounded-xl font-medium disabled:opacity-30 disabled:pointer-events-none"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  )
}
