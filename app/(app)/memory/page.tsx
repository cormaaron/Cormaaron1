'use client'

import { useEffect, useState } from 'react'
import { StrategyDecision, DecisionType } from '@/lib/types'
import { authHeaders } from '@/lib/supabase/client'

const TYPE_STYLE: Record<DecisionType, { label: string; color: string }> = {
  approved:  { label: 'Approved',  color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  rejected:  { label: 'Rejected',  color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  deferred:  { label: 'Deferred',  color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  noted:     { label: 'Noted',     color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
}

const TYPES: DecisionType[] = ['approved', 'rejected', 'deferred', 'noted']

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function MemoryPage() {
  const [decisions, setDecisions] = useState<StrategyDecision[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    decision_type: 'noted' as DecisionType,
    title: '',
    rationale: '',
    initiative_names_raw: '',
  })

  useEffect(() => {
    fetchDecisions()
  }, [])

  async function fetchDecisions() {
    const res = await fetch('/api/decisions', { headers: await authHeaders() })
    const json = await res.json()
    if (json.decisions) setDecisions(json.decisions)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/decisions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...await authHeaders() },
      body: JSON.stringify({
        decision_type: form.decision_type,
        title: form.title,
        rationale: form.rationale,
        initiative_names: form.initiative_names_raw
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
      }),
    })
    const json = await res.json()
    if (json.decision) {
      setDecisions(d => [json.decision, ...d])
      setForm({ decision_type: 'noted', title: '', rationale: '', initiative_names_raw: '' })
      setShowForm(false)
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await fetch('/api/decisions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...await authHeaders() },
      body: JSON.stringify({ id }),
    })
    setDecisions(d => d.filter(x => x.id !== id))
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Strategy Memory</h2>
          <p className="text-sm text-neutral-400 mt-1">Persistent log of executive decisions, rejections, and strategic rationale.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="shrink-0 bg-white text-neutral-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          {showForm ? 'Cancel' : 'Log Decision'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-neutral-400 block mb-1.5">Decision Type</label>
              <select
                value={form.decision_type}
                onChange={e => setForm(f => ({ ...f, decision_type: e.target.value as DecisionType }))}
                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-600"
              >
                {TYPES.map(t => (
                  <option key={t} value={t}>{TYPE_STYLE[t].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1.5">Related Initiatives</label>
              <input
                type="text"
                placeholder="Initiative A, Initiative B"
                value={form.initiative_names_raw}
                onChange={e => setForm(f => ({ ...f, initiative_names_raw: e.target.value }))}
                className="w-full bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-600"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-neutral-400 block mb-1.5">Decision Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Approved consolidation of data platform initiatives"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-600"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-400 block mb-1.5">Rationale</label>
            <textarea
              rows={3}
              placeholder="Why was this decision made?"
              value={form.rationale}
              onChange={e => setForm(f => ({ ...f, rationale: e.target.value }))}
              className="w-full bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-600 resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-white text-neutral-900 font-medium text-sm px-4 py-2 rounded-lg hover:bg-neutral-100 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Decision'}
          </button>
        </form>
      )}

      {/* Decision list */}
      {decisions.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-16 text-center">
          <p className="text-neutral-500 text-sm">No decisions logged yet.</p>
          <p className="text-neutral-600 text-xs mt-1">Log executive decisions to build institutional memory.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {decisions.map(d => {
            const style = TYPE_STYLE[d.decision_type]
            return (
              <div key={d.id} className="bg-neutral-900 border border-neutral-800 rounded-xl px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${style.color}`}>{style.label}</span>
                      <span className="text-xs text-neutral-600">{formatDate(d.created_at)}</span>
                    </div>
                    <p className="text-sm font-medium text-white">{d.title}</p>
                    {d.rationale && (
                      <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">{d.rationale}</p>
                    )}
                    {d.initiative_names && d.initiative_names.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {d.initiative_names.map(n => (
                          <span key={n} className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded">{n}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="text-neutral-700 hover:text-neutral-400 transition-colors text-xs shrink-0"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
