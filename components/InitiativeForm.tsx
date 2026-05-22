'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Initiative, InitiativeStatus, formatCurrency } from '@/lib/types'

const STATUSES: InitiativeStatus[] = ['active', 'paused', 'completed', 'cancelled']

function ScoreInput({
  label, value, onChange, hint,
}: {
  label: string; value: number; onChange: (v: number) => void; hint: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm text-neutral-300">{label}</label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">{hint}</span>
          <span className="text-sm font-semibold text-white w-4 text-right">{value}</span>
        </div>
      </div>
      <input
        type="range" min={1} max={10} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-white"
      />
      <div className="flex justify-between text-xs text-neutral-600 mt-1">
        <span>1</span><span>10</span>
      </div>
    </div>
  )
}

function CurrencyInput({
  label, value, onChange, hint,
}: {
  label: string; value: number; onChange: (v: number) => void; hint?: string
}) {
  return (
    <div>
      <label className="text-sm text-neutral-300 block mb-1.5">
        {label}
        {hint && <span className="text-neutral-600 text-xs ml-1.5">{hint}</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">$</span>
        <input
          type="number" min={0} step={1000} value={value || ''}
          onChange={e => onChange(Number(e.target.value) || 0)}
          className="w-full bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 rounded-lg pl-7 pr-4 py-3 text-sm focus:outline-none focus:border-neutral-600"
          placeholder="0"
        />
      </div>
    </div>
  )
}

export default function InitiativeForm({ initiative }: { initiative?: Initiative }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: initiative?.name ?? '',
    description: initiative?.description ?? '',
    owner: initiative?.owner ?? '',
    status: (initiative?.status ?? 'active') as InitiativeStatus,
    business_value: initiative?.business_value ?? 5,
    feasibility: initiative?.feasibility ?? 5,
    readiness: initiative?.readiness ?? 5,
    risk: initiative?.risk ?? 5,
    annual_cost: initiative?.annual_cost ?? 0,
    implementation_cost: initiative?.implementation_cost ?? 0,
    expected_annual_benefit: initiative?.expected_annual_benefit ?? 0,
    confidence_level: initiative?.confidence_level ?? 70,
    time_to_value_months: initiative?.time_to_value_months ?? 12,
  })

  const compositeScore = (
    form.business_value * 0.4 +
    form.feasibility * 0.25 +
    form.readiness * 0.2 +
    form.risk * 0.15
  ).toFixed(2)

  const threeYearValue = (form.expected_annual_benefit - form.annual_cost) * 3 - form.implementation_cost
  const confidenceAdj = threeYearValue * form.confidence_level / 100
  const netAnnual = form.expected_annual_benefit - form.annual_cost
  const payback = netAnnual > 0
    ? Math.round(form.implementation_cost / netAnnual * 12)
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    const payload = { ...form, user_id: user.id }

    const { error: err } = initiative
      ? await supabase.from('initiatives').update(payload).eq('id', initiative.id)
      : await supabase.from('initiatives').insert(payload)

    if (err) {
      setError(err.message)
    } else {
      router.push('/initiatives')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic info */}
      <div className="space-y-4">
        <div>
          <label className="text-sm text-neutral-300 block mb-1.5">Initiative name *</label>
          <input
            type="text" value={form.name} required
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-neutral-600"
            placeholder="e.g. Customer Data Platform"
          />
        </div>

        <div>
          <label className="text-sm text-neutral-300 block mb-1.5">Description</label>
          <textarea
            value={form.description} rows={3}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-neutral-600 resize-none"
            placeholder="Brief description of the initiative…"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-neutral-300 block mb-1.5">Owner</label>
            <input
              type="text" value={form.owner}
              onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
              className="w-full bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-neutral-600"
              placeholder="e.g. Jane Smith"
            />
          </div>
          <div>
            <label className="text-sm text-neutral-300 block mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as InitiativeStatus }))}
              className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-neutral-600"
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Strategic scoring */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-300">Strategic Scoring</p>
          <div className="text-right">
            <p className="text-xs text-neutral-500">Composite score</p>
            <p className="text-lg font-semibold text-white">{compositeScore}</p>
          </div>
        </div>
        <ScoreInput label="Business Value" value={form.business_value} onChange={v => setForm(f => ({ ...f, business_value: v }))} hint="40%" />
        <ScoreInput label="Feasibility" value={form.feasibility} onChange={v => setForm(f => ({ ...f, feasibility: v }))} hint="25%" />
        <ScoreInput label="Readiness" value={form.readiness} onChange={v => setForm(f => ({ ...f, readiness: v }))} hint="20%" />
        <ScoreInput label="Risk" value={form.risk} onChange={v => setForm(f => ({ ...f, risk: v }))} hint="15%" />
      </div>

      {/* ROI model */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-5">
        <p className="text-sm font-medium text-neutral-300">ROI Model</p>

        <div className="grid grid-cols-2 gap-4">
          <CurrencyInput label="Implementation Cost" hint="one-time" value={form.implementation_cost} onChange={v => setForm(f => ({ ...f, implementation_cost: v }))} />
          <CurrencyInput label="Annual Operating Cost" hint="recurring" value={form.annual_cost} onChange={v => setForm(f => ({ ...f, annual_cost: v }))} />
        </div>

        <CurrencyInput label="Expected Annual Benefit" value={form.expected_annual_benefit} onChange={v => setForm(f => ({ ...f, expected_annual_benefit: v }))} />

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-neutral-300">Confidence Level</label>
            <span className="text-sm font-semibold text-white">{form.confidence_level}%</span>
          </div>
          <input
            type="range" min={0} max={100} value={form.confidence_level}
            onChange={e => setForm(f => ({ ...f, confidence_level: Number(e.target.value) }))}
            className="w-full accent-white"
          />
          <div className="flex justify-between text-xs text-neutral-600 mt-1">
            <span>0% — speculative</span><span>100% — certain</span>
          </div>
        </div>

        <div>
          <label className="text-sm text-neutral-300 block mb-1.5">Time to Value</label>
          <div className="relative">
            <input
              type="number" min={1} max={120} value={form.time_to_value_months}
              onChange={e => setForm(f => ({ ...f, time_to_value_months: Number(e.target.value) || 12 }))}
              className="w-full bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 rounded-lg px-4 pr-16 py-3 text-sm focus:outline-none focus:border-neutral-600"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">months</span>
          </div>
        </div>

        {/* Live ROI preview */}
        <div className="border-t border-neutral-800 pt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-neutral-500">Payback Period</p>
            <p className="text-sm font-semibold text-white mt-0.5">
              {payback !== null ? `${payback}mo` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">3-Year Net Value</p>
            <p className={`text-sm font-semibold mt-0.5 ${threeYearValue >= 0 ? 'text-white' : 'text-red-400'}`}>
              {formatCurrency(threeYearValue)}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Conf-Adj Value</p>
            <p className={`text-sm font-semibold mt-0.5 ${confidenceAdj >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(confidenceAdj)}
            </p>
          </div>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit" disabled={loading}
          className="bg-white text-neutral-900 font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-neutral-100 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving…' : initiative ? 'Save changes' : 'Create initiative'}
        </button>
        <button
          type="button" onClick={() => router.back()}
          className="text-sm text-neutral-400 hover:text-white transition-colors px-5 py-2.5"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
