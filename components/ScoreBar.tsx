export default function ScoreBar({ score }: { score: number }) {
  const pct = (score / 10) * 100
  const color = score >= 7 ? 'bg-emerald-500' : score >= 5 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
