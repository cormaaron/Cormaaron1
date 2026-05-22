'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setStatus('Step 1: Creating client…')

    let supabase
    try {
      supabase = createClient()
      setStatus('Step 2: Client created. Calling auth…')
    } catch (err: unknown) {
      setStatus('Error creating client: ' + (err instanceof Error ? err.message : String(err)))
      setLoading(false)
      return
    }

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setStatus('Auth error: ' + error.message)
          setLoading(false)
        } else if (data.session) {
          setStatus('Step 3: Signed in! Redirecting…')
          window.location.href = '/'
        } else {
          setStatus('No session returned — unexpected')
          setLoading(false)
        }
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) {
          setStatus('Signup error: ' + error.message)
          setLoading(false)
        } else if (data.session) {
          setStatus('Account created! Redirecting…')
          window.location.href = '/'
        } else {
          setStatus('Check your email to confirm your account.')
          setLoading(false)
        }
      }
    } catch (err: unknown) {
      setStatus('Exception: ' + (err instanceof Error ? err.message : String(err)))
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

          {status && (
            <p className="text-xs p-2 rounded bg-neutral-800 text-neutral-300 break-all">{status}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-neutral-900 font-medium rounded-lg px-4 py-3 text-sm hover:bg-neutral-100 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create account'}
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
