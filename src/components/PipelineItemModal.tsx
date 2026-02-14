'use client'

import { useState } from 'react'
import { PipelineItem, PipelineStage } from '@/lib/types'

interface Props {
  item: PipelineItem
  stages: PipelineStage[]
  onClose: () => void
  onUpdate: (data: Partial<PipelineItem>) => void
  onMove: (toStageId: string) => void
  onDelete: () => void
}

export function PipelineItemModal({ item, stages, onClose, onUpdate, onMove, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(item.title)
  const [description, setDescription] = useState(item.description)

  const currentStage = stages.find(s => s.id === item.current_stage_id)
  const currentIdx = stages.findIndex(s => s.id === item.current_stage_id)
  const nextStage = stages[currentIdx + 1]
  const prevStage = currentIdx > 0 ? stages[currentIdx - 1] : null

  const save = () => {
    onUpdate({ title, description })
    setEditing(false)
  }

  return (
    <div className="fixed inset-0 modal-overlay flex items-start justify-center pt-[10vh] z-50 px-4" onClick={onClose}>
      <div className="modal-panel rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b border-black/[0.06] flex items-start justify-between gap-3">
          {editing ? (
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="glass-input rounded-xl text-[15px] font-semibold flex-1 px-3 py-1.5"
              autoFocus
            />
          ) : (
            <h2 className="text-[15px] font-semibold flex-1 text-text tracking-tight">{item.title}</h2>
          )}
          <div className="flex gap-2 flex-shrink-0">
            {editing ? (
              <button onClick={save} className="btn-primary text-[12px] px-3 py-1.5 rounded-lg text-white font-medium">Save</button>
            ) : (
              <button onClick={() => setEditing(true)} className="text-[12px] px-3 py-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-black/[0.04]">Edit</button>
            )}
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text hover:bg-black/[0.04]">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Status + Stage */}
          <div className="flex flex-wrap gap-2 text-[12px]">
            <span className={`px-2.5 py-1 rounded-lg font-medium ${
              item.status === 'active' ? 'bg-accent/10 text-accent' :
              item.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
              item.status === 'failed' ? 'bg-critical/10 text-critical' :
              'bg-black/[0.04] text-text-tertiary'
            }`}>
              {item.status}
            </span>
            <span className="bg-black/[0.04] px-2.5 py-1 rounded-lg text-text-secondary font-medium">
              📍 {currentStage?.name || 'Unknown'}
            </span>
          </div>

          {/* Movement buttons */}
          <div className="flex gap-2">
            {prevStage && (
              <button
                onClick={() => onMove(prevStage.id)}
                className="flex-1 px-3 py-2 rounded-xl text-[12px] font-medium text-text-secondary bg-black/[0.03] hover:bg-black/[0.06] transition-all flex items-center justify-center gap-1.5"
              >
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 3L5 8l5 5"/>
                </svg>
                {prevStage.name}
              </button>
            )}
            {nextStage && (
              <button
                onClick={() => onMove(nextStage.id)}
                className="flex-1 px-3 py-2 rounded-xl text-[12px] font-medium text-white bg-accent hover:bg-accent-hover transition-all flex items-center justify-center gap-1.5"
              >
                {nextStage.name}
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 3l5 5-5 5"/>
                </svg>
              </button>
            )}
          </div>

          {/* Description */}
          {editing ? (
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="glass-input w-full rounded-xl p-3 text-[13px] resize-none"
              placeholder="Description..."
            />
          ) : item.description ? (
            <p className="text-[13px] text-text-secondary whitespace-pre-wrap leading-relaxed">{item.description}</p>
          ) : null}

          {/* Payload */}
          {Object.keys(item.payload).length > 0 && (
            <div>
              <h3 className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Payload Data</h3>
              <div className="rounded-xl bg-black/[0.02] p-3 overflow-x-auto">
                <pre className="text-[11px] text-text-secondary font-mono whitespace-pre-wrap">
                  {JSON.stringify(item.payload, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Activity log */}
          {item.logs.length > 0 && (
            <div>
              <h3 className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Activity</h3>
              <div className="space-y-1 max-h-40 overflow-y-auto rounded-xl bg-black/[0.02] p-3">
                {item.logs.map((log, idx) => (
                  <div key={idx} className="text-[11px] text-text-secondary leading-relaxed">
                    <span className="text-text-tertiary">{new Date(log.timestamp).toLocaleString()}</span>
                    {log.agent && <span className="text-accent ml-1.5">[{log.agent}]</span>}
                    <span className="ml-1.5">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-[11px] text-text-tertiary pt-3 border-t border-black/[0.04]">
            <span>Created {new Date(item.created_at).toLocaleString()}</span>
            <button
              onClick={() => { if (confirm('Delete this item?')) onDelete() }}
              className="text-critical/60 hover:text-critical transition-colors font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
