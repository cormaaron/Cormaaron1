import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { Initiative, getRecommendation, formatCurrency } from '@/lib/types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: initiatives } = await supabase
    .from('initiatives')
    .select('*')
    .eq('user_id', user.id)
    .order('composite_score', { ascending: false })

  const list = (initiatives ?? []) as Initiative[]

  if (list.length === 0) {
    return NextResponse.json({ error: 'No initiatives to brief' }, { status: 400 })
  }

  const active = list.filter(i => i.status === 'active')
  const totalBudget = active.reduce((s, i) => s + Number(i.implementation_cost) + Number(i.annual_cost) * 3, 0)
  const totalConfAdj = active.reduce((s, i) => s + Number(i.confidence_adjusted_roi ?? 0), 0)

  const initiativeSummary = list.map(i => {
    const rec = getRecommendation(i)
    const budget3yr = Number(i.implementation_cost) + Number(i.annual_cost) * 3
    return `- ${i.name} [${rec.toUpperCase()}] | Score: ${Number(i.composite_score).toFixed(1)} | Status: ${i.status} | Owner: ${i.owner ?? 'unassigned'}
  Implementation: ${formatCurrency(Number(i.implementation_cost))} | Annual Cost: ${formatCurrency(Number(i.annual_cost))} | Annual Benefit: ${formatCurrency(Number(i.expected_annual_benefit))}
  3yr Budget: ${formatCurrency(budget3yr)} | Conf-Adj Value: ${formatCurrency(Number(i.confidence_adjusted_roi ?? 0))} | Confidence: ${i.confidence_level}% | TTV: ${i.time_to_value_months}mo
  ${i.description ? `Context: ${i.description}` : ''}`
  }).join('\n\n')

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const prompt = `You are a Chief Strategy Officer. Generate an executive decision memo in valid JSON.

Date: ${today}
Total initiatives: ${list.length} (${active.length} active)
Total 3yr portfolio budget: ${formatCurrency(totalBudget)}
Confidence-adjusted portfolio value: ${formatCurrency(totalConfAdj)}

Portfolio data:
${initiativeSummary}

Return ONLY valid JSON with this exact structure:
{
  "version": 2,
  "decision_required": "1-2 sentences stating the specific decisions leadership must make now.",
  "portfolio_diagnosis": "3-4 sentences assessing overall portfolio health, ROI performance, and score distribution. Be specific with numbers.",
  "recommended_reallocations": "3-5 sentences on where to shift budget and resources. Name specific initiatives. Reference the ACCELERATE/WATCH/STOP signals.",
  "risks": "2-3 sentences on the top portfolio risks if current trajectory continues.",
  "thirty_day_actions": "3-5 concrete, numbered actions the leadership team should take within 30 days. Be specific."
}

Tone: direct, data-driven, executive-grade. No filler. No markdown formatting inside values.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  })

  const content = completion.choices[0].message.content ?? '{}'
  const today2 = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const title = `Decision Memo — ${today2}`

  const { data: brief, error } = await supabase
    .from('briefs')
    .insert({
      user_id: user.id,
      title,
      content,
      initiative_ids: list.map(i => i.id),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ brief })
}
