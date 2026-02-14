'use client'

import { useState } from 'react'
import { PipelineStage, AgentConfig, MODEL_OPTIONS, CRON_PRESETS } from '@/lib/types'

interface Props {
  stage: PipelineStage
  onClose: () => void
  onSave: (stage: PipelineStage, config: Partial<AgentConfig>) => void
  onDelete?: () => void
}

export function StageConfigModal({ stage, onClose, onSave, onDelete }: Props) {
  const [name, setName] = useState(stage.name)
  const [model, setModel] = useState(stage.agent_config.model)
  const [prompt, setPrompt] = useState(stage.agent_config.prompt)
  const [cronMs, setCronMs] = useState(stage.agent_config.cron_interval_ms)
  const [completionCriteria, setCompletionCriteria] = useState(stage.agent_config.completion_criteria)
  const [movementLogic, setMovementLogic] = useState(stage.agent_config.movement_logic)
  const [enabled, setEnabled] = useState(stage.agent_config.enabled)

  const save = () => {
    onSave(stage, {
      model,
      prompt,
      cron_interval_ms: cronMs,
      completion_criteria: completionCriteria,
      movement_logic: movementLogic,
      enabled,
    })
  }

  const canDelete = !stage.is_start && !stage.is_end
  const isEnd = stage.is_end

  return (
    <div className="fixed inset-0 modal-overlay flex items-start justify-center pt-[8vh] z-50 px-4" onClick={onClose}>
      <div className="modal-panel rounded-2xl w-full max-w-lg max-h-[84vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b border-black/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-text tracking-tight">Stage Configuration</h2>
            <p className="text-[12px] text-text-tertiary mt-0.5">
              {isEnd ? 'End state — items here are complete' : stage.is_start ? 'Start state — entry point for items' : 'Configure the agent for this stage'}
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text hover:bg-black/[0.04]">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Stage Name */}
          <div>
            <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-2">Stage Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={stage.is_start || stage.is_end}
              className="glass-input w-full rounded-xl px-3.5 py-2.5 text-[13px] disabled:opacity-50"
            />
          </div>

          {!isEnd && (
            <>
              {/* Agent Toggle */}
              <div className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-black/[0.02] border border-black/[0.06]">
                <div>
                  <p className="text-[13px] font-medium text-text">Enable Agent</p>
                  <p className="text-[11px] text-text-tertiary">Automatically process items in this stage</p>
                </div>
                <button
                  onClick={() => setEnabled(!enabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${enabled ? 'bg-accent' : 'bg-black/[0.1]'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${enabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {enabled && (
                <>
                  {/* Model */}
                  <div>
                    <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-2">Model</label>
                    <select
                      value={model}
                      onChange={e => setModel(e.target.value)}
                      className="glass-input w-full rounded-xl px-3.5 py-2.5 text-[13px]"
                    >
                      {MODEL_OPTIONS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Prompt */}
                  <div>
                    <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-2">Agent Prompt</label>
                    <p className="text-[11px] text-text-tertiary mb-2">What should this agent do when it finds items in this stage?</p>
                    <textarea
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      rows={5}
                      placeholder="e.g. Research the business website. Analyze their current design, identify issues, and document opportunities for improvement. Add your findings to the item payload."
                      className="glass-input w-full rounded-xl px-3.5 py-2.5 text-[13px] resize-none font-mono"
                    />
                  </div>

                  {/* Cron Interval */}
                  <div>
                    <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-2">Check Interval</label>
                    <p className="text-[11px] text-text-tertiary mb-2">How often should this agent check for new items?</p>
                    <div className="flex flex-wrap gap-2">
                      {CRON_PRESETS.map(preset => (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setCronMs(preset.value)}
                          className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                            cronMs === preset.value
                              ? 'bg-accent text-white shadow-sm'
                              : 'bg-black/[0.03] text-text-secondary hover:bg-black/[0.06]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Completion Criteria */}
                  <div>
                    <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-2">Completion Criteria</label>
                    <p className="text-[11px] text-text-tertiary mb-2">How does the agent know when an item is done at this stage?</p>
                    <textarea
                      value={completionCriteria}
                      onChange={e => setCompletionCriteria(e.target.value)}
                      rows={3}
                      placeholder="e.g. When the research payload contains at least 3 improvement opportunities and a summary"
                      className="glass-input w-full rounded-xl px-3.5 py-2.5 text-[13px] resize-none"
                    />
                  </div>

                  {/* Movement Logic */}
                  <div>
                    <label className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider block mb-2">Movement Logic</label>
                    <p className="text-[11px] text-text-tertiary mb-2">How should items move to the next stage?</p>
                    <div className="space-y-2">
                      {[
                        { key: 'auto' as const, label: 'Automatic', desc: 'Agent moves item when criteria met' },
                        { key: 'approval' as const, label: 'Approval Required', desc: 'Agent marks done, human approves movement' },
                        { key: 'manual' as const, label: 'Manual Only', desc: 'Human moves items manually' },
                      ].map(opt => (
                        <label
                          key={opt.key}
                          className={`flex items-start gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all ${
                            movementLogic === opt.key
                              ? 'bg-accent/[0.06] border border-accent/20'
                              : 'bg-black/[0.02] border border-transparent hover:border-black/[0.06]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="movement"
                            value={opt.key}
                            checked={movementLogic === opt.key}
                            onChange={() => setMovementLogic(opt.key)}
                            className="mt-0.5 accent-accent"
                          />
                          <div>
                            <p className="text-[12px] font-medium text-text">{opt.label}</p>
                            <p className="text-[11px] text-text-tertiary">{opt.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-black/[0.04] flex items-center justify-between">
          <div>
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => { if (confirm('Delete this stage? Items in it will need to be moved.')) onDelete() }}
                className="text-[12px] text-critical/60 hover:text-critical transition-colors font-medium"
              >
                Delete stage
              </button>
            )}
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] text-text-secondary hover:text-text rounded-xl hover:bg-black/[0.04] transition-all font-medium"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="btn-primary px-5 py-2 text-white text-[13px] rounded-xl font-medium"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
