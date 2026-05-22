'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Initiative } from '@/lib/types'
import InitiativeForm from '@/components/InitiativeForm'
import DeleteInitiativeButton from '@/components/DeleteInitiativeButton'
import ScoreBreakdown from '@/components/ScoreBreakdown'

export default function InitiativeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [initiative, setInitiative] = useState<Initiative | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('initiatives').select('*').eq('id', id).single()
      .then(({ data }) => setInitiative(data as Initiative))
  }, [id])

  if (!initiative) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="h-8 bg-neutral-800 rounded animate-pulse w-48 mb-8" />
        <div className="h-32 bg-neutral-800 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">{initiative.name}</h2>
        <DeleteInitiativeButton id={initiative.id} />
      </div>
      <ScoreBreakdown initiative={initiative} />
      <div>
        <h3 className="text-sm font-medium text-neutral-400 mb-4">Edit</h3>
        <InitiativeForm initiative={initiative} />
      </div>
    </div>
  )
}
