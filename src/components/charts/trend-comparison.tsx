'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { getTransactions } from '@/lib/db'
import { aggregateByMonth } from '@/lib/chart-data'
import { formatIDR } from '@/lib/money'
import { format } from 'date-fns'
import currency from 'currency.js'
import { Transaction } from '@/types'

export function TrendComparison() {
  const [timeRange, setTimeRange] = useState<'3' | '6' | '12'>('3')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load transactions from database
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const txs = await getTransactions()
        setTransactions(txs)
      } catch (err) {
        console.error('Failed to load transactions:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Aggregate by month
  const monthData = useMemo(() => {
    const data = aggregateByMonth(transactions, parseInt(timeRange))
    // Reverse to show oldest to newest (left to right)
    return data.reverse()
  }, [transactions, timeRange])

  // Calculate metrics based on aggregated data
  const metrics = useMemo(() => {
    if (monthData.length === 0) {
      return { percentageChange: null, averageSpending: 0 }
    }

    // Percentage change: last month vs previous month
    let percentageChange: string | null = null
    if (monthData.length >= 2) {
      const lastMonth = monthData[monthData.length - 1].expense
      const previousMonth = monthData[monthData.length - 2].expense

      if (previousMonth > 0) {
        const change = ((lastMonth - previousMonth) / previousMonth) * 100
        const sign = change >= 0 ? '+' : ''
        percentageChange = `${sign}${change.toFixed(1)}%`
      }
    }

    // Average spending across all months
    const totalExpense = monthData.reduce(
      (sum, month) => currency(sum).add(month.expense).value,
      0
    )
    const averageSpending = monthData.length > 0
      ? currency(totalExpense).divide(monthData.length).value
      : 0

    return { percentageChange, averageSpending }
  }, [monthData])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-[300px] items-center justify-center text-gray-500">
        <p>Loading chart...</p>
      </div>
    )
  }

  // Empty state
  if (monthData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-gray-500">
        <p>No data yet. Add expenses to see trends!</p>
      </div>
    )
  }

  // Format month for display (MMM YYYY)
  const formatMonthLabel = (monthStr: string) => {
    try {
      // monthStr is in YYYY-MM format
      const [year, month] = monthStr.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1, 1)
      return format(date, 'MMM yyyy')
    } catch {
      return monthStr
    }
  }

  // Format chart data with proper labels
  const chartData = monthData.map((item) => ({
    month: formatMonthLabel(item.month),
    Income: item.income,
    Expense: item.expense,
  }))

  return (
    <div className="space-y-4">
      {/* Controls and Metrics Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="time-range" className="text-sm font-medium text-gray-700">
            Time Range:
          </label>
          <select
            id="time-range"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '3' | '6' | '12')}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="3">3 months</option>
            <option value="6">6 months</option>
            <option value="12">12 months</option>
          </select>
        </div>

        {/* Metrics */}
        <div className="flex flex-col gap-2 sm:items-end">
          {metrics.percentageChange !== null && (
            <div className="text-sm">
              <span className="text-gray-600">vs Previous Month: </span>
              <span
                className={`font-semibold ${
                  metrics.percentageChange.startsWith('+')
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}
              >
                {metrics.percentageChange}
              </span>
            </div>
          )}
          <div className="text-sm">
            <span className="text-gray-600">Average Spending: </span>
            <span className="font-semibold">{formatIDR(metrics.averageSpending)}</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            tickFormatter={(value) => {
              // Simplified format for Y-axis (e.g., 1M for 1,000,000)
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
              if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
              return value.toString()
            }}
          />
          <Tooltip
            formatter={(value) => (typeof value === 'number' ? formatIDR(value) : value)}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '8px 12px',
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="Income"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill: '#22c55e', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Expense"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
