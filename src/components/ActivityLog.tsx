'use client'

import { Task, AgentLog, COLUMNS } from '@/lib/types'

interface LogEntry extends AgentLog {
  taskId: string
  taskTitle: string
}

interface Props {
  tasks: Task[]
}

const ACTION_ICONS: Record<string, string> = {
  created: '🆕',
  moved: '➡️',
  edited: '✏️',
  deleted: '🗑️',
  subtask: '☑️',
}

export function ActivityLog({ tasks }: Props) {
  // Collect all logs from all tasks, flatten with task context
  const allLogs: LogEntry[] = tasks.flatMap(task =>
    task.agent_logs.map(log => ({
      ...log,
      taskId: task.id,
      taskTitle: task.title,
    }))
  )

  // Sort by timestamp descending
  allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  if (allLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p className="text-[13px] font-medium">No activity yet</p>
        <p className="text-[12px] mt-1">Actions will appear here as tasks are managed</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-1">
        {allLogs.map((log, idx) => {
          const icon = ACTION_ICONS[log.action || ''] || '📝'
          const time = new Date(log.timestamp)
          const timeStr = time.toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
          })

          return (
            <div
              key={`${log.taskId}-${idx}`}
              className="flex items-start gap-3 px-4 py-2.5 rounded-xl hover:bg-black/[0.02] transition-colors"
            >
              <span className="text-sm mt-0.5 flex-shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-text leading-snug">
                  <span className="font-medium">{log.taskTitle}</span>
                  <span className="text-text-secondary"> — {log.message}</span>
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-text-tertiary">{timeStr}</span>
                  {log.agent && (
                    <span className="text-[11px] text-accent font-medium">{log.agent}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
