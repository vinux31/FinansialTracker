interface RiskIndicatorProps {
  level: 'LOW' | 'MEDIUM' | 'HIGH'
  label?: string
}

export function RiskIndicator({ level, label }: RiskIndicatorProps) {
  const config = {
    LOW: { color: 'bg-green-100 text-green-800 border-green-300', text: 'On Track' },
    MEDIUM: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', text: 'Warning' },
    HIGH: { color: 'bg-red-100 text-red-800 border-red-300', text: 'Critical' },
  }[level]

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium border rounded ${config.color}`}>
      {label || config.text}
    </span>
  )
}
