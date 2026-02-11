'use client'

import { useState } from 'react'
import { Task, Status, COLUMNS, PRIORITY_COLORS } from '@/lib/types'

interface Props {
  column: { key: Status; label: string }
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onDragStart: (id: string) => void
  onDrop: () => void
  onMoveTask: (id: string, status: Status) => void
}

const COLUMN_ACCENTS: Record<Status, string> = {
  inbox: 'from-white/10 to-white/5',
  planning: 'from-violet-400/15 to-violet-400/5',
  in_progress: 'from-blue-400/15 to-blue-400/5',
  review: 'from-amber-400/15 to-amber-400/5',
  done: 'from-emerald-400/15 to-emerald-400/5',
}

const COLUMN_DOTS: Record<Status, string> = {
  inbox: 'bg-white/40',
  planning: 'bg-violet-400/60',
  in_progress: 'bg-blue-400/60',
  review: 'bg-amber-400/60',
  done: 'bg-emerald-400/60',
}

export function KanbanColumn({ column, tasks, onTaskClick, onDragStart, onDrop, onMoveTask }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const colIdx = COLUMNS.findIndex(c => c.key === column.key)
  const nextCol = COLUMNS[colIdx + 1]

  return (
    <div
      className={`w-72 flex-shrink-0 flex flex-col rounded-2xl p-3 transition-colors duration-200 ${
        dragOver ? 'bg-accent/[0.04]' : ''
      }`}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={() => { setDragOver(false); onDrop() }}
    >
      {/* Column header */}
      <div className="flex items-center gap-2.5 mb-4 px-1">
        <div className={`w-2 h-2 rounded-full ${COLUMN_DOTS[column.key]}`} />
        <h2 className="text-[13px] font-semibold text-white/50 tracking-wide">{column.label}</h2>
        <span className="column-count text-[11px] text-white/30 px-2 py-0.5 rounded-full font-medium">
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2.5 min-h-[200px]">
        {tasks.map((task, idx) => (
          <div
            key={task.id}
            draggable
            onDragStart={() => onDragStart(task.id)}
            onClick={() => onTaskClick(task)}
            className="glass-card rounded-2xl p-3.5 cursor-pointer group"
            style={{ animationDelay: `${idx * 40}ms`, animation: 'cardIn 0.3s ease both' }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-[13px] font-medium text-white/85 leading-snug line-clamp-2 tracking-tight">
                {task.title}
              </h3>
              {task.needs_human_input && (
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-400/10 flex items-center justify-center text-[10px]" title="Needs human input">
                  🖐️
                </span>
              )}
            </div>

            {task.description && (
              <p className="text-[12px] text-white/30 line-clamp-2 mb-2.5 leading-relaxed">{task.description}</p>
            )}

            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-lg font-medium ${PRIORITY_COLORS[task.priority]}`}>
                {task.priority}
              </span>
              {task.sub_tasks.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-12 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent/60 transition-all duration-500"
                      style={{ width: `${(task.sub_tasks.filter(s => s.done).length / task.sub_tasks.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-white/25 font-medium">
                    {task.sub_tasks.filter(s => s.done).length}/{task.sub_tasks.length}
                  </span>
                </div>
              )}
              {nextCol && (
                <button
                  onClick={e => { e.stopPropagation(); onMoveTask(task.id, nextCol.key) }}
                  className="ml-auto w-5 h-5 rounded-md flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/[0.06] opacity-0 group-hover:opacity-100 transition-all duration-200"
                  title={`Move to ${nextCol.label}`}
                >
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 3l5 5-5 5"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
