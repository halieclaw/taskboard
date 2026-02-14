'use client'

import { useState } from 'react'
import { Pipeline, PipelineStage, PipelineItem, AgentConfig, CRON_PRESETS } from '@/lib/types'
import { StageConfigModal } from './StageConfigModal'
import { PipelineItemModal } from './PipelineItemModal'

interface Props {
  pipeline: Pipeline
  onBack: () => void
  onRefresh: () => void
  onUpdateStage: (stageId: string, data: { name?: string; agent_config?: Partial<AgentConfig> }) => void
  onDeleteStage: (stageId: string) => void
  onAddStage: (name: string) => void
  onCreateItem: (title: string, description?: string, stageId?: string) => void
  onMoveItem: (itemId: string, toStageId: string) => void
  onUpdateItem: (itemId: string, data: Partial<PipelineItem>) => void
  onDeleteItem: (itemId: string) => void
  onDeletePipeline: () => void
}

const STAGE_DOTS: Record<string, string> = {
  start: 'bg-emerald-500',
  end: 'bg-text-tertiary/40',
  active: 'bg-accent',
  inactive: 'bg-black/[0.15]',
}

function formatCron(ms: number): string {
  return CRON_PRESETS.find(p => p.value === ms)?.label || `${Math.round(ms / 60000)}m`
}

export function PipelineBoard({
  pipeline, onBack, onRefresh, onUpdateStage, onDeleteStage, onAddStage,
  onCreateItem, onMoveItem, onUpdateItem, onDeleteItem, onDeletePipeline,
}: Props) {
  const [configStage, setConfigStage] = useState<PipelineStage | null>(null)
  const [selectedItem, setSelectedItem] = useState<PipelineItem | null>(null)
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const [showAddItem, setShowAddItem] = useState<string | null>(null)
  const [newItemTitle, setNewItemTitle] = useState('')
  const [showAddStage, setShowAddStage] = useState(false)
  const [newStageName, setNewStageName] = useState('')

  const handleDrop = (stageId: string) => {
    if (draggedItemId) {
      onMoveItem(draggedItemId, stageId)
      setDraggedItemId(null)
    }
    setDragOverStage(null)
  }

  const addItem = (stageId: string) => {
    if (!newItemTitle.trim()) return
    onCreateItem(newItemTitle.trim(), '', stageId)
    setNewItemTitle('')
    setShowAddItem(null)
  }

  const addStage = () => {
    if (!newStageName.trim()) return
    onAddStage(newStageName.trim())
    setNewStageName('')
    setShowAddStage(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Pipeline header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-text-secondary hover:text-text hover:bg-black/[0.04] transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5"/>
          </svg>
        </button>
        <div className="flex-1">
          <h2 className="text-[16px] font-semibold text-text tracking-tight">{pipeline.name}</h2>
          {pipeline.description && (
            <p className="text-[12px] text-text-tertiary">{pipeline.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddStage(true)}
            className="px-3 py-1.5 text-[12px] text-text-secondary hover:text-text rounded-lg hover:bg-black/[0.04] transition-all font-medium"
          >
            + Add Stage
          </button>
          <button
            onClick={() => { if (confirm('Delete this entire pipeline?')) onDeletePipeline() }}
            className="px-3 py-1.5 text-[12px] text-critical/60 hover:text-critical rounded-lg hover:bg-critical/5 transition-all font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Add stage inline */}
      {showAddStage && (
        <div className="flex items-center gap-2 mb-4 max-w-xs">
          <input
            value={newStageName}
            onChange={e => setNewStageName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addStage()}
            placeholder="Stage name..."
            className="glass-input flex-1 rounded-lg px-3 py-1.5 text-[12px]"
            autoFocus
          />
          <button onClick={addStage} className="btn-primary px-3 py-1.5 text-white text-[11px] rounded-lg font-medium">Add</button>
          <button onClick={() => setShowAddStage(false)} className="text-[11px] text-text-tertiary hover:text-text">Cancel</button>
        </div>
      )}

      {/* Stages as kanban columns */}
      <div className="flex gap-4 min-w-max h-full overflow-x-auto">
        {pipeline.stages.map((stage, stageIdx) => {
          const items = pipeline.items.filter(i => i.current_stage_id === stage.id)
          const nextStage = pipeline.stages[stageIdx + 1]
          const dotColor = stage.is_start ? STAGE_DOTS.start :
                          stage.is_end ? STAGE_DOTS.end :
                          stage.agent_config.enabled ? STAGE_DOTS.active : STAGE_DOTS.inactive

          return (
            <div
              key={stage.id}
              className={`w-72 flex-shrink-0 flex flex-col rounded-2xl p-3 transition-colors duration-200 ${
                dragOverStage === stage.id ? 'bg-accent/[0.04]' : ''
              }`}
              onDragOver={e => { e.preventDefault(); setDragOverStage(stage.id) }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={() => handleDrop(stage.id)}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                <h3 className="text-[13px] font-semibold text-text-secondary tracking-wide flex-1">{stage.name}</h3>
                <span className="text-[11px] text-text-tertiary bg-black/[0.04] px-2 py-0.5 rounded-full font-medium">
                  {items.length}
                </span>
                {!stage.is_end && (
                  <button
                    onClick={() => setConfigStage(stage)}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-text-tertiary hover:text-text hover:bg-black/[0.04] transition-all"
                    title="Configure stage"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* Agent badge */}
              {stage.agent_config.enabled && !stage.is_end && (
                <div className="mx-1 mb-2 px-2.5 py-1.5 rounded-lg bg-accent/[0.06] border border-accent/10 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-[10px] text-accent font-medium">
                    Agent · {formatCron(stage.agent_config.cron_interval_ms)}
                    {stage.agent_config.movement_logic === 'auto' ? ' · auto-move' : stage.agent_config.movement_logic === 'approval' ? ' · needs approval' : ''}
                  </span>
                </div>
              )}

              {/* Items */}
              <div className="flex-1 space-y-2 min-h-[120px]">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDraggedItemId(item.id)}
                    onClick={() => setSelectedItem(item)}
                    className="glass-card rounded-xl p-3.5 cursor-pointer group"
                    style={{ animationDelay: `${idx * 40}ms`, animation: 'cardIn 0.3s ease both' }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="text-[13px] font-medium text-text leading-snug line-clamp-2 tracking-tight">
                        {item.title}
                      </h4>
                      <span className={`flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-md font-medium ${
                        item.status === 'active' ? 'bg-accent/10 text-accent' :
                        item.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                        item.status === 'failed' ? 'bg-critical/10 text-critical' :
                        'bg-black/[0.04] text-text-tertiary'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-text-tertiary line-clamp-2 mb-2">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-text-tertiary">
                        {Object.keys(item.payload).length > 0 && `${Object.keys(item.payload).length} data keys`}
                      </span>
                      {nextStage && (
                        <button
                          onClick={e => { e.stopPropagation(); onMoveItem(item.id, nextStage.id) }}
                          className="w-5 h-5 rounded-md flex items-center justify-center text-text-tertiary hover:text-text hover:bg-black/[0.04] opacity-0 group-hover:opacity-100 transition-all"
                          title={`Move to ${nextStage.name}`}
                        >
                          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 3l5 5-5 5"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add item (only on non-end stages) */}
                {!stage.is_end && (
                  showAddItem === stage.id ? (
                    <div className="px-2 py-2">
                      <input
                        value={newItemTitle}
                        onChange={e => setNewItemTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') addItem(stage.id)
                          if (e.key === 'Escape') setShowAddItem(null)
                        }}
                        placeholder="Item title..."
                        className="glass-input w-full rounded-lg px-3 py-1.5 text-[12px] mb-1.5"
                        autoFocus
                      />
                      <div className="flex gap-1.5">
                        <button onClick={() => addItem(stage.id)} className="btn-primary px-2.5 py-1 text-white text-[11px] rounded-lg font-medium">Add</button>
                        <button onClick={() => setShowAddItem(null)} className="text-[11px] text-text-tertiary hover:text-text px-2">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddItem(stage.id)}
                      className="w-full px-3 py-2 text-[12px] text-text-tertiary hover:text-text-secondary rounded-xl hover:bg-black/[0.02] transition-all text-left"
                    >
                      + Add item
                    </button>
                  )
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modals */}
      {configStage && (
        <StageConfigModal
          stage={configStage}
          onClose={() => setConfigStage(null)}
          onSave={(stage, config) => {
            onUpdateStage(stage.id, { name: stage.name, agent_config: config })
            setConfigStage(null)
          }}
          onDelete={!configStage.is_start && !configStage.is_end ? () => {
            onDeleteStage(configStage.id)
            setConfigStage(null)
          } : undefined}
        />
      )}
      {selectedItem && (
        <PipelineItemModal
          item={selectedItem}
          stages={pipeline.stages}
          onClose={() => setSelectedItem(null)}
          onUpdate={(data) => {
            onUpdateItem(selectedItem.id, data)
            setSelectedItem({ ...selectedItem, ...data })
          }}
          onMove={(toStageId) => {
            onMoveItem(selectedItem.id, toStageId)
            setSelectedItem(null)
          }}
          onDelete={() => {
            onDeleteItem(selectedItem.id)
            setSelectedItem(null)
          }}
        />
      )}
    </div>
  )
}
