'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()

    const { error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
    } else {
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-semibold text-white tracking-tight">Strategy Office</h1>
          <p className="mt-1 text-sm text-neutral-400">AI-native portfolio management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-neutral-600"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-neutral-600"
          />

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-neutral-900 font-medium rounded-lg px-4 py-3 text-sm hover:bg-neutral-100 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-neutral-300 hover:text-white transition-colors"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
