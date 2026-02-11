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
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center pt-[10vh] z-50 px-4" onClick={onClose}>
      <form onSubmit={submit} className="bg-bg-card border border-border rounded-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold">New Task</h2>
        </div>
        <div className="p-5 space-y-4">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title..." className="w-full bg-bg-hover border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent" autoFocus />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)..." rows={3} className="w-full bg-bg-hover border border-border rounded-lg px-3 py-2 text-sm outline-none resize-none focus:border-accent" />
          <div className="flex flex-wrap gap-3 items-center">
            <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className="bg-bg-hover border border-border rounded-lg px-2 py-1.5 text-sm text-gray-300">
              <option value="critical">🔴 Critical</option>
              <option value="high">🟡 High</option>
              <option value="medium">🔵 Medium</option>
              <option value="low">⚪ Low</option>
            </select>
            <label className="flex items-center gap-1.5 text-sm text-gray-400 cursor-pointer">
              <input type="checkbox" checked={needsHuman} onChange={e => setNeedsHuman(e.target.checked)} />
              🖐️ Needs human input
            </label>
          </div>
        </div>
        <div className="p-5 border-t border-border flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-gray-400 hover:text-white">Cancel</button>
          <button type="submit" disabled={!title.trim()} className="px-4 py-1.5 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-sm rounded-lg font-medium">Create</button>
        </div>
      </form>
    </div>
  )
}
