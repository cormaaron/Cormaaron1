export type InitiativeStatus = 'active' | 'paused' | 'completed' | 'cancelled'
export type Recommendation = 'accelerate' | 'continue' | 'watch' | 'stop'
export type DecisionType = 'approved' | 'rejected' | 'deferred' | 'noted'
export type DocType = 'strategy' | 'pmo' | 'memo' | 'other'

export interface Initiative {
  id: string
  user_id: string
  name: string
  description: string | null
  owner: string | null
  status: InitiativeStatus
  business_unit: string | null
  strategic_objective: string | null
  business_value: number
  feasibility: number
  readiness: number
  risk: number
  composite_score: number
  annual_cost: number
  implementation_cost: number
  expected_annual_benefit: number
  confidence_level: number
  time_to_value_months: number
  three_year_value: number
  confidence_adjusted_roi: number
  payback_period_months: number | null
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

export interface ChallengeContent {
  portfolio_diagnosis: string
  budget_waste: string
  weak_roi_assumptions: string
  initiative_overlap: string
  governance_gaps: string
  recommendations: string
  reallocation_suggestions: string
  initiatives_to_stop: { name: string; reason: string }[]
  initiatives_to_accelerate: { name: string; reason: string }[]
  agent_outputs?: {
    analyst: string
    cfo: string
    transformation: string
    strategy: string
  }
}

export interface PortfolioChallenge {
  id: string
  user_id: string
  created_at: string
  content: ChallengeContent
}

export interface StrategyDecision {
  id: string
  user_id: string
  created_at: string
  decision_type: DecisionType
  title: string
  rationale: string | null
  initiative_names: string[]
}

export interface StrategyDoc {
  id: string
  user_id: string
  title: string
  content: string
  doc_type: DocType
  created_at: string
}

export interface PortfolioSnapshot {
  id: string
  user_id: string
  created_at: string
  initiative_count: number
  active_count: number
  avg_score: number
  total_budget: number
  total_conf_adj_roi: number
  at_risk_count: number
  accelerate_count: number
  stop_count: number
  watch_count: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ScenarioResult {
  scenario_name: string
  summary: string
  affected_initiatives: { name: string; impact: string }[]
  budget_impact: string
  roi_impact: string
  execution_impact: string
  transformation_risk: string
  recommendation: string
}

export type InitiativeInsert = Omit<
  Initiative,
  | 'id' | 'user_id' | 'composite_score' | 'three_year_value'
  | 'confidence_adjusted_roi' | 'payback_period_months'
  | 'created_at' | 'updated_at'
>

export function getRecommendation(i: Initiative): Recommendation {
  const budget = Number(i.implementation_cost) + Number(i.annual_cost) * 3
  const roi = Number(i.confidence_adjusted_roi ?? 0)
  const score = Number(i.composite_score ?? 0)
  const confidence = Number(i.confidence_level ?? 70)
  if (budget === 0) {
    if (score >= 7) return 'accelerate'
    if (score < 5) return 'watch'
    return 'continue'
  }
  if (roi < 0) return 'stop'
  const multiple = roi / budget
  if (multiple > 1.0 && score >= 6.5 && confidence >= 65) return 'accelerate'
  if (multiple < 0.2 || score < 5 || confidence < 40) return 'watch'
  return 'continue'
}

export function formatCurrency(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`
  return `${sign}$${abs.toFixed(0)}`
}

export function formatPortfolioForAgents(initiatives: Initiative[]): string {
  return initiatives.map(i => {
    const budget3yr = Number(i.implementation_cost) + Number(i.annual_cost) * 3
    return `${i.name} [${i.status.toUpperCase()}] | Score: ${Number(i.composite_score).toFixed(1)} | Owner: ${i.owner ?? 'unassigned'} | BU: ${i.business_unit ?? 'unspecified'} | Objective: ${i.strategic_objective ?? 'unspecified'}
  Budget: $${Number(i.implementation_cost).toLocaleString()} impl + $${Number(i.annual_cost).toLocaleString()}/yr | Benefit: $${Number(i.expected_annual_benefit).toLocaleString()}/yr | Confidence: ${i.confidence_level}% | TTV: ${i.time_to_value_months}mo
  3yr Budget: $${budget3yr.toLocaleString()} | 3yr Net: $${Number(i.three_year_value ?? 0).toLocaleString()} | Conf-Adj Value: $${Number(i.confidence_adjusted_roi ?? 0).toLocaleString()}
  ${i.description ? `Note: ${i.description}` : ''}`
  }).join('\n\n')
}
