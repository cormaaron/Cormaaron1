'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Brief } from '@/lib/types'
import { authHeaders } from '@/lib/supabase/client'

export default function GenerateBriefButton({ onGenerated }: { onGenerated?: (brief: Brief) => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleGenerate() {
    setError('')
    setLoading(true)

    const res = await fetch('/api/briefs/generate', { method: 'POST', headers: await authHeaders() })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Failed to generate brief')
      setLoading(false)
    } else {
      if (onGenerated) onGenerated(json.brief)
      router.push(`/briefs/${json.brief.id}`)
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
        {loading ? 'Generating…' : 'Generate memo'}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
