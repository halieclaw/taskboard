'use client'

import { Task, Status, COLUMNS, PRIORITY_COLORS } from '@/lib/types'

interface Props {
  column: { key: Status; label: string }
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onDragStart: (id: string) => void
  onDrop: () => void
  onMoveTask: (id: string, status: Status) => void
}

export function KanbanColumn({ column, tasks, onTaskClick, onDragStart, onDrop, onMoveTask }: Props) {
  const colIdx = COLUMNS.findIndex(c => c.key === column.key)
  const nextCol = COLUMNS[colIdx + 1]

  return (
    <div
      className="w-72 flex-shrink-0 flex flex-col"
      onDragOver={e => e.preventDefault()}
      onDrop={onDrop}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{column.label}</h2>
        <span className="text-xs bg-bg-hover text-gray-500 px-1.5 py-0.5 rounded-full">{tasks.length}</span>
      </div>
      <div className="flex-1 space-y-2 min-h-[200px]">
        {tasks.map(task => (
          <div
            key={task.id}
            draggable
            onDragStart={() => onDragStart(task.id)}
            onClick={() => onTaskClick(task)}
            className="bg-bg-card border border-border rounded-lg p-3 cursor-pointer hover:border-accent/40 transition-all group"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="text-sm font-medium text-gray-200 leading-snug line-clamp-2">{task.title}</h3>
              {task.needs_human_input && (
                <span className="flex-shrink-0 text-xs" title="Needs human input">🖐️</span>
              )}
            </div>
            {task.description && (
              <p className="text-xs text-gray-500 line-clamp-2 mb-2">{task.description}</p>
            )}
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${PRIORITY_COLORS[task.priority]}`}>
                {task.priority}
              </span>
              {task.sub_tasks.length > 0 && (
                <span className="text-[10px] text-gray-500">
                  {task.sub_tasks.filter(s => s.done).length}/{task.sub_tasks.length}
                </span>
              )}
              {nextCol && (
                <button
                  onClick={e => { e.stopPropagation(); onMoveTask(task.id, nextCol.key) }}
                  className="ml-auto text-[10px] text-gray-600 hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity"
                  title={`Move to ${nextCol.label}`}
                >
                  →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
