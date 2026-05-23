'use client'

import { useState } from 'react'
import { ScenarioResult } from '@/lib/types'
import { authHeaders } from '@/lib/supabase/client'

const PRESETS = [
  'Reduce AI/transformation budget by 20% — identify what to cut and in what order',
  'Stop all initiatives with confidence below 50% — show portfolio impact',
  'Centralize AI governance — identify consolidation and rationalization opportunities',
  'Prioritize operational AI — reallocate from productivity tooling and copilots',
  'Accelerate the top 3 initiatives by score — identify resource requirements and risks',
]

export default function ScenariosPage() {
  const [scenario, setScenario] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScenarioResult | null>(null)
  const [error, setError] = useState('')

  async function simulate(text: string) {
    if (!text.trim()) return
    setScenario(text)
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...await authHeaders() },
        body: JSON.stringify({ scenario: text }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Simulation failed')
      } else {
        setResult(json.result)
      }
    } catch {
      setError('Network error — please try again')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-white">Scenario Simulation</h2>
        <p className="text-sm text-neutral-400 mt-1">Model the impact of strategic decisions before making them.</p>
      </div>

      {/* Preset scenarios */}
      <div>
        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">Preset scenarios</p>
        <div className="space-y-2">
          {PRESETS.map(p => (
            <button
              key={p}
              onClick={() => simulate(p)}
              disabled={loading}
              className="w-full text-left bg-neutral-900 border border-neutral-800 rounded-xl px-5 py-3.5 text-sm text-neutral-300 hover:text-white hover:border-neutral-700 disabled:opacity-40 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Custom scenario */}
      <div>
        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">Custom scenario</p>
        <div className="flex gap-3">
          <input
            type="text"
            value={scenario}
            onChange={e => setScenario(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && simulate(scenario)}
            placeholder="Describe a scenario to simulate…"
            className="flex-1 bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-neutral-600"
          />
          <button
            onClick={() => simulate(scenario)}
            disabled={loading || !scenario.trim()}
            className="bg-white text-neutral-900 text-sm font-medium px-4 py-3 rounded-lg hover:bg-neutral-100 disabled:opacity-50 transition-colors shrink-0"
          >
            {loading ? 'Simulating…' : 'Simulate'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Result */}
      {loading && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse mx-auto mb-3" />
          <p className="text-sm text-neutral-400">Modeling scenario impact…</p>
        </div>
      )}

      {!loading && result && (
        <div className="space-y-4">
          <div className="border border-neutral-700 bg-neutral-800/40 rounded-xl p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-2">{result.scenario_name}</p>
            <p className="text-sm text-neutral-200 leading-relaxed">{result.summary}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <MetricCard label="Budget Impact" value={result.budget_impact} accent="border-red-500/20 bg-red-500/5" />
            <MetricCard label="ROI Impact" value={result.roi_impact} accent="border-amber-500/20 bg-amber-500/5" />
            <MetricCard label="Execution Impact" value={result.execution_impact} accent="border-blue-500/20 bg-blue-500/5" />
            <MetricCard label="Transformation Risk" value={result.transformation_risk} accent="border-purple-500/20 bg-purple-500/5" />
          </div>

          {result.affected_initiatives && result.affected_initiatives.length > 0 && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-4">
                Affected Initiatives ({result.affected_initiatives.length})
              </p>
              <div className="space-y-3">
                {result.affected_initiatives.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">{item.impact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-2">Recommendation</p>
            <p className="text-sm text-neutral-200 leading-relaxed">{result.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className={`rounded-xl border p-4 ${accent}`}>
      <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-2">{label}</p>
      <p className="text-sm text-neutral-200 leading-relaxed">{value}</p>
    </div>
  )
}
