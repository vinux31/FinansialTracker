'use client'

import type { DatabaseInvestment } from '@/lib/supabase/schema'
import { formatIDR } from '@/lib/money'

interface InvestmentListProps {
  investments: DatabaseInvestment[]
}

export function InvestmentList({ investments }: InvestmentListProps) {
  if (investments.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
        <p>No investments yet. Add your first investment above.</p>
      </div>
    )
  }

  // Category badge color mapping
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Saham':
        return 'bg-blue-100 text-blue-700'
      case 'Emas':
        return 'bg-yellow-100 text-yellow-700'
      case 'Reksadana':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {investments.map((investment) => (
        <div
          key={investment.id}
          className="rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{investment.name}</h3>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium ${getCategoryColor(
                  investment.category
                )}`}
              >
                {investment.category}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Monthly Contribution:</span>
              <span className="font-medium">{formatIDR(investment.monthly_contribution)}/month</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Value:</span>
              <span className="text-lg font-bold text-gray-900">{formatIDR(investment.current_value)}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Purchased:</span>
              <span className="text-gray-700">{investment.purchase_date}</span>
            </div>

            {investment.notes && (
              <div className="mt-3 border-t pt-2">
                <p className="text-xs text-gray-500">{investment.notes}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
