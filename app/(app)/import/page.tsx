'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { InitiativeStatus } from '@/lib/types'

const TEMPLATE_CSV = `name,description,owner,status,business_unit,strategic_objective,business_value,feasibility,readiness,risk,implementation_cost,annual_cost,expected_annual_benefit,confidence_level,time_to_value_months
Customer Data Platform,Unified customer data layer,Jane Smith,active,Technology,Data & Analytics,8,6,5,7,500000,80000,300000,70,18
AI Ops Automation,Automate operational workflows,John Lee,active,Operations,Efficiency,7,7,6,6,200000,30000,180000,65,12`

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, '_'))
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values: string[] = []
    let cur = ''
    let inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === ',' && !inQ) { values.push(cur.trim()); cur = '' }
      else { cur += ch }
    }
    values.push(cur.trim())
    return Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? '').replace(/^"|"$/g, '')]))
  })
}

function mapRow(row: Record<string, string>) {
  const n = (k: string, def = 0) => parseFloat(row[k] ?? '') || def
  const i = (k: string, def = 0) => parseInt(row[k] ?? '') || def
  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
  const statuses = ['active', 'paused', 'completed', 'cancelled']
  return {
    name: (row.name ?? '').trim(),
    description: row.description?.trim() || null,
    owner: row.owner?.trim() || null,
    status: (statuses.includes(row.status) ? row.status : 'active') as InitiativeStatus,
    business_unit: row.business_unit?.trim() || null,
    strategic_objective: row.strategic_objective?.trim() || null,
    business_value: clamp(i('business_value', 5), 1, 10),
    feasibility: clamp(i('feasibility', 5), 1, 10),
    readiness: clamp(i('readiness', 5), 1, 10),
    risk: clamp(i('risk', 5), 1, 10),
    implementation_cost: n('implementation_cost', 0),
    annual_cost: n('annual_cost', 0),
    expected_annual_benefit: n('expected_annual_benefit', 0),
    confidence_level: clamp(i('confidence_level', 70), 0, 100),
    time_to_value_months: Math.max(1, i('time_to_value_months', 12)),
  }
}

export default function ImportPage() {
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFile(file: File) {
    setFileName(file.name)
    setResult(null)
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      setRows(parsed)
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (!rows.length) return
    setImporting(true)
    setResult(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setImporting(false); return }

    const mapped = rows.map(r => mapRow(r)).filter(r => r.name)
    const errors: string[] = []
    let imported = 0

    for (const initiative of mapped) {
      const { error } = await supabase.from('initiatives').insert({ ...initiative, user_id: user.id })
      if (error) errors.push(`${initiative.name}: ${error.message}`)
      else imported++
    }

    setResult({ imported, errors })
    setImporting(false)
    if (imported > 0) setTimeout(() => router.push('/initiatives'), 1500)
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'initiative-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const validRows = rows.map(r => mapRow(r)).filter(r => r.name)

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Import Initiatives</h2>
          <p className="text-sm text-neutral-400 mt-1">Bulk upload from a CSV spreadsheet.</p>
        </div>
        <button
          onClick={downloadTemplate}
          className="text-sm text-neutral-400 hover:text-white transition-colors border border-neutral-800 px-4 py-2 rounded-lg hover:border-neutral-600"
        >
          Download template
        </button>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        className="border-2 border-dashed border-neutral-800 hover:border-neutral-600 rounded-xl p-12 text-center cursor-pointer transition-colors"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        {fileName ? (
          <div>
            <p className="text-white text-sm font-medium">{fileName}</p>
            <p className="text-neutral-500 text-xs mt-1">{rows.length} rows detected · {validRows.length} valid initiatives</p>
          </div>
        ) : (
          <div>
            <p className="text-neutral-400 text-sm">Drop a CSV file here, or click to browse</p>
            <p className="text-neutral-600 text-xs mt-1">Use the template above to get the right column format</p>
          </div>
        )}
      </div>

      {/* Preview */}
      {validRows.length > 0 && (
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">
            Preview — first {Math.min(5, validRows.length)} of {validRows.length} initiatives
          </p>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800">
                  {['Name', 'Owner', 'Status', 'BU', 'Score preview', 'Impl. Cost'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-neutral-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {validRows.slice(0, 5).map((r, i) => {
                  const score = (r.business_value * 0.4 + r.feasibility * 0.25 + r.readiness * 0.2 + r.risk * 0.15).toFixed(1)
                  return (
                    <tr key={i}>
                      <td className="px-4 py-3 text-white font-medium">{r.name}</td>
                      <td className="px-4 py-3 text-neutral-400">{r.owner ?? '—'}</td>
                      <td className="px-4 py-3 text-neutral-400">{r.status}</td>
                      <td className="px-4 py-3 text-neutral-400">{r.business_unit ?? '—'}</td>
                      <td className="px-4 py-3 text-neutral-300">{score}</td>
                      <td className="px-4 py-3 text-neutral-400">
                        {r.implementation_cost > 0 ? `$${r.implementation_cost.toLocaleString()}` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {result ? (
            <div className={`mt-4 p-4 rounded-xl text-sm ${result.errors.length === 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
              {result.imported} initiative{result.imported !== 1 ? 's' : ''} imported.
              {result.errors.length > 0 && <div className="mt-1 text-xs">{result.errors.join(', ')}</div>}
            </div>
          ) : (
            <button
              onClick={handleImport}
              disabled={importing}
              className="mt-4 bg-white text-neutral-900 font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-neutral-100 disabled:opacity-50 transition-colors"
            >
              {importing ? `Importing…` : `Import ${validRows.length} initiative${validRows.length !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
