'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Initiative } from '@/lib/types'
import Link from 'next/link'
import ScoreBar from '@/components/ScoreBar'

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    cancelled: 'bg-neutral-500/10 text-neutral-500 border-neutral-700',
  }
  return map[status] ?? map.active
}

export default function InitiativesPage() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.from('initiatives').select('*').order('composite_score', { ascending: false })
      .then(({ data }) => setInitiatives((data ?? []) as Initiative[]))
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Initiatives</h2>
          <p className="text-sm text-neutral-400 mt-1">{initiatives.length} total</p>
        </div>
        <Link href="/initiatives/new" className="bg-white text-neutral-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors">
          New initiative
        </Link>
      </div>

      {initiatives.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-16 text-center">
          <p className="text-neutral-500 text-sm">No initiatives yet. Start by adding one.</p>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl divide-y divide-neutral-800">
          {initiatives.map(initiative => (
            <div key={initiative.id} className="grid grid-cols-12 items-center gap-4 px-5 py-4">
              <div className="col-span-5">
                <Link href={`/initiatives/${initiative.id}`} className="text-sm font-medium text-white hover:text-neutral-300 transition-colors">
                  {initiative.name}
                </Link>
                {initiative.description && (
                  <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{initiative.description}</p>
                )}
              </div>
              <div className="col-span-2">
                {initiative.owner && <p className="text-xs text-neutral-400 truncate">{initiative.owner}</p>}
              </div>
              <div className="col-span-2">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${statusBadge(initiative.status)}`}>
                  {initiative.status}
                </span>
              </div>
              <div className="col-span-2"><ScoreBar score={Number(initiative.composite_score)} /></div>
              <div className="col-span-1 text-right">
                <span className="text-sm font-semibold text-white">{Number(initiative.composite_score).toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
