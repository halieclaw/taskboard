'use client'

import { useState } from 'react'

interface Props {
  onClose: () => void
  onCreate: (data: { name: string; description: string; stages: string[] }) => void
}

export function CreatePipelineModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [stages, setStages] = useState<string[]>([''])
  const [newStage, setNewStage] = useState('')

  const addStage = () => {
    if (!newStage.trim()) return
    setStages([...stages.filter(s => s), newStage.trim()])
    setNewStage('')
  }

  const removeStage = (idx: number) => {
    setStages(stages.filter((_, i) => i !== idx))
  }

  const updateStage = (idx: number, val: string) => {
    const updated = [...stages]
    updated[idx] = val
    setStages(updated)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const validStages = stages.filter(s => s.trim())
    onCreate({ name: name.trim(), description, stages: validStages })
  }

  return (
    <div className="fixed inset-0 modal-overlay flex items-start justify-center pt-[10vh] z-50 px-4" onClick={onClose}>
      <form onSubmit={submit} className="modal-panel rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-black/[0.06]">
          <h2 className="text-[15px] font-semibold text-text tracking-tight">New Pipeline</h2>
          <p className="text-[12px] text-text-tertiary mt-0.5">Define your agent assembly line</p>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-2">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Local Business Prospector"
              className="glass-input w-full rounded-xl px-3.5 py-2.5 text-[13px]"
              autoFocus
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-2">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What does this pipeline do?"
              rows={2}
              className="glass-input w-full rounded-xl px-3.5 py-2.5 text-[13px] resize-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-2">Pipeline Stages</label>
            <p className="text-[11px] text-text-tertiary mb-3">Start and End states are automatic. Define the stages in between.</p>

            {/* Visual flow */}
            <div className="space-y-1.5 mb-3">
              {/* Start - locked */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200/50">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[12px] font-medium text-emerald-700">Start</span>
                <span className="text-[10px] text-emerald-500 ml-auto">auto</span>
              </div>

              {/* User stages */}
              {stages.map((stage, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/[0.02] border border-black/[0.06]">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <input
                      value={stage}
                      onChange={e => updateStage(idx, e.target.value)}
                      placeholder={`Stage ${idx + 1}...`}
                      className="flex-1 bg-transparent text-[12px] font-medium outline-none placeholder:text-text-tertiary"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStage(idx)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-text-tertiary hover:text-critical hover:bg-critical/5 transition-all"
                  >
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                    </svg>
                  </button>
                </div>
              ))}

              {/* Add stage */}
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-black/[0.1] hover:border-accent/30 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-black/[0.08]" />
                  <input
                    value={newStage}
                    onChange={e => setNewStage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addStage())}
                    placeholder="Add stage..."
                    className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-text-tertiary"
                  />
                </div>
                <button
                  type="button"
                  onClick={addStage}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-text-tertiary hover:text-accent hover:bg-accent/5 transition-all"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/>
                  </svg>
                </button>
              </div>

              {/* End - locked */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/[0.02] border border-black/[0.06]">
                <div className="w-2 h-2 rounded-full bg-text-tertiary" />
                <span className="text-[12px] font-medium text-text-tertiary">End</span>
                <span className="text-[10px] text-text-tertiary ml-auto">auto</span>
              </div>
            </div>
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
            disabled={!name.trim() || stages.filter(s => s.trim()).length === 0}
            className="btn-primary px-5 py-2 text-white text-[13px] rounded-xl font-medium disabled:opacity-30 disabled:pointer-events-none"
          >
            Create Pipeline
          </button>
        </div>
      </form>
    </div>
  )
}
