export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { Initiative } from '@/lib/types'
import { notFound } from 'next/navigation'
import InitiativeForm from '@/components/InitiativeForm'
import DeleteInitiativeButton from '@/components/DeleteInitiativeButton'
import ScoreBreakdown from '@/components/ScoreBreakdown'

export default async function InitiativeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('initiatives').select('*').eq('id', id).single()

  if (!data) notFound()

  const initiative = data as Initiative

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
