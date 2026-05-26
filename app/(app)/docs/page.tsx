'use client'

import { useEffect, useState } from 'react'
import { StrategyDoc, DocType } from '@/lib/types'
import { authHeaders } from '@/lib/supabase/client'

const DOC_TYPES: { value: DocType; label: string }[] = [
  { value: 'strategy', label: 'Strategy' },
  { value: 'pmo', label: 'PMO' },
  { value: 'memo', label: 'Memo' },
  { value: 'other', label: 'Other' },
]

const TYPE_COLOR: Record<DocType, string> = {
  strategy: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  pmo:      'bg-purple-500/10 text-purple-400 border-purple-500/20',
  memo:     'bg-amber-500/10 text-amber-400 border-amber-500/20',
  other:    'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function DocsPage() {
  const [docs, setDocs] = useState<StrategyDoc[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', content: '', doc_type: 'strategy' as DocType })

  useEffect(() => { fetchDocs() }, [])

  async function fetchDocs() {
    const res = await fetch('/api/docs', { headers: await authHeaders() })
    const json = await res.json()
    if (json.docs) setDocs(json.docs)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/docs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...await authHeaders() },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    if (json.doc) {
      setDocs(d => [json.doc, ...d])
      setForm({ title: '', content: '', doc_type: 'strategy' })
      setShowForm(false)
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await fetch('/api/docs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...await authHeaders() },
      body: JSON.stringify({ id }),
    })
    setDocs(d => d.filter(x => x.id !== id))
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Strategy Documents</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Paste strategy docs, PMO reports, or executive memos. Agents use these as context when analyzing your portfolio.
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="shrink-0 bg-white text-neutral-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          {showForm ? 'Cancel' : 'Add Document'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-neutral-400 block mb-1.5">Title *</label>
              <input
                type="text" required value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. FY26 AI Strategy"
                className="w-full bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-600"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1.5">Type</label>
              <select
                value={form.doc_type}
                onChange={e => setForm(f => ({ ...f, doc_type: e.target.value as DocType }))}
                className="w-full bg-neutral-800 border border-neutral-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-600"
              >
                {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-neutral-400 block mb-1.5">Content *</label>
            <textarea
              required rows={8} value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Paste document content here. Plain text works best — no need to preserve formatting."
              className="w-full bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-neutral-600 resize-none font-mono"
            />
          </div>
          <button
            type="submit" disabled={saving}
            className="bg-white text-neutral-900 font-medium text-sm px-4 py-2 rounded-lg hover:bg-neutral-100 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Document'}
          </button>
        </form>
      )}

      {docs.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-16 text-center">
          <p className="text-neutral-500 text-sm">No documents added yet.</p>
          <p className="text-neutral-600 text-xs mt-1">Add strategy docs to give agents richer organizational context.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map(d => (
            <div key={d.id} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
              <div
                className="flex items-start justify-between gap-4 px-5 py-4 cursor-pointer hover:bg-neutral-800/40 transition-colors"
                onClick={() => setExpanded(expanded === d.id ? null : d.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${TYPE_COLOR[d.doc_type]}`}>
                      {d.doc_type}
                    </span>
                    <span className="text-xs text-neutral-600">{formatDate(d.created_at)}</span>
                  </div>
                  <p className="text-sm font-medium text-white">{d.title}</p>
                  {expanded !== d.id && (
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-1">{d.content}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(d.id) }}
                    className="text-xs text-neutral-700 hover:text-neutral-400 transition-colors"
                  >
                    Remove
                  </button>
                  <span className="text-xs text-neutral-600">{expanded === d.id ? '▲' : '▼'}</span>
                </div>
              </div>
              {expanded === d.id && (
                <div className="border-t border-neutral-800 px-5 py-4">
                  <p className="text-xs text-neutral-400 leading-relaxed whitespace-pre-wrap font-mono">{d.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
