'use client'

import { useState, useEffect } from 'react'
import type { Transaction, Goal, ProgressEntry } from '@/types'
import { getTransactions, getInvestments, getGoals, getGoalProgress } from '@/lib/db'
import { DatabaseInvestment } from '@/lib/supabase/schema'
import { formatIDR } from '@/lib/money'
import { formatDisplayDateTime } from '@/lib/date'
import { exportFinancialData } from '@/lib/export'
import { IncomeForm } from '@/components/income-form'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [investments, setInvestments] = useState<DatabaseInvestment[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [txs, invs, goalsData] = await Promise.all([
          getTransactions(),
          getInvestments(),
          getGoals()
        ])
        // Sort by timestamp descending (newest first)
        const sorted = txs.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        setTransactions(sorted)
        setInvestments(invs)
        setGoals(goalsData)

        // Load progress for all goals
        const allProgress: ProgressEntry[] = []
        for (const goal of goalsData) {
          const progress = await getGoalProgress(goal.id)
          allProgress.push(...progress)
        }
        setProgressEntries(allProgress)
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [refreshKey])

  const handleIncomeAdded = () => {
    // Refresh transaction list
    setRefreshKey(prev => prev + 1)
  }

  const handleExport = () => {
    exportFinancialData(transactions, investments, goals, progressEntries)
  }

  const filteredTransactions = transactions.filter((tx) => {
    if (dateFrom && tx.date < dateFrom) return false
    if (dateTo && tx.date > dateTo) return false
    return true
  })

  const handleClearFilter = () => {
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Transaction History</h1>
        <Button onClick={handleExport} variant="outline">
          Export CSV
        </Button>
      </div>

      {/* Income Form */}
      <div>
        <h2 className="mb-2 text-lg font-semibold text-green-700">Add Income</h2>
        <IncomeForm onIncomeAdded={handleIncomeAdded} />
      </div>

      {/* Date Filter */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          />
        </div>
        {(dateFrom || dateTo) && (
          <Button variant="outline" size="sm" onClick={handleClearFilter}>
            Clear
          </Button>
        )}
        <span className="ml-auto text-sm text-gray-500">
          {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Transaction List */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">All Transactions</h2>
        {isLoading ? (
          <Card className="p-8 text-center text-gray-500">
            <p>Loading transactions...</p>
          </Card>
        ) : filteredTransactions.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <p>{transactions.length === 0 ? 'No transactions yet. Start by adding an expense!' : 'No transactions match the selected date range.'}</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((tx) => (
              <Card
                key={tx.id}
                className={`p-4 ${
                  tx.type === 'income'
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          tx.type === 'income'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {tx.type === 'income' ? 'Income' : 'Expense'}
                      </span>
                      <span className="font-medium">{tx.category}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {formatDisplayDateTime(tx.timestamp)}
                    </div>
                    {tx.notes && (
                      <div className="mt-2 text-sm text-gray-700">{tx.notes}</div>
                    )}
                  </div>
                  <div
                    className={`text-right text-lg font-semibold ${
                      tx.type === 'income' ? 'text-green-600' : 'text-gray-900'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatIDR(tx.amount)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
