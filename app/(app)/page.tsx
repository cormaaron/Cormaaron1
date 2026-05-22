'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Initiative, getRecommendation, formatCurrency, Recommendation } from '@/lib/types'
import ScoreBar from '@/components/ScoreBar'
import Link from 'next/link'

const REC_STYLE: Record<Recommendation, { label: string; dot: string; text: string }> = {
  accelerate: { label: 'Accelerate', dot: 'bg-emerald-400', text: 'text-emerald-400' },
  continue:   { label: 'Continue',   dot: 'bg-blue-400',    text: 'text-blue-400' },
  watch:      { label: 'Watch',      dot: 'bg-amber-400',   text: 'text-amber-400' },
  stop:       { label: 'Stop',       dot: 'bg-red-400',     text: 'text-red-400' },
}

function scoreColor(score: number) {
  if (score >= 7) return 'text-emerald-400'
  if (score >= 5) return 'text-amber-400'
  return 'text-red-400'
}

export default function DashboardPage() {
  const [list, setList] = useState<Initiative[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.from('initiatives').select('*').order('composite_score', { ascending: false })
      .then(({ data }) => setList((data ?? []) as Initiative[]))
  }, [])

  const active = list.filter(i => i.status === 'active')

  // Financial aggregates
  const totalBudget = active.reduce((s, i) => s + Number(i.implementation_cost) + Number(i.annual_cost) * 3, 0)
  const totalConfAdj = active.reduce((s, i) => s + Number(i.confidence_adjusted_roi ?? 0), 0)
  const totalThreeYr = active.reduce((s, i) => s + Number(i.three_year_value ?? 0), 0)
  const portfolioMultiple = totalBudget > 0
    ? ((totalConfAdj + totalBudget) / totalBudget).toFixed(2)
    : null

  // Scoring aggregates
  const avgScore = active.length
    ? (active.reduce((s, i) => s + Number(i.composite_score), 0) / active.length).toFixed(1)
    : '—'
  const atRisk = active.filter(i => Number(i.composite_score) < 5).length

  // Recommendations
  const byRec = active.reduce((acc, i) => {
    const r = getRecommendation(i)
    acc[r] = [...(acc[r] ?? []), i]
    return acc
  }, {} as Record<Recommendation, Initiative[]>)

  // Budget by recommendation
  const budgetByRec = (rec: Recommendation) =>
    (byRec[rec] ?? []).reduce((s, i) => s + Number(i.implementation_cost) + Number(i.annual_cost) * 3, 0)

  const lowRoiBudget = budgetByRec('stop') + budgetByRec('watch')
  const lowRoiPct = totalBudget > 0 ? Math.round(lowRoiBudget / totalBudget * 100) : 0

  // Overfunded: high budget, negative/low ROI
  const overfunded = [...active]
    .filter(i => Number(i.implementation_cost) > 0)
    .sort((a, b) => {
      const ratioA = Number(a.confidence_adjusted_roi ?? 0) / (Number(a.implementation_cost) + Number(a.annual_cost) * 3 + 1)
      const ratioB = Number(b.confidence_adjusted_roi ?? 0) / (Number(b.implementation_cost) + Number(b.annual_cost) * 3 + 1)
      return ratioA - ratioB
    })
    .slice(0, 3)

  // Underfunded: high ROI relative to budget
  const underfunded = [...active]
    .filter(i => Number(i.confidence_adjusted_roi ?? 0) > 0 && Number(i.implementation_cost) > 0)
    .sort((a, b) => {
      const ratioA = Number(a.confidence_adjusted_roi ?? 0) / (Number(a.implementation_cost) + Number(a.annual_cost) * 3 + 1)
      const ratioB = Number(b.confidence_adjusted_roi ?? 0) / (Number(b.implementation_cost) + Number(b.annual_cost) * 3 + 1)
      return ratioB - ratioA
    })
    .slice(0, 3)

  const hasRoiData = active.some(i => Number(i.implementation_cost) > 0 || Number(i.expected_annual_benefit) > 0)

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-white">Portfolio Dashboard</h2>
        <p className="text-sm text-neutral-400 mt-1">{list.length} initiative{list.length !== 1 ? 's' : ''} tracked</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Active Initiatives" value={String(active.length)} />
        <KpiCard label="Avg Portfolio Score" value={String(avgScore)} />
        <KpiCard label="At Risk (score < 5)" value={String(atRisk)} valueColor={atRisk > 0 ? 'text-amber-400' : 'text-white'} />
      </div>

      {/* Financial KPIs */}
      {hasRoiData && (
        <div className="grid grid-cols-4 gap-4">
          <KpiCard label="3yr Budget" value={formatCurrency(totalBudget)} small />
          <KpiCard label="3yr Expected Value" value={formatCurrency(totalThreeYr)} small valueColor={totalThreeYr >= 0 ? 'text-white' : 'text-red-400'} />
          <KpiCard label="Conf-Adj Value" value={formatCurrency(totalConfAdj)} small valueColor={totalConfAdj >= 0 ? 'text-emerald-400' : 'text-red-400'} />
          <KpiCard label="Return Multiple" value={portfolioMultiple ? `${portfolioMultiple}x` : '—'} small />
        </div>
      )}

      {/* Action recommendations */}
      {active.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-neutral-300 mb-4">Portfolio Signals</h3>
          <div className="grid grid-cols-3 gap-4">
            {(['accelerate', 'watch', 'stop'] as Recommendation[]).map(rec => {
              const items = byRec[rec] ?? []
              const style = REC_STYLE[rec]
              return (
                <div key={rec} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${style.dot}`} />
                    <p className={`text-xs font-medium uppercase tracking-wider ${style.text}`}>{style.label}</p>
                    <span className="text-xs text-neutral-600 ml-auto">{items.length}</span>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-xs text-neutral-600">None</p>
                  ) : (
                    <ul className="space-y-2">
                      {items.slice(0, 4).map(i => (
                        <li key={i.id}>
                          <Link href={`/initiatives/${i.id}`} className="text-xs text-neutral-300 hover:text-white transition-colors line-clamp-1">
                            {i.name}
                          </Link>
                        </li>
                      ))}
                      {items.length > 4 && (
                        <li className="text-xs text-neutral-600">+{items.length - 4} more</li>
                      )}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Funding efficiency */}
      {hasRoiData && (overfunded.length > 0 || underfunded.length > 0) && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-neutral-300">Funding Efficiency</h3>
            {totalBudget > 0 && (
              <span className={`text-xs px-2.5 py-1 rounded-full ${lowRoiPct > 30 ? 'bg-red-500/10 text-red-400' : 'bg-neutral-800 text-neutral-400'}`}>
                {lowRoiPct}% low-ROI budget
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FundingList title="Overfunded" subtitle="High cost, low return" items={overfunded} color="text-red-400" />
            <FundingList title="Underfunded" subtitle="High return, room to scale" items={underfunded} color="text-emerald-400" />
          </div>
        </div>
      )}

      {/* Initiative rankings */}
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
            {list.map((initiative, idx) => {
              const rec = getRecommendation(initiative)
              const recStyle = REC_STYLE[rec]
              return (
                <div key={initiative.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="text-sm text-neutral-600 w-5 text-right">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/initiatives/${initiative.id}`} className="text-sm font-medium text-white hover:text-neutral-300 transition-colors truncate">
                        {initiative.name}
                      </Link>
                    </div>
                    {initiative.owner && <p className="text-xs text-neutral-500 mt-0.5">{initiative.owner}</p>}
                  </div>
                  {hasRoiData && (
                    <div className="hidden sm:block text-xs text-neutral-400 w-20 text-right">
                      {Number(initiative.confidence_adjusted_roi ?? 0) !== 0
                        ? formatCurrency(Number(initiative.confidence_adjusted_roi))
                        : '—'}
                    </div>
                  )}
                  <div className={`hidden sm:flex items-center gap-1 text-xs ${recStyle.text} w-20`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${recStyle.dot}`} />
                    {recStyle.label}
                  </div>
                  <div className="w-24"><ScoreBar score={Number(initiative.composite_score)} /></div>
                  <div className={`text-sm font-semibold w-10 text-right ${scoreColor(Number(initiative.composite_score))}`}>
                    {Number(initiative.composite_score).toFixed(1)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCard({ label, value, small, valueColor }: {
  label: string; value: string; small?: boolean; valueColor?: string
}) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
      <p className="text-xs text-neutral-500 uppercase tracking-wider">{label}</p>
      <p className={`font-semibold text-white mt-2 ${small ? 'text-xl' : 'text-3xl'} ${valueColor ?? 'text-white'}`}>
        {value}
      </p>
    </div>
  )
}

function FundingList({ title, subtitle, items, color }: {
  title: string; subtitle: string; items: Initiative[]; color: string
}) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <p className={`text-xs font-medium uppercase tracking-wider ${color} mb-0.5`}>{title}</p>
      <p className="text-xs text-neutral-600 mb-3">{subtitle}</p>
      {items.length === 0 ? (
        <p className="text-xs text-neutral-600">None</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map(i => (
            <li key={i.id} className="flex items-center justify-between gap-2">
              <Link href={`/initiatives/${i.id}`} className="text-xs text-neutral-300 hover:text-white transition-colors truncate">
                {i.name}
              </Link>
              <span className="text-xs text-neutral-500 shrink-0">
                {formatCurrency(Number(i.implementation_cost) + Number(i.annual_cost) * 3)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
