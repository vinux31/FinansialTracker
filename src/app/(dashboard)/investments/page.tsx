'use client'

import { useState, useEffect } from 'react'
import { InvestmentForm } from '@/components/investment-form'
import { InvestmentList } from '@/components/investment-list'
import { PortfolioSummary } from '@/components/portfolio-summary'
import { getInvestments } from '@/lib/db'
import type { DatabaseInvestment } from '@/lib/supabase/schema'

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<DatabaseInvestment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load investments on mount
  useEffect(() => {
    loadInvestments()
  }, [])

  const loadInvestments = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getInvestments()
      setInvestments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load investments')
      console.error('Failed to load investments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadInvestments()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="mb-6 text-2xl font-bold">Investment Portfolio</h1>

      {/* Portfolio Summary */}
      {loading ? (
        <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
          <p>Loading portfolio...</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-600">
          <p>{error}</p>
        </div>
      ) : (
        <PortfolioSummary investments={investments} />
      )}

      {/* Divider */}
      <div className="border-t my-8" />

      {/* Investment Form */}
      <InvestmentForm onSuccess={handleRefresh} />

      {/* Divider */}
      <div className="border-t pt-8" />

      {/* Investment List Section */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Your Investments</h2>

        {loading ? (
          <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
            <p>Loading investments...</p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-600">
            <p>{error}</p>
          </div>
        ) : (
          <InvestmentList investments={investments} onUpdate={handleRefresh} />
        )}
      </div>
    </div>
  )
}
