import { Initiative, formatCurrency, getRecommendation } from '@/lib/types'

const RECOMMENDATION_STYLE: Record<string, { label: string; color: string }> = {
  accelerate: { label: 'Accelerate', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  continue:   { label: 'Continue',   color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  watch:      { label: 'Watch',      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  stop:       { label: 'Stop',       color: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

export default function RoiBreakdown({ initiative }: { initiative: Initiative }) {
  const rec = getRecommendation(initiative)
  const style = RECOMMENDATION_STYLE[rec]

  const threeYr = Number(initiative.three_year_value ?? 0)
  const confAdj = Number(initiative.confidence_adjusted_roi ?? 0)
  const payback = initiative.payback_period_months

  const budget = Number(initiative.implementation_cost) + Number(initiative.annual_cost) * 3
  const multiple = budget > 0 ? ((confAdj + budget) / budget).toFixed(2) : null

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-300">ROI Model</p>
        <span className={`text-xs px-2.5 py-1 rounded-full border ${style.color}`}>
          {style.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
        <Stat label="Implementation Cost" value={formatCurrency(Number(initiative.implementation_cost))} />
        <Stat label="Annual Operating Cost" value={formatCurrency(Number(initiative.annual_cost))} />
        <Stat label="Expected Annual Benefit" value={formatCurrency(Number(initiative.expected_annual_benefit))} />
        <Stat label="Confidence Level" value={`${initiative.confidence_level}%`} />
        <Stat label="Time to Value" value={`${initiative.time_to_value_months} months`} />
        <Stat label="Payback Period" value={payback !== null ? `${payback} months` : '—'} />
      </div>

      <div className="border-t border-neutral-800 pt-4 grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-neutral-500">3-Year Net Value</p>
          <p className={`text-base font-semibold mt-1 ${threeYr >= 0 ? 'text-white' : 'text-red-400'}`}>
            {formatCurrency(threeYr)}
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Conf-Adj Value</p>
          <p className={`text-base font-semibold mt-1 ${confAdj >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(confAdj)}
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Return Multiple</p>
          <p className="text-base font-semibold text-white mt-1">
            {multiple !== null ? `${multiple}x` : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-sm font-medium text-white mt-0.5">{value}</p>
    </div>
  )
}
