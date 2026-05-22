import { Initiative } from '@/lib/types'

const dimensions = [
  { key: 'business_value', label: 'Business Value', weight: 0.40 },
  { key: 'feasibility', label: 'Feasibility', weight: 0.25 },
  { key: 'readiness', label: 'Readiness', weight: 0.20 },
  { key: 'risk', label: 'Risk', weight: 0.15 },
] as const

export default function ScoreBreakdown({ initiative }: { initiative: Initiative }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm font-medium text-neutral-300">Score breakdown</p>
        <div className="text-right">
          <p className="text-2xl font-semibold text-white">{Number(initiative.composite_score).toFixed(1)}</p>
          <p className="text-xs text-neutral-500">composite</p>
        </div>
      </div>
      <div className="space-y-3">
        {dimensions.map(({ key, label, weight }) => {
          const value = initiative[key] as number
          const pct = (value / 10) * 100
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-400">{label}</span>
                <span className="text-xs text-neutral-300 font-medium">{value}/10 <span className="text-neutral-600">({(weight * 100).toFixed(0)}%)</span></span>
              </div>
              <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-neutral-400 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
