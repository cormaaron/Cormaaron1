export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { Brief } from '@/lib/types'
import { notFound } from 'next/navigation'
import Link from 'next/link'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function BriefDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('briefs').select('*').eq('id', id).single()

  if (!data) notFound()

  const brief = data as Brief

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/briefs" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
          ← All briefs
        </Link>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8">
        <div className="mb-6 pb-6 border-b border-neutral-800">
          <h2 className="text-xl font-semibold text-white">{brief.title}</h2>
          <p className="text-sm text-neutral-500 mt-1">{formatDate(brief.created_at)}</p>
        </div>
        <div className="prose prose-invert prose-sm max-w-none">
          {brief.content.split('\n').map((line, i) => (
            <p key={i} className={`text-sm leading-relaxed ${line.startsWith('#') ? 'font-semibold text-white text-base mt-4' : 'text-neutral-300'}`}>
              {line.replace(/^#+\s/, '')}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
