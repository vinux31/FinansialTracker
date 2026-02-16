'use client'

import type { DatabaseInvestment } from '@/lib/supabase/schema'
import { usePortfolioMetrics } from '@/lib/investments'
import { formatIDR } from '@/lib/money'

interface PortfolioSummaryProps {
  investments: DatabaseInvestment[]
}

export function PortfolioSummary({ investments }: PortfolioSummaryProps) {
  const metrics = usePortfolioMetrics(investments)

  // Empty state
  if (investments.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
        <p>Add investments to see portfolio summary</p>
      </div>
    )
  }

  // Determine gain/loss color
  const gainColor = metrics.gainPercent >= 0 ? 'text-green-600' : 'text-red-600'
  const gainSign = metrics.gainPercent >= 0 ? '+' : ''

  return (
    <div className="space-y-4">
      {/* Top row: Total Value and Gain/Loss */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Portfolio Value */}
        <div className="rounded-lg bg-blue-50 p-6 shadow-sm">
          <div className="text-sm font-medium text-blue-600">Total Value</div>
          <div className="mt-2 text-3xl font-bold text-blue-900">
            {formatIDR(metrics.totalValue)}
          </div>
        </div>

        {/* Gain/Loss */}
        <div className="rounded-lg bg-white p-6 shadow-sm border">
          <div className="text-sm font-medium text-gray-600">Gain/Loss</div>
          <div className={`mt-2 text-3xl font-bold ${gainColor}`}>
            {gainSign}{formatIDR(metrics.totalGain)}
          </div>
          <div className={`text-sm font-medium ${gainColor}`}>
            ({gainSign}{metrics.gainPercent.toFixed(1)}%)
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-3 gap-2">
        {/* Saham */}
        <div className="rounded-lg bg-gray-50 p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500">Saham</div>
          <div className="mt-1 text-sm font-semibold text-gray-900">
            {metrics.byCategory.Saham.count} investments
          </div>
          <div className="mt-2 text-lg font-bold text-blue-600">
            {formatIDR(metrics.byCategory.Saham.totalValue)}
          </div>
        </div>

        {/* Emas */}
        <div className="rounded-lg bg-gray-50 p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500">Emas</div>
          <div className="mt-1 text-sm font-semibold text-gray-900">
            {metrics.byCategory.Emas.count} investments
          </div>
          <div className="mt-2 text-lg font-bold text-yellow-600">
            {formatIDR(metrics.byCategory.Emas.totalValue)}
          </div>
        </div>

        {/* Reksadana */}
        <div className="rounded-lg bg-gray-50 p-4 shadow-sm">
          <div className="text-xs font-medium text-gray-500">Reksadana</div>
          <div className="mt-1 text-sm font-semibold text-gray-900">
            {metrics.byCategory.Reksadana.count} investments
          </div>
          <div className="mt-2 text-lg font-bold text-green-600">
            {formatIDR(metrics.byCategory.Reksadana.totalValue)}
          </div>
        </div>
      </div>
    </div>
  )
}
