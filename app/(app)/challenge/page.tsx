'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PortfolioChallenge, ChallengeContent } from '@/lib/types'

const REPORT_SECTIONS: { key: keyof ChallengeContent; label: string; accent: string }[] = [
  { key: 'portfolio_diagnosis',       label: 'Portfolio Diagnosis',         accent: 'border-neutral-700 bg-neutral-800/40' },
  { key: 'budget_waste',              label: 'Budget Waste',                accent: 'border-red-500/30 bg-red-500/5' },
  { key: 'weak_roi_assumptions',      label: 'Weak ROI Assumptions',        accent: 'border-amber-500/30 bg-amber-500/5' },
  { key: 'initiative_overlap',        label: 'Initiative Overlap',          accent: 'border-amber-500/30 bg-amber-500/5' },
  { key: 'governance_gaps',           label: 'Governance Gaps',             accent: 'border-amber-500/30 bg-amber-500/5' },
  { key: 'recommendations',           label: 'Recommendations',             accent: 'border-blue-500/30 bg-blue-500/5' },
  { key: 'reallocation_suggestions',  label: 'Reallocation Suggestions',    accent: 'border-emerald-500/30 bg-emerald-500/5' },
]

const AGENT_LABELS: { key: string; label: string; color: string }[] = [
  { key: 'analyst',        label: 'Portfolio Analyst',   color: 'text-blue-400' },
  { key: 'cfo',            label: 'CFO',                 color: 'text-amber-400' },
  { key: 'transformation', label: 'Transformation',      color: 'text-purple-400' },
  { key: 'strategy',       label: 'Strategy',            color: 'text-emerald-400' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ChallengePage() {
  const [challenge, setChallenge] = useState<PortfolioChallenge | null>(null)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState('')
  const [showAgents, setShowAgents] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('portfolio_challenges')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setChallenge(data as PortfolioChallenge)
        setInitializing(false)
      })
  }, [])

  async function runChallenge() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/challenge', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Challenge failed')
      } else {
        setChallenge(json.challenge as PortfolioChallenge)
      }
    } catch {
      setError('Network error — please try again')
    }
    setLoading(false)
  }

  const content = challenge?.content

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Challenge My Portfolio</h2>
          <p className="text-sm text-neutral-400 mt-1">
            4 specialist agents analyze your portfolio in parallel and produce a consolidated executive critique.
          </p>
          {challenge && (
            <p className="text-xs text-neutral-600 mt-1">Last run: {formatDate(challenge.created_at)}</p>
          )}
        </div>
        <button
          onClick={runChallenge}
          disabled={loading || initializing}
          className="shrink-0 bg-white text-neutral-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-neutral-100 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Analyzing…' : challenge ? 'Re-analyze' : 'Run Challenge'}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <p className="text-sm text-neutral-300">4 agents analyzing your portfolio…</p>
          </div>
          <div className="space-y-3">
            {AGENT_LABELS.map(a => (
              <div key={a.key} className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse bg-current ${a.color}`} />
                <p className={`text-xs ${a.color}`}>{a.label} Agent</p>
                <div className="flex-1 h-px bg-neutral-800" />
                <p className="text-xs text-neutral-600">running</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      {/* Report */}
      {!loading && content && (
        <div className="space-y-4">
          {/* Text sections */}
          {REPORT_SECTIONS.map(({ key, label, accent }) => {
            const value = content[key]
            if (!value || typeof value !== 'string') return null
            return (
              <div key={key} className={`rounded-xl border p-6 ${accent}`}>
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-3">{label}</p>
                <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-line">{value}</p>
              </div>
            )
          })}

          {/* Stop / Accelerate lists */}
          <div className="grid grid-cols-2 gap-4">
            <ActionList
              title="Stop"
              items={content.initiatives_to_stop ?? []}
              accent="border-red-500/30 bg-red-500/5"
              dot="bg-red-400"
            />
            <ActionList
              title="Accelerate"
              items={content.initiatives_to_accelerate ?? []}
              accent="border-emerald-500/30 bg-emerald-500/5"
              dot="bg-emerald-400"
            />
          </div>

          {/* Agent outputs (collapsed by default) */}
          {content.agent_outputs && (
            <div className="border border-neutral-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowAgents(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-neutral-800/40 transition-colors"
              >
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Agent Reasoning</p>
                <p className="text-xs text-neutral-600">{showAgents ? 'Hide' : 'Show'}</p>
              </button>
              {showAgents && (
                <div className="border-t border-neutral-800 divide-y divide-neutral-800">
                  {AGENT_LABELS.map(({ key, label, color }) => {
                    const output = content.agent_outputs?.[key as keyof typeof content.agent_outputs]
                    if (!output) return null
                    return (
                      <div key={key} className="px-5 py-4">
                        <p className={`text-xs font-semibold mb-2 ${color}`}>{label} Agent</p>
                        <p className="text-xs text-neutral-400 leading-relaxed whitespace-pre-line">{output}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !content && !initializing && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-16 text-center">
          <p className="text-neutral-400 text-sm">No challenge run yet.</p>
          <p className="text-neutral-600 text-xs mt-1">Click &ldquo;Run Challenge&rdquo; to analyze your portfolio with 4 AI agents.</p>
        </div>
      )}
    </div>
  )
}

function ActionList({ title, items, accent, dot }: {
  title: string
  items: { name: string; reason: string }[]
  accent: string
  dot: string
}) {
  return (
    <div className={`rounded-xl border p-5 ${accent}`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-4">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-neutral-600">None identified</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2.5">
              <div className={`w-1.5 h-1.5 rounded-full ${dot} mt-1.5 shrink-0`} />
              <div>
                <p className="text-sm font-medium text-white">{item.name}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{item.reason}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
