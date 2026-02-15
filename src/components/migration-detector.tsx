'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const STORAGE_KEY = 'finance-tracker-transactions'

export default function MigrationDetector({ userId }: { userId: string }) {
  const router = useRouter()

  useEffect(() => {
    async function checkMigration() {
      // Check localStorage
      const localData = localStorage.getItem(STORAGE_KEY)
      if (!localData) return

      const localTxs = JSON.parse(localData)
      if (localTxs.length === 0) return

      // Check if user has data in Supabase
      const supabase = createClient()
      const { count } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })

      // If no Supabase data but has localStorage data, redirect to migration
      if (count === 0) {
        router.push('/migrate')
      }
    }

    checkMigration()
  }, [userId, router])

  return null // No UI, just a detector
}
