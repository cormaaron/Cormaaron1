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

interface MemoV2 {
  version: 2
  decision_required: string
  portfolio_diagnosis: string
  recommended_reallocations: string
  risks: string
  thirty_day_actions: string
}

const SECTIONS: { key: keyof MemoV2; label: string; accent: string }[] = [
  { key: 'decision_required',         label: 'Decision Required',           accent: 'border-amber-500/40 bg-amber-500/5' },
  { key: 'portfolio_diagnosis',       label: 'Portfolio Diagnosis',         accent: 'border-neutral-700 bg-neutral-800/40' },
  { key: 'recommended_reallocations', label: 'Recommended Reallocations',   accent: 'border-emerald-500/30 bg-emerald-500/5' },
  { key: 'risks',                     label: 'Key Risks',                   accent: 'border-red-500/30 bg-red-500/5' },
  { key: 'thirty_day_actions',        label: '30-Day Actions',              accent: 'border-blue-500/30 bg-blue-500/5' },
]

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

  let memo: MemoV2 | null = null
  try {
    const parsed = JSON.parse(brief.content)
    if (parsed.version === 2) memo = parsed as MemoV2
  } catch {
    // legacy plain-text brief
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/briefs" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
        ← All memos
      </Link>

      <div>
        <h2 className="text-xl font-semibold text-white">{brief.title}</h2>
        <p className="text-sm text-neutral-500 mt-1">{formatDate(brief.created_at)}</p>
      </div>

      {memo ? (
        <div className="space-y-4">
          {SECTIONS.map(({ key, label, accent }) => (
            <div key={key} className={`rounded-xl border p-6 ${accent}`}>
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-3">{label}</p>
              <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-line">{memo![key]}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8">
          <div className="space-y-3">
            {brief.content.split('\n').filter(Boolean).map((line, i) => (
              <p key={i} className={`text-sm leading-relaxed ${line.startsWith('#') ? 'font-semibold text-white text-base mt-4' : 'text-neutral-300'}`}>
                {line.replace(/^#+\s/, '')}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
