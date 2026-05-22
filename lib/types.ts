export type InitiativeStatus = 'active' | 'paused' | 'completed' | 'cancelled'
export type Recommendation = 'accelerate' | 'continue' | 'watch' | 'stop'

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
  // ROI model
  annual_cost: number
  implementation_cost: number
  expected_annual_benefit: number
  confidence_level: number
  time_to_value_months: number
  // generated
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

export type InitiativeInsert = Omit<
  Initiative,
  'id' | 'user_id' | 'composite_score' | 'three_year_value' | 'confidence_adjusted_roi' | 'payback_period_months' | 'created_at' | 'updated_at'
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
