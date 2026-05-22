import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { Initiative } from '@/lib/types'

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

  const initiativeSummary = list.map(i => (
    `- ${i.name} (Score: ${Number(i.composite_score).toFixed(1)}, Status: ${i.status}, Owner: ${i.owner ?? 'unassigned'})
   Business Value: ${i.business_value}/10 | Feasibility: ${i.feasibility}/10 | Readiness: ${i.readiness}/10 | Risk: ${i.risk}/10
   ${i.description ? `Description: ${i.description}` : ''}`
  )).join('\n\n')

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const prompt = `You are a Chief Strategy Officer preparing an executive portfolio brief for the leadership team.

Date: ${today}
Total initiatives: ${list.length}
Active initiatives: ${list.filter(i => i.status === 'active').length}

Portfolio data:
${initiativeSummary}

Write a concise, executive-grade portfolio brief (400-600 words) covering:
1. Portfolio health summary
2. Top 3 priority initiatives and why they rank highest
3. Any initiatives at risk or needing attention (score below 5)
4. Recommended resource focus and next steps

Tone: professional, direct, data-driven. No fluff. Use plain paragraphs, not bullet lists.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 800,
  })

  const content = completion.choices[0].message.content ?? ''
  const title = `Portfolio Brief — ${today}`

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
