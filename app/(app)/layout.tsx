'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Nav from '@/components/Nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    try {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) {
          router.replace('/login')
        } else {
          setEmail(user.email ?? '')
          setReady(true)
        }
      }).catch(() => router.replace('/login'))
    } catch {
      router.replace('/login')
    }
  }, [router])

  if (!ready) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-neutral-600 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Nav userEmail={email ?? ''} />
      <main className="flex-1 ml-56 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
