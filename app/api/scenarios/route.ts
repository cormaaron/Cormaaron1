import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { Initiative, formatPortfolioForAgents } from '@/lib/types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { scenario } = await req.json()
  if (!scenario) return NextResponse.json({ error: 'scenario is required' }, { status: 400 })

  const { data: initiatives } = await supabase
    .from('initiatives')
    .select('*')
    .eq('user_id', user.id)
    .order('composite_score', { ascending: false })

  const list = (initiatives ?? []) as Initiative[]
  if (list.length === 0) {
    return NextResponse.json({ error: 'No initiatives to simulate' }, { status: 400 })
  }

  const portfolio = formatPortfolioForAgents(list)
  const initiativeNames = list.map(i => `- ${i.name}`).join('\n')

  const prompt = `You are a Chief Strategy Officer running a portfolio scenario simulation.

Scenario: "${scenario}"

Current portfolio:
${portfolio}

Simulate the impact of this scenario on the portfolio. Be specific about which initiatives are affected and how.

Return ONLY valid JSON with this structure:
{
  "scenario_name": "concise name for this scenario",
  "summary": "2-3 sentences on the overall portfolio impact",
  "affected_initiatives": [{"name": "exact initiative name", "impact": "one sentence on specific impact"}],
  "budget_impact": "1-2 sentences on total budget/cost impact with estimates",
  "roi_impact": "1-2 sentences on ROI and value impact",
  "execution_impact": "1-2 sentences on delivery and capacity impact",
  "transformation_risk": "1-2 sentences on transformation risk change",
  "recommendation": "2-3 sentences on whether to proceed with this scenario and conditions"
}

Use exact initiative names. Be direct and specific.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'user', content: prompt + `\n\nInitiative names:\n${initiativeNames}` },
    ],
    max_tokens: 900,
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(completion.choices[0].message.content ?? '{}')
  return NextResponse.json({ result })
}
