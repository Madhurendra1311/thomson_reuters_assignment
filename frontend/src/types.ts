export type ChatMessage = {
  id: number
  sender: 'bot' | 'user'
  text: string
}

export type Milestone = {
  id: number
  title: string
  status?: string
  notes?: string
}

export type Project = {
  id: number
  name: string
  description?: string
  milestones?: Milestone[]
}

export type WeeklyReport = {
  id: number
  week_start: string
  draft_text: string
  final_text?: string | null
}

