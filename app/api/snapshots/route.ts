import { NextResponse } from 'next/server'
import { getAuthedClient } from '@/lib/supabase/api'
import { Initiative, getRecommendation } from '@/lib/types'

export async function GET(req: Request) {
  const { supabase, user, error } = await getAuthedClient(req)
  if (error) return error

  const { data } = await supabase
    .from('portfolio_snapshots')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(8)

  return NextResponse.json({ snapshots: data ?? [] })
}

export async function POST(req: Request) {
  const { supabase, user, error } = await getAuthedClient(req)
  if (error) return error

  const { data: initiatives } = await supabase
    .from('initiatives')
    .select('*')
    .eq('user_id', user.id)

  const list = (initiatives ?? []) as Initiative[]
  const active = list.filter(i => i.status === 'active')

  const avgScore = active.length
    ? active.reduce((s, i) => s + Number(i.composite_score), 0) / active.length
    : 0

  const totalBudget = active.reduce(
    (s, i) => s + Number(i.implementation_cost) + Number(i.annual_cost) * 3, 0
  )
  const totalConfAdj = active.reduce((s, i) => s + Number(i.confidence_adjusted_roi ?? 0), 0)

  const snapshot = {
    user_id: user.id,
    initiative_count: list.length,
    active_count: active.length,
    avg_score: Math.round(avgScore * 100) / 100,
    total_budget: totalBudget,
    total_conf_adj_roi: totalConfAdj,
    at_risk_count: active.filter(i => Number(i.composite_score) < 5).length,
    accelerate_count: active.filter(i => getRecommendation(i) === 'accelerate').length,
    stop_count: active.filter(i => getRecommendation(i) === 'stop').length,
    watch_count: active.filter(i => getRecommendation(i) === 'watch').length,
  }

  const { data, error: dbError } = await supabase
    .from('portfolio_snapshots')
    .insert(snapshot)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ snapshot: data })
}
