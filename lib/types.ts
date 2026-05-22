export type InitiativeStatus = 'active' | 'paused' | 'completed' | 'cancelled'

export interface Initiative {
  id: string
  user_id: string
  name: string
  description: string | null
  owner: string | null
  status: InitiativeStatus
  business_value: number
  feasibility: number
  readiness: number
  risk: number
  composite_score: number
  created_at: string
  updated_at: string
}

export interface Brief {
  id: string
  user_id: string
  title: string
  content: string
  initiative_ids: string[]
  created_at: string
}

export type InitiativeInsert = Omit<Initiative, 'id' | 'user_id' | 'composite_score' | 'created_at' | 'updated_at'>
