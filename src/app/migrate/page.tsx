'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getTransactions as getLocalTransactions } from '@/lib/storage'
import { migrateTransactions } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const STORAGE_KEY = 'finance-tracker-transactions'

export default function MigratePage() {
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'ready' | 'migrating' | 'success' | 'error'>('checking')
  const [localCount, setLocalCount] = useState(0)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    checkMigrationStatus()
  }, [])

  async function checkMigrationStatus() {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check for localStorage data
      const localTxs = getLocalTransactions()
      setLocalCount(localTxs.length)

      if (localTxs.length === 0) {
        // No data to migrate, redirect to dashboard
        router.push('/')
        return
      }

      // Check if already migrated to Supabase
      const { count } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })

      if (count && count > 0) {
        // User already has data in Supabase, don't auto-migrate
        setStatus('ready')
      } else {
        // Ready to migrate
        setStatus('ready')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check migration status')
      setStatus('error')
    }
  }

  async function handleMigrate() {
    setStatus('migrating')
    setError('')

    try {
      // Get all localStorage transactions
      const localTxs = getLocalTransactions()

      // Use dedicated migration helper from db.ts
      const finalCount = await migrateTransactions(localTxs)

      // Verify count matches
      if (finalCount !== localTxs.length) {
        throw new Error(`Verification failed: Expected ${localTxs.length} transactions, found ${finalCount}`)
      }

      // Clear localStorage ONLY after verification succeeds
      localStorage.removeItem(STORAGE_KEY)

      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration failed')
      setStatus('error')
    }
  }

  if (status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center">Checking migration status...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'migrating') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center">Migrating {localCount} transactions...</p>
            <p className="mt-2 text-center text-sm text-gray-600">Please wait, do not close this page</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Migration Complete</CardTitle>
            <CardDescription>
              Successfully migrated {localCount} transactions to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Migration Failed</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleMigrate} className="w-full">
              Retry Migration
            </Button>
            <Button onClick={() => router.push('/')} variant="outline" className="w-full">
              Skip for Now
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // status === 'ready'
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Migrate Your Data</CardTitle>
          <CardDescription>
            You have {localCount} transactions stored locally. Migrate them to your account for access from any device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
            <p className="font-semibold mb-2">What happens during migration:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>All transactions copied to secure cloud database</li>
              <li>Data verified to ensure nothing is lost</li>
              <li>Local storage cleared only after verification</li>
              <li>You can access data from any device after migration</li>
            </ul>
          </div>
          <Button onClick={handleMigrate} className="w-full">
            Migrate {localCount} Transactions
          </Button>
          <Button onClick={() => router.push('/')} variant="outline" className="w-full">
            Skip for Now
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
