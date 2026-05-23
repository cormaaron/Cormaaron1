import { createClient as _create } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function getAuthedClient(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  if (!token) {
    return { supabase: null, user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const supabase = _create(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    }
  )

  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) {
    return { supabase: null, user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  return { supabase, user, error: null }
}
