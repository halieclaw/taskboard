'use client'

import { Pipeline } from '@/lib/types'

interface Props {
  pipelines: Pipeline[]
  onSelect: (pipeline: Pipeline) => void
  onCreate: () => void
}

export function PipelineList({ pipelines, onSelect, onCreate }: Props) {
  if (pipelines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 opacity-30">
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
        </svg>
        <p className="text-[14px] font-medium mb-1">No pipelines yet</p>
        <p className="text-[12px] mb-5">Create your first agent assembly line</p>
        <button onClick={onCreate} className="btn-primary px-5 py-2.5 text-white text-[13px] rounded-xl font-medium flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/>
          </svg>
          New Pipeline
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
      {pipelines.map(p => {
        const activeItems = p.items.filter(i => i.status === 'active').length
        const completedItems = p.items.filter(i => i.status === 'completed').length
        const stageCount = p.stages.filter(s => !s.is_start && !s.is_end).length
        const activeAgents = p.stages.filter(s => s.agent_config.enabled && !s.is_end).length

        return (
          <div
            key={p.id}
            onClick={() => onSelect(p)}
            className="glass-card rounded-2xl p-5 cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-[14px] font-semibold text-text tracking-tight">{p.name}</h3>
                {p.description && (
                  <p className="text-[12px] text-text-tertiary mt-0.5 line-clamp-2">{p.description}</p>
                )}
              </div>
              <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent text-[14px] flex-shrink-0">
                ⚡
              </div>
            </div>

            {/* Stage flow indicator */}
            <div className="flex items-center gap-1 mb-4">
              {p.stages.map((s, i) => (
                <div key={s.id} className="flex items-center gap-1">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      s.is_start ? 'w-3 bg-emerald-400' :
                      s.is_end ? 'w-3 bg-text-tertiary/30' :
                      s.agent_config.enabled ? 'w-6 bg-accent/60' : 'w-6 bg-black/[0.06]'
                    }`}
                    title={s.name}
                  />
                  {i < p.stages.length - 1 && (
                    <svg width="6" height="6" viewBox="0 0 6 6" className="text-text-tertiary/40 flex-shrink-0">
                      <path d="M1 1l4 2-4 2" fill="none" stroke="currentColor" strokeWidth="1" />
                    </svg>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-text-tertiary font-medium">
              <span>{stageCount} stage{stageCount !== 1 ? 's' : ''}</span>
              <span className="w-0.5 h-0.5 rounded-full bg-text-tertiary/40" />
              <span>{activeItems} active</span>
              <span className="w-0.5 h-0.5 rounded-full bg-text-tertiary/40" />
              <span>{completedItems} done</span>
              {activeAgents > 0 && (
                <>
                  <span className="w-0.5 h-0.5 rounded-full bg-text-tertiary/40" />
                  <span className="text-accent">{activeAgents} agent{activeAgents !== 1 ? 's' : ''}</span>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
