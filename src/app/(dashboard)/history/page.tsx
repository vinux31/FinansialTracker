'use client'

import { useState, useEffect } from 'react'
import { Transaction } from '@/types'
import { getTransactions } from '@/lib/db'
import { formatIDR } from '@/lib/money'
import { formatDisplayDateTime } from '@/lib/date'
import { exportTransactionsCSV } from '@/lib/export'
import { IncomeForm } from '@/components/income-form'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const data = await getTransactions()
        // Sort by timestamp descending (newest first)
        const sorted = data.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        setTransactions(sorted)
      } catch (err) {
        console.error('Failed to load transactions:', err)
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
    exportTransactionsCSV()
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

      {/* Transaction List */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">All Transactions</h2>
        {isLoading ? (
          <Card className="p-8 text-center text-gray-500">
            <p>Loading transactions...</p>
          </Card>
        ) : transactions.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <p>No transactions yet. Start by adding an expense!</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
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
