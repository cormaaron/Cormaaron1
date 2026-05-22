export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import Nav from '@/components/Nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    return (
      <div className="flex min-h-screen">
        <Nav userEmail={user.email ?? ''} />
        <main className="flex-1 ml-56 p-8 overflow-auto">
          {children}
        </main>
      </div>
    )
  } catch (error) {
    if (isRedirectError(error)) throw error
    redirect('/login')
  }
}
