export type Status = 'inbox' | 'planning' | 'in_progress' | 'review' | 'done'
export type Priority = 'critical' | 'high' | 'medium' | 'low'

export interface SubTask {
  id: string
  title: string
  done: boolean
}

export interface AgentLog {
  timestamp: string
  message: string
  agent?: string
  action?: string
}

export interface Task {
  id: string
  title: string
  description: string
  status: Status
  priority: Priority
  needs_human_input: boolean
  sub_tasks: SubTask[]
  agent_logs: AgentLog[]
  created_at: string
  updated_at: string
}

export const COLUMNS: { key: Status; label: string }[] = [
  { key: 'inbox', label: 'Inbox' },
  { key: 'planning', label: 'Planning' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
]

export const PRIORITY_COLORS: Record<Priority, string> = {
  critical: 'bg-critical/10 text-critical',
  high: 'bg-high/10 text-high',
  medium: 'bg-medium/10 text-medium',
  low: 'bg-black/[0.04] text-text-tertiary',
}
