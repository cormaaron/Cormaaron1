import { NextResponse } from 'next/server'
import { getAuthedClient } from '@/lib/supabase/api'

export async function GET(req: Request) {
  const { supabase, user, error } = await getAuthedClient(req)
  if (error) return error

  const { data, error: dbError } = await supabase
    .from('strategy_docs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ docs: data })
}

export async function POST(req: Request) {
  const { supabase, user, error } = await getAuthedClient(req)
  if (error) return error

  const { title, content, doc_type } = await req.json()
  if (!title || !content) return NextResponse.json({ error: 'title and content required' }, { status: 400 })

  const { data, error: dbError } = await supabase
    .from('strategy_docs')
    .insert({ user_id: user.id, title, content, doc_type: doc_type ?? 'strategy' })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ doc: data })
}

export async function DELETE(req: Request) {
  const { supabase, user, error } = await getAuthedClient(req)
  if (error) return error

  const { id } = await req.json()
  const { error: dbError } = await supabase
    .from('strategy_docs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
