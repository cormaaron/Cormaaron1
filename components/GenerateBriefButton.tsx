'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GenerateBriefButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleGenerate() {
    setError('')
    setLoading(true)

    const res = await fetch('/api/briefs/generate', { method: 'POST' })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Failed to generate brief')
    } else {
      router.push(`/briefs/${json.brief.id}`)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-white text-neutral-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-neutral-100 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Generating…' : 'Generate brief'}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
