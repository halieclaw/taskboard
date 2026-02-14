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

// ── Pipeline Types ──────────────────────────────────────────

export interface AgentConfig {
  model: string
  prompt: string
  cron_interval_ms: number
  completion_criteria: string
  movement_logic: 'auto' | 'manual' | 'approval'
  enabled: boolean
}

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  model: '',
  prompt: '',
  cron_interval_ms: 1800000,
  completion_criteria: '',
  movement_logic: 'auto',
  enabled: false,
}

export interface PipelineStage {
  id: string
  pipeline_id: string
  name: string
  position: number
  is_start: boolean
  is_end: boolean
  agent_config: AgentConfig
  created_at: string
  updated_at: string
}

export interface PipelineItem {
  id: string
  pipeline_id: string
  current_stage_id: string
  title: string
  description: string
  payload: Record<string, any>
  status: 'active' | 'completed' | 'failed' | 'paused'
  logs: AgentLog[]
  created_at: string
  updated_at: string
}

export interface Pipeline {
  id: string
  name: string
  description: string
  stages: PipelineStage[]
  items: PipelineItem[]
  created_at: string
  updated_at: string
}

export const MODEL_OPTIONS = [
  { value: '', label: 'Default (Opus)' },
  { value: 'anthropic/claude-opus-4-6', label: 'Claude Opus' },
  { value: 'anthropic/claude-sonnet-4-20250514', label: 'Claude Sonnet' },
  { value: 'openrouter/meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B (Free)' },
  { value: 'ollama/llama3.1:8b', label: 'Llama 3.1 8B (Local)' },
]

export const CRON_PRESETS = [
  { value: 300000, label: '5 min' },
  { value: 900000, label: '15 min' },
  { value: 1800000, label: '30 min' },
  { value: 3600000, label: '1 hour' },
  { value: 7200000, label: '2 hours' },
  { value: 14400000, label: '4 hours' },
  { value: 86400000, label: '24 hours' },
]
