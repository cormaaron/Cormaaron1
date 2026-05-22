'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    const supabase = createClient()
    setMessage('Connecting…')

    const timer = setTimeout(() => {
      setError('Timed out after 10s. Check your connection or try again.')
      setMessage('')
      setLoading(false)
    }, 10000)

    try {
      if (mode === 'login') {
        setMessage('Signing in…')
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        clearTimeout(timer)
        if (err) { setError(err.message); setMessage(''); setLoading(false) }
        else { setMessage('Success! Loading…'); window.location.href = '/' }
      } else {
        setMessage('Creating account…')
        const { data, error: err } = await supabase.auth.signUp({ email, password })
        clearTimeout(timer)
        if (err) { setError(err.message); setMessage(''); setLoading(false) }
        else if (data.session) { setMessage('Success! Loading…'); window.location.href = '/' }
        else { setMessage('Check your email for a confirmation link.'); setLoading(false) }
      }
    } catch (e: unknown) {
      clearTimeout(timer)
      setError(e instanceof Error ? e.message : 'Unexpected error')
      setMessage('')
      setLoading(false)
    }
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
          {message && <p className="text-emerald-400 text-xs">{message}</p>}

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

        <p className="mt-4 text-center text-xs text-neutral-700">
          {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ config loaded' : '✗ config missing'}
        </p>
      </div>
    </div>
  )
}
