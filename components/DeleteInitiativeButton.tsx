'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeleteInitiativeButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    const supabase = createClient()
    await supabase.from('initiatives').delete().eq('id', id)
    router.push('/initiatives')
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-400">Delete?</span>
        <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-300 transition-colors">
          Yes, delete
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-neutral-500 hover:text-red-400 transition-colors"
    >
      Delete
    </button>
  )
}
