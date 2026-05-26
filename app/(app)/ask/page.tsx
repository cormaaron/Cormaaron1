'use client'

import { useEffect, useRef, useState } from 'react'
import { ChatMessage } from '@/lib/types'
import { authHeaders } from '@/lib/supabase/client'

const EXAMPLES = [
  'Which initiatives are most at risk of missing their targets?',
  'What is our total capital committed across active initiatives?',
  'Which owner has the most concurrent initiatives?',
  'Where are we over-investing relative to expected return?',
  'Summarize the top 3 initiatives and why they rank highest.',
]

export default function AskPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    const userMsg: ChatMessage = { role: 'user', content: trimmed }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...await authHeaders() },
        body: JSON.stringify({ messages: next }),
      })
      const json = await res.json()
      if (json.response) {
        setMessages(m => [...m, { role: 'assistant', content: json.response }])
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Error reaching the advisor. Please try again.' }])
    }
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 6rem)' }}>
      <div className="mb-6 shrink-0">
        <h2 className="text-xl font-semibold text-white">Ask Your Portfolio</h2>
        <p className="text-sm text-neutral-400 mt-1">
          Full portfolio context — initiatives, financials, strategy documents.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 pb-4">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-neutral-600 uppercase tracking-wider mb-3">Example questions</p>
            {EXAMPLES.map(e => (
              <button
                key={e}
                onClick={() => send(e)}
                className="block w-full text-left bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
              >
                {e}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[88%]">
              <p className={`text-xs font-medium mb-1.5 ${m.role === 'user' ? 'text-right text-neutral-500' : 'text-neutral-500'}`}>
                {m.role === 'user' ? 'You' : 'Advisor'}
              </p>
              <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-white text-neutral-900'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-200'
              }`}>
                {m.content}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3.5">
              <div className="flex gap-1.5 items-center">
                {[0, 150, 300].map(delay => (
                  <div
                    key={delay}
                    className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <div className="shrink-0 border-t border-neutral-800 pt-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
            placeholder="Ask anything about your portfolio…"
            disabled={loading}
            className="flex-1 bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-600 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-neutral-600 disabled:opacity-50"
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="bg-white text-neutral-900 text-sm font-medium px-5 py-3 rounded-lg hover:bg-neutral-100 disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="mt-2 text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            Clear conversation
          </button>
        )}
      </div>
    </div>
  )
}
