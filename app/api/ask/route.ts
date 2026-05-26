import { NextResponse } from 'next/server'
import { getAuthedClient } from '@/lib/supabase/api'
import OpenAI from 'openai'
import { Initiative, StrategyDoc, formatPortfolioForAgents } from '@/lib/types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  const { supabase, user, error } = await getAuthedClient(req)
  if (error) return error

  const { messages } = await req.json()
  if (!messages?.length) return NextResponse.json({ error: 'messages required' }, { status: 400 })

  const [{ data: initiatives }, { data: docs }] = await Promise.all([
    supabase.from('initiatives').select('*').eq('user_id', user.id).order('composite_score', { ascending: false }),
    supabase.from('strategy_docs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  const list = (initiatives ?? []) as Initiative[]
  const docList = (docs ?? []) as StrategyDoc[]

  const portfolioContext = list.length > 0
    ? formatPortfolioForAgents(list)
    : 'No initiatives have been added yet.'

  const docsContext = docList.length > 0
    ? docList.map(d => `[${d.doc_type.toUpperCase()}] ${d.title}\n${d.content}`).join('\n\n---\n\n')
    : ''

  const systemPrompt = `You are a strategic portfolio advisor with full access to this organization's initiative portfolio${docList.length > 0 ? ' and strategy documents' : ''}.

Rules:
- Answer directly. No preamble.
- Reference specific initiative names, scores, and financial figures.
- Keep responses to 3-5 sentences unless a detailed breakdown is requested.
- Tone: senior strategy partner — precise, direct, no hedging.
- Do not invent data not present in the portfolio.

Portfolio (${list.length} initiatives, ${list.filter(i => i.status === 'active').length} active):
${portfolioContext}${docsContext ? `\n\nStrategy Documents:\n${docsContext}` : ''}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-12),
    ],
    max_tokens: 600,
  })

  return NextResponse.json({ response: completion.choices[0].message.content ?? '' })
}
