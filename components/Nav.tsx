'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_GROUPS = [
  {
    label: 'Portfolio',
    links: [
      { href: '/', label: 'Dashboard' },
      { href: '/initiatives', label: 'Initiatives' },
      { href: '/import', label: 'Import Data' },
    ],
  },
  {
    label: 'Intelligence',
    links: [
      { href: '/challenge', label: 'Challenge Portfolio' },
      { href: '/ask', label: 'Ask Portfolio' },
      { href: '/scenarios', label: 'Scenarios' },
    ],
  },
  {
    label: 'Output',
    links: [
      { href: '/board-pack', label: 'Board Pack' },
      { href: '/briefs', label: 'Decision Memos' },
    ],
  },
  {
    label: 'Library',
    links: [
      { href: '/docs', label: 'Strategy Docs' },
      { href: '/memory', label: 'Strategy Memory' },
    ],
  },
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
    <nav className="fixed left-0 top-0 h-full w-56 bg-neutral-900 border-r border-neutral-800 flex flex-col print:hidden">
      <div className="px-5 py-5 border-b border-neutral-800">
        <h1 className="text-sm font-semibold text-white tracking-tight">Strategy Office</h1>
        <p className="text-xs text-neutral-500 mt-0.5 truncate">{userEmail}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-xs text-neutral-600 font-medium uppercase tracking-wider px-3 mb-1">{group.label}</p>
            <div className="space-y-0.5">
              {group.links.map(({ href, label }) => {
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
          </div>
        ))}
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
