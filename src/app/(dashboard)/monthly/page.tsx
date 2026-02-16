'use client'

import { useState, useEffect, useMemo } from 'react'
import { Transaction, CATEGORIES, MonthSummary } from '@/types'
import { getTransactions, getMonthSummary, getInvestments } from '@/lib/db'
import { DatabaseInvestment } from '@/lib/supabase/schema'
import { getUniqueMonths, formatMonth, currentMonthString } from '@/lib/date'
import { formatIDR } from '@/lib/money'
import { aggregateByCategory } from '@/lib/chart-data'
import { CategoryBreakdown } from '@/components/charts/category-breakdown'
import { TrendComparison } from '@/components/charts/trend-comparison'
import { PortfolioSummary } from '@/components/portfolio-summary'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function MonthlyPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [investments, setInvestments] = useState<DatabaseInvestment[]>([])
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthString())
  const [summary, setSummary] = useState<MonthSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [txs, invs] = await Promise.all([
          getTransactions(),
          getInvestments()
        ])
        setTransactions(txs)
        setInvestments(invs)

        const months = getUniqueMonths(txs.map(tx => tx.date))
        setAvailableMonths(months.length > 0 ? months : [currentMonthString()])
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    async function loadSummary() {
      try {
        const data = await getMonthSummary(selectedMonth)
        setSummary(data)
      } catch (err) {
        console.error('Failed to load summary:', err)
      }
    }
    loadSummary()
  }, [selectedMonth])

  // Memoize category data aggregation for chart performance
  // Must be called before any conditional returns to satisfy Rules of Hooks
  const categoryData = useMemo(() => {
    return aggregateByCategory(transactions, selectedMonth)
  }, [transactions, selectedMonth])

  if (!summary) {
    return (
      <div className="container mx-auto max-w-4xl space-y-6 p-4">
        <h1 className="text-3xl font-bold">Monthly Summary</h1>
        <Card className="p-8 text-center text-gray-500">
          <p>Loading...</p>
        </Card>
      </div>
    )
  }
  const net = summary.totalIncome - summary.totalExpenses
  const hasData = summary.totalExpenses > 0 || summary.totalIncome > 0

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4">
      <h1 className="text-3xl font-bold">Monthly Summary</h1>

      {/* Month Selector */}
      <div className="space-y-2">
        <Label htmlFor="month-select">Select Month</Label>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger id="month-select" className="w-full max-w-xs">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.map((month) => (
              <SelectItem key={month} value={month}>
                {formatMonth(month)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      {!hasData ? (
        <Card className="p-8 text-center text-gray-500">
          <p>No transactions for {formatMonth(selectedMonth)}</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Totals */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-6">
              <div className="text-sm font-medium text-gray-600">Total Income</div>
              <div className="mt-2 text-2xl font-bold text-green-600">
                {formatIDR(summary.totalIncome)}
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-gray-600">Total Expenses</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">
                {formatIDR(summary.totalExpenses)}
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-gray-600">Net</div>
              <div
                className={`mt-2 text-2xl font-bold ${
                  net >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {net >= 0 ? '+' : '-'}
                {formatIDR(Math.abs(net))}
              </div>
            </Card>
          </div>

          {/* Category Breakdown Chart */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Spending by Category</h2>
            <CategoryBreakdown data={categoryData} />
          </Card>

          {/* Trend Comparison Chart */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Spending Trends</h2>
            <TrendComparison />
          </Card>

          {/* Category Details */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Category Details</h2>
            <div className="space-y-3">
              {CATEGORIES.map((category) => {
                const amount = summary.byCategory[category]
                const percentage =
                  summary.totalExpenses > 0
                    ? ((amount / summary.totalExpenses) * 100).toFixed(1)
                    : '0.0'

                return (
                  <div
                    key={category}
                    className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{category}</div>
                      <div className="text-sm text-gray-500">{percentage}% of total</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatIDR(amount)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Investment Portfolio */}
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold">Investment Portfolio</h2>
            <PortfolioSummary investments={investments} />
          </div>
        </div>
      )}
    </div>
  )
}
