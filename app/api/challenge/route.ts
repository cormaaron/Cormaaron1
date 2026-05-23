import { NextResponse } from 'next/server'
import { getAuthedClient } from '@/lib/supabase/api'
import OpenAI from 'openai'
import { Initiative, formatPortfolioForAgents } from '@/lib/types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function runAgent(system: string, portfolio: string): Promise<string> {
  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: portfolio },
    ],
    max_tokens: 450,
  })
  return res.choices[0].message.content ?? ''
}

const ANALYST_PROMPT = `You are a senior portfolio analyst. Review this initiative portfolio and identify:
- Initiatives with overlapping scope or objectives that could be merged
- Duplicated spend across vendors, platforms, or capabilities
- Budget concentration risk (too many initiatives competing for same resources)
- Specific reallocation opportunities with estimated dollar impact

Be direct. Name specific initiatives. Use numbers. 250 words max.`

const CFO_PROMPT = `You are a CFO pressure-testing this portfolio's financial assumptions. Identify:
- Initiatives with unrealistic benefit assumptions (high benefit, low confidence)
- Investments with payback periods exceeding 24 months and unclear rationale
- Initiatives where confidence <50% but investment is material
- Specific numbers you would challenge in a board presentation

Be skeptical. Name initiatives. Quote specific figures. 250 words max.`

const TRANSFORMATION_PROMPT = `You are a transformation delivery expert reviewing execution risk. Identify:
- Sequencing risks (initiatives that likely depend on others not yet delivered)
- Business units or owners with too many concurrent initiatives
- Shared platform or infrastructure dependencies that create bottlenecks
- Initiatives most likely to miss their time-to-value targets and why

Be specific. Name initiatives and owners. 250 words max.`

const STRATEGY_PROMPT = `You are a strategy partner reviewing portfolio strategic coherence. Identify:
- Initiatives with weak or absent connection to stated strategic objectives
- Over-concentration in specific AI or transformation capability areas
- Fragmentation — too many small bets that should be consolidated
- Strategic gaps: areas with no investment despite likely importance

Be direct. Name initiatives. Make the strategic case. 250 words max.`

const SYNTHESIS_PROMPT = `You are a Chief Strategy Officer synthesizing a multi-agent portfolio critique into an executive challenge report.

You will receive analysis from four specialist agents. Produce a consolidated challenge report.

Rules:
- Tone: MBB senior partner. Direct, data-specific, no hedging, no filler.
- Name specific initiatives. Reference actual figures from the data.
- Do not use phrases like "it's important to note" or "this suggests".
- initiatives_to_stop and initiatives_to_accelerate must name real initiatives from the portfolio.

Return ONLY valid JSON with this exact structure:
{
  "portfolio_diagnosis": "3-4 sentences on overall portfolio health, strategic coherence, and financial performance.",
  "budget_waste": "2-3 sentences identifying specific waste with dollar estimates.",
  "weak_roi_assumptions": "2-3 sentences challenging specific ROI assumptions by initiative name.",
  "initiative_overlap": "2-3 sentences identifying specific overlapping or duplicated initiatives.",
  "governance_gaps": "2-3 sentences on oversight, ownership, and governance failures.",
  "recommendations": "5-6 numbered, specific, actionable recommendations.",
  "reallocation_suggestions": "3-4 sentences on exactly where to shift budget and why.",
  "initiatives_to_stop": [{"name": "exact initiative name", "reason": "one sharp sentence"}],
  "initiatives_to_accelerate": [{"name": "exact initiative name", "reason": "one sharp sentence"}]
}`

export async function POST(req: Request) {
  const { supabase, user, error } = await getAuthedClient(req)
  if (error) return error

  const { data: initiatives } = await supabase
    .from('initiatives')
    .select('*')
    .eq('user_id', user.id)
    .order('composite_score', { ascending: false })

  const list = (initiatives ?? []) as Initiative[]
  if (list.length === 0) {
    return NextResponse.json({ error: 'No initiatives to analyze' }, { status: 400 })
  }

  const portfolio = formatPortfolioForAgents(list)

  const [analyst, cfo, transformation, strategy] = await Promise.all([
    runAgent(ANALYST_PROMPT, portfolio),
    runAgent(CFO_PROMPT, portfolio),
    runAgent(TRANSFORMATION_PROMPT, portfolio),
    runAgent(STRATEGY_PROMPT, portfolio),
  ])

  const initiativeNames = list.map(i => `- ${i.name}`).join('\n')
  const agentSummary = `PORTFOLIO ANALYST:\n${analyst}\n\nCFO:\n${cfo}\n\nTRANSFORMATION:\n${transformation}\n\nSTRATEGY:\n${strategy}\n\nINITIATIVE NAMES (use exact names):\n${initiativeNames}`

  const synthesis = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYNTHESIS_PROMPT },
      { role: 'user', content: agentSummary },
    ],
    max_tokens: 1200,
    response_format: { type: 'json_object' },
  })

  const parsed = JSON.parse(synthesis.choices[0].message.content ?? '{}')
  const content = {
    ...parsed,
    agent_outputs: { analyst, cfo, transformation, strategy },
  }

  const { data: challenge, error } = await supabase
    .from('portfolio_challenges')
    .insert({ user_id: user.id, content })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ challenge })
}
