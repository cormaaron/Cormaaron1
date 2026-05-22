'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Brief } from '@/lib/types'
import Link from 'next/link'
import GenerateBriefButton from '@/components/GenerateBriefButton'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function BriefsPage() {
  const [briefs, setBriefs] = useState<Brief[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.from('briefs').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setBriefs((data ?? []) as Brief[]))
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Executive Briefs</h2>
          <p className="text-sm text-neutral-400 mt-1">AI-generated portfolio summaries</p>
        </div>
        <GenerateBriefButton onGenerated={brief => setBriefs(b => [brief, ...b])} />
      </div>

      {briefs.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-16 text-center">
          <p className="text-neutral-500 text-sm">No briefs generated yet.</p>
          <p className="text-neutral-600 text-xs mt-1">Generate one using the button above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {briefs.map(brief => (
            <Link key={brief.id} href={`/briefs/${brief.id}`}
              className="block bg-neutral-900 border border-neutral-800 rounded-xl px-5 py-4 hover:border-neutral-700 transition-colors">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">{brief.title}</h3>
                <span className="text-xs text-neutral-500">{formatDate(brief.created_at)}</span>
              </div>
              <p className="text-xs text-neutral-500 mt-1.5 line-clamp-2">{brief.content.slice(0, 180)}…</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
