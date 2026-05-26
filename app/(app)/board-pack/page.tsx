'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Initiative, PortfolioChallenge, getRecommendation, formatCurrency, Recommendation } from '@/lib/types'

const REC_LABEL: Record<Recommendation, string> = {
  accelerate: 'Accelerate', continue: 'Continue', watch: 'Watch', stop: 'Stop',
}

function scoreColor(s: number) {
  if (s >= 7) return 'text-emerald-600'
  if (s >= 5) return 'text-amber-600'
  return 'text-red-600'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function BoardPackPage() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [challenge, setChallenge] = useState<PortfolioChallenge | null>(null)
  const [email, setEmail] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('initiatives').select('*').order('composite_score', { ascending: false }),
      supabase.from('portfolio_challenges').select('*').order('created_at', { ascending: false }).limit(1).single(),
      supabase.auth.getUser(),
    ]).then(([{ data: ini }, { data: ch }, { data: { user } }]) => {
      setInitiatives((ini ?? []) as Initiative[])
      if (ch) setChallenge(ch as PortfolioChallenge)
      setEmail(user?.email ?? '')
      setReady(true)
    })
  }, [])

  if (!ready) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-neutral-800 rounded animate-pulse mb-4" />
        <div className="h-64 bg-neutral-800 rounded-xl animate-pulse" />
      </div>
    )
  }

  const active = initiatives.filter(i => i.status === 'active')
  const totalBudget = active.reduce((s, i) => s + Number(i.implementation_cost) + Number(i.annual_cost) * 3, 0)
  const totalConfAdj = active.reduce((s, i) => s + Number(i.confidence_adjusted_roi ?? 0), 0)
  const avgScore = active.length ? active.reduce((s, i) => s + Number(i.composite_score), 0) / active.length : 0
  const multiple = totalBudget > 0 ? ((totalConfAdj + totalBudget) / totalBudget).toFixed(2) : null
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const toStop = challenge?.content.initiatives_to_stop ?? []
  const toAccelerate = challenge?.content.initiatives_to_accelerate ?? []

  return (
    <div className="max-w-4xl mx-auto">
      {/* Print button - hidden when printing */}
      <div className="no-print flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-white">Board Pack</h2>
          <p className="text-sm text-neutral-400 mt-1">Print-ready executive portfolio summary.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="bg-white text-neutral-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          Print / Save PDF
        </button>
      </div>

      {/* Document */}
      <div className="bg-white text-neutral-900 rounded-xl p-12 space-y-10 print:rounded-none print:shadow-none">

        {/* Header */}
        <div className="border-b border-neutral-200 pb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Strategy Office</h1>
              <p className="text-sm text-neutral-500 mt-1">Executive Portfolio Pack</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-neutral-700">{today}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{email}</p>
            </div>
          </div>
        </div>

        {/* Portfolio Overview */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4">Portfolio Overview</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Active Initiatives', value: String(active.length) },
              { label: 'Avg Portfolio Score', value: avgScore ? avgScore.toFixed(1) : '—' },
              { label: 'At Risk (score &lt; 5)', value: String(active.filter(i => Number(i.composite_score) < 5).length) },
              { label: '3yr Budget', value: formatCurrency(totalBudget) },
              { label: 'Conf-Adj Value', value: formatCurrency(totalConfAdj) },
              { label: 'Return Multiple', value: multiple ? `${multiple}x` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="border border-neutral-200 rounded-lg p-4">
                <p className="text-xs text-neutral-400 uppercase tracking-wide">{label}</p>
                <p className="text-xl font-bold text-neutral-900 mt-1">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Portfolio Diagnosis */}
        {challenge?.content.portfolio_diagnosis && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3">Portfolio Diagnosis</h2>
            <div className="border-l-4 border-neutral-300 pl-4">
              <p className="text-sm text-neutral-700 leading-relaxed">{challenge.content.portfolio_diagnosis}</p>
              <p className="text-xs text-neutral-400 mt-2">Analysis run: {formatDate(challenge.created_at)}</p>
            </div>
          </section>
        )}

        {/* Initiative Register */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4">Initiative Register</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-neutral-200">
                {['#', 'Initiative', 'Owner', 'Score', '3yr Value', 'Conf-Adj', 'Signal'].map(h => (
                  <th key={h} className="text-left py-2 pr-4 text-xs text-neutral-400 font-semibold uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {initiatives.map((ini, idx) => (
                <tr key={ini.id} className="border-b border-neutral-100">
                  <td className="py-2.5 pr-4 text-neutral-400 text-xs">{idx + 1}</td>
                  <td className="py-2.5 pr-4">
                    <p className="font-medium text-neutral-900">{ini.name}</p>
                    {ini.business_unit && <p className="text-xs text-neutral-400">{ini.business_unit}</p>}
                  </td>
                  <td className="py-2.5 pr-4 text-neutral-500 text-xs">{ini.owner ?? '—'}</td>
                  <td className={`py-2.5 pr-4 font-bold text-sm ${scoreColor(Number(ini.composite_score))}`}>
                    {Number(ini.composite_score).toFixed(1)}
                  </td>
                  <td className="py-2.5 pr-4 text-neutral-700 text-xs">{formatCurrency(Number(ini.three_year_value ?? 0))}</td>
                  <td className="py-2.5 pr-4 text-neutral-700 text-xs">{formatCurrency(Number(ini.confidence_adjusted_roi ?? 0))}</td>
                  <td className="py-2.5 text-xs text-neutral-500">{REC_LABEL[getRecommendation(ini)]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Recommendations */}
        {challenge?.content.recommendations && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3">Strategic Recommendations</h2>
            <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">{challenge.content.recommendations}</p>
          </section>
        )}

        {/* Stop / Accelerate */}
        {(toStop.length > 0 || toAccelerate.length > 0) && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4">Actions Required</h2>
            <div className="grid grid-cols-2 gap-6">
              {toStop.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-3">Stop</p>
                  <ul className="space-y-2">
                    {toStop.map((item, i) => (
                      <li key={i}>
                        <p className="text-sm font-medium text-neutral-800">{item.name}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{item.reason}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {toAccelerate.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-3">Accelerate</p>
                  <ul className="space-y-2">
                    {toAccelerate.map((item, i) => (
                      <li key={i}>
                        <p className="text-sm font-medium text-neutral-800">{item.name}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{item.reason}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Footer */}
        <div className="border-t border-neutral-200 pt-6 flex items-center justify-between">
          <p className="text-xs text-neutral-400">Confidential — Strategy Office</p>
          <p className="text-xs text-neutral-400">Generated {today}</p>
        </div>
      </div>
    </div>
  )
}
