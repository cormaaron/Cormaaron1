'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/initiatives', label: 'Initiatives' },
  { href: '/briefs', label: 'Decision Memos' },
]

export default function Nav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="fixed left-0 top-0 h-full w-56 bg-neutral-900 border-r border-neutral-800 flex flex-col">
      <div className="px-6 py-6 border-b border-neutral-800">
        <h1 className="text-sm font-semibold text-white tracking-tight">Strategy Office</h1>
        <p className="text-xs text-neutral-500 mt-0.5 truncate">{userEmail}</p>
      </div>

      <div className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </div>

      <div className="px-3 py-4 border-t border-neutral-800">
        <button
          onClick={signOut}
          className="w-full text-left px-3 py-2 text-sm text-neutral-500 hover:text-neutral-300 transition-colors rounded-md hover:bg-neutral-800/50"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
