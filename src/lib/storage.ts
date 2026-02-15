// Legacy localStorage functions - kept for migration and export compatibility
// New code should use @/lib/db instead

import { Transaction } from '@/types'

const STORAGE_KEY = 'finance-tracker-transactions'

// SSR guard: returns empty on server
function isClient(): boolean {
  return typeof window !== 'undefined'
}

// LEGACY: Read localStorage transactions (used only for migration)
export function getTransactions(): Transaction[] {
  if (!isClient()) return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

// All other functions removed - use @/lib/db instead
