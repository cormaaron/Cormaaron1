export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { Initiative } from '@/lib/types'
import ScoreBar from '@/components/ScoreBar'
import Link from 'next/link'

function scoreColor(score: number) {
  if (score >= 7) return 'text-emerald-400'
  if (score >= 5) return 'text-amber-400'
  return 'text-red-400'
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-400',
    paused: 'bg-amber-500/10 text-amber-400',
    completed: 'bg-blue-500/10 text-blue-400',
    cancelled: 'bg-neutral-500/10 text-neutral-500',
  }
  return map[status] ?? map.active
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: initiatives } = await supabase
    .from('initiatives')
    .select('*')
    .order('composite_score', { ascending: false })

  const list = (initiatives ?? []) as Initiative[]

  const active = list.filter(i => i.status === 'active')
  const avgScore = active.length
    ? (active.reduce((s, i) => s + Number(i.composite_score), 0) / active.length).toFixed(1)
    : '—'
  const highValue = active.filter(i => Number(i.composite_score) >= 7).length
  const atRisk = active.filter(i => Number(i.composite_score) < 5).length

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-white">Portfolio Dashboard</h2>
        <p className="text-sm text-neutral-400 mt-1">
          {list.length} initiative{list.length !== 1 ? 's' : ''} tracked
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Initiatives', value: active.length },
          { label: 'Avg Portfolio Score', value: avgScore },
          { label: 'At Risk', value: atRisk },
        ].map(({ label, value }) => (
          <div key={label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <p className="text-xs text-neutral-500 uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-semibold text-white mt-2">{value}</p>
          </div>
        ))}
      </div>

      {/* Top initiatives */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-neutral-300">Initiative Rankings</h3>
          <Link href="/initiatives/new" className="text-xs text-neutral-400 hover:text-white transition-colors">
            + New initiative
          </Link>
        </div>

        {list.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center">
            <p className="text-neutral-500 text-sm">No initiatives yet.</p>
            <Link href="/initiatives/new" className="mt-3 inline-block text-sm text-white underline underline-offset-2">
              Add your first initiative
            </Link>
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl divide-y divide-neutral-800">
            {list.map((initiative, idx) => (
              <div key={initiative.id} className="flex items-center gap-4 px-5 py-4">
                <span className="text-sm text-neutral-600 w-5 text-right">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/initiatives/${initiative.id}`}
                      className="text-sm font-medium text-white hover:text-neutral-300 transition-colors truncate"
                    >
                      {initiative.name}
                    </Link>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(initiative.status)}`}>
                      {initiative.status}
                    </span>
                  </div>
                  {initiative.owner && (
                    <p className="text-xs text-neutral-500 mt-0.5">{initiative.owner}</p>
                  )}
                </div>
                <div className="w-32">
                  <ScoreBar score={Number(initiative.composite_score)} />
                </div>
                <div className={`text-sm font-semibold w-10 text-right ${scoreColor(Number(initiative.composite_score))}`}>
                  {Number(initiative.composite_score).toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Score legend */}
      <div className="bg-neutral-900/50 border border-neutral-800/50 rounded-xl p-5">
        <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider mb-3">Scoring weights</p>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Business Value', weight: '40%' },
            { label: 'Feasibility', weight: '25%' },
            { label: 'Readiness', weight: '20%' },
            { label: 'Risk', weight: '15%' },
          ].map(({ label, weight }) => (
            <div key={label}>
              <p className="text-xs text-neutral-400">{label}</p>
              <p className="text-sm font-semibold text-white mt-0.5">{weight}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
