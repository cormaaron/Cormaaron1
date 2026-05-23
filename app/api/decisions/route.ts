import { NextResponse } from 'next/server'
import { getAuthedClient } from '@/lib/supabase/api'

export async function GET(req: Request) {
  const { supabase, user, error } = await getAuthedClient(req)
  if (error) return error

  const { data, error } = await supabase
    .from('strategy_decisions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ decisions: data })
}

export async function POST(req: Request) {
  const { supabase, user, error } = await getAuthedClient(req)
  if (error) return error

  const body = await req.json()
  const { decision_type, title, rationale, initiative_names } = body

  if (!decision_type || !title) {
    return NextResponse.json({ error: 'decision_type and title are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('strategy_decisions')
    .insert({ user_id: user.id, decision_type, title, rationale, initiative_names: initiative_names ?? [] })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ decision: data })
}

export async function DELETE(req: Request) {
  const { supabase, user, error } = await getAuthedClient(req)
  if (error) return error

  const { id } = await req.json()
  const { error } = await supabase
    .from('strategy_decisions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
