'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Initiative, InitiativeStatus } from '@/lib/types'

const STATUSES: InitiativeStatus[] = ['active', 'paused', 'completed', 'cancelled']

function ScoreInput({
  label,
  name,
  value,
  onChange,
  hint,
}: {
  label: string
  name: string
  value: number
  onChange: (v: number) => void
  hint: string
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
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-white"
      />
      <div className="flex justify-between text-xs text-neutral-600 mt-1">
        <span>1</span>
        <span>10</span>
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
  })

  const preview = (
    form.business_value * 0.4 +
    form.feasibility * 0.25 +
    form.readiness * 0.2 +
    form.risk * 0.15
  ).toFixed(2)

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
      <div className="space-y-4">
        <div>
          <label className="text-sm text-neutral-300 block mb-1.5">Initiative name *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
            className="w-full bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-neutral-600"
            placeholder="e.g. Customer Data Platform"
          />
        </div>

        <div>
          <label className="text-sm text-neutral-300 block mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={3}
            className="w-full bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-neutral-600 resize-none"
            placeholder="Brief description of the initiative…"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-neutral-300 block mb-1.5">Owner</label>
            <input
              type="text"
              value={form.owner}
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

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-300">Scoring</p>
          <div className="text-right">
            <p className="text-xs text-neutral-500">Composite score</p>
            <p className="text-lg font-semibold text-white">{preview}</p>
          </div>
        </div>

        <ScoreInput
          label="Business Value"
          name="business_value"
          value={form.business_value}
          onChange={v => setForm(f => ({ ...f, business_value: v }))}
          hint="40%"
        />
        <ScoreInput
          label="Feasibility"
          name="feasibility"
          value={form.feasibility}
          onChange={v => setForm(f => ({ ...f, feasibility: v }))}
          hint="25%"
        />
        <ScoreInput
          label="Readiness"
          name="readiness"
          value={form.readiness}
          onChange={v => setForm(f => ({ ...f, readiness: v }))}
          hint="20%"
        />
        <ScoreInput
          label="Risk"
          name="risk"
          value={form.risk}
          onChange={v => setForm(f => ({ ...f, risk: v }))}
          hint="15%"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-white text-neutral-900 font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-neutral-100 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving…' : initiative ? 'Save changes' : 'Create initiative'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-neutral-400 hover:text-white transition-colors px-5 py-2.5"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
