'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Brief } from '@/lib/types'
import Link from 'next/link'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

export default function BriefDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [brief, setBrief] = useState<Brief | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('briefs').select('*').eq('id', id).single()
      .then(({ data }) => setBrief(data as Brief))
  }, [id])

  if (!brief) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="h-64 bg-neutral-800 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/briefs" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
        ← All briefs
      </Link>
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8">
        <div className="mb-6 pb-6 border-b border-neutral-800">
          <h2 className="text-xl font-semibold text-white">{brief.title}</h2>
          <p className="text-sm text-neutral-500 mt-1">{formatDate(brief.created_at)}</p>
        </div>
        <div className="space-y-3">
          {brief.content.split('\n').filter(Boolean).map((line, i) => (
            <p key={i} className={`text-sm leading-relaxed ${line.startsWith('#') ? 'font-semibold text-white text-base mt-4' : 'text-neutral-300'}`}>
              {line.replace(/^#+\s/, '')}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
