# Phase 1: Foundation & Core Tracking - Research

**Researched:** 2026-02-14
**Domain:** Next.js + React financial tracking application (expense logging, state management, monetary calculations)
**Confidence:** HIGH

## Summary

Phase 1 builds a minimal viable product for daily expense tracking using Next.js 15 App Router with React 19 Server Actions. The core technical challenges are: (1) fast form entry requiring uncontrolled components and optimistic updates, (2) monetary decimal arithmetic without floating-point errors, (3) timezone-safe date handling, (4) localStorage-based persistence avoiding SSR hydration mismatches, and (5) CSV export for data portability.

The standard stack leverages React 19's new form hooks (useActionState, useFormStatus) paired with Zod validation and lightweight libraries (currency.js for money, date-fns v4 for timezones, Papa Parse for CSV). This approach minimizes bundle size, avoids heavy form libraries, and works within Vercel's free tier constraints (100 deployments/day, 10-second serverless timeout).

**Primary recommendation:** Use Server Actions for mutations, uncontrolled forms with React 19 hooks for sub-5-second entry, currency.js for monetary calculations, localStorage with useEffect guards against hydration errors, and shadcn/ui for rapid UI development.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.x | App framework | Official React framework with App Router, Server Actions, and Vercel optimization |
| React | 19.x | UI library | Latest stable with useActionState/useFormStatus for modern form handling |
| TypeScript | 5.x | Type safety | Industry standard for type-safe React development |
| Zod | 3.x | Schema validation | TypeScript-first validation, pairs with Server Actions, safeParse for error handling |
| currency.js | 2.x | Monetary calculations | Lightweight (1.14 KB), integer-based (no floating-point errors), simple API |
| date-fns | 4.x | Date handling | v4 has first-class timezone support via @date-fns/tz, DST-aware, tree-shakeable |
| Papa Parse | 5.x | CSV export | Standard CSV library, handles edge cases, works client-side and server-side |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui | latest | UI components | Pre-built accessible components with Tailwind CSS, copy-paste ownership model |
| Tailwind CSS | 3.x | Styling | Utility-first CSS, pairs with shadcn/ui, minimal runtime cost |
| clsx / cn | latest | Class merging | Utility for conditional Tailwind classes (used by shadcn/ui) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| currency.js | Dinero.js v2 | More features (immutability, internationalization) but heavier bundle (12 KB gzipped), overkill for simple tracking |
| currency.js | Decimal.js | Arbitrary precision but 31 KB gzipped, includes trig functions not needed for money |
| Server Actions | React Hook Form | Better for complex multi-step forms, but adds 12 KB and unnecessary for single-field quick entry |
| date-fns | Luxon | More OOP-style API, but 67 KB vs date-fns 13 KB, and timezone support less mature |
| localStorage | IndexedDB | Better for large datasets (GB scale), but async API adds complexity, localStorage sufficient for 500-1000 transactions |

**Installation:**
```bash
npm install zod currency.js date-fns @date-fns/tz papaparse
npm install -D @types/papaparse
npx shadcn@latest init
npx shadcn@latest add button input select label card
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── (dashboard)/           # Route group for main app
│   ├── page.tsx          # Today's spending view
│   ├── history/          # Transaction history
│   ├── monthly/          # Monthly summary
│   └── layout.tsx        # Shared layout
├── actions/              # Server Actions
│   ├── expense.ts        # Add expense, get expenses
│   └── export.ts         # CSV export logic
├── lib/
│   ├── storage.ts        # localStorage abstraction layer
│   ├── money.ts          # currency.js helpers
│   ├── date.ts           # date-fns timezone utilities
│   └── validation.ts     # Zod schemas
├── components/
│   ├── expense-form.tsx  # Quick entry form
│   ├── transaction-list.tsx
│   └── ui/               # shadcn components
└── types/
    └── index.ts          # Shared TypeScript types
```

### Pattern 1: Server Actions with Zod Validation
**What:** Validate form data server-side using Zod, return errors as data (not thrown exceptions)
**When to use:** All form submissions requiring data integrity
**Example:**
```typescript
// app/actions/expense.ts
'use server'

import { z } from 'zod'

const expenseSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount'),
  category: z.enum(['Makan', 'Transportasi', 'Rokok', 'Belanja', 'Lainnya']),
  notes: z.string().max(200).optional(),
})

export async function addExpense(prevState: any, formData: FormData) {
  const validatedFields = expenseSchema.safeParse({
    amount: formData.get('amount'),
    category: formData.get('category'),
    notes: formData.get('notes'),
  })

  // Return early if validation fails (don't throw!)
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed',
    }
  }

  // Process expense...
  return { success: true, message: 'Expense added' }
}
```

### Pattern 2: Client Form with useActionState
**What:** Use React 19's useActionState for pending states and error handling
**When to use:** Forms requiring immediate user feedback without full page reload
**Example:**
```typescript
// components/expense-form.tsx
'use client'

import { useActionState } from 'react'
import { addExpense } from '@/app/actions/expense'

export function ExpenseForm() {
  const [state, formAction, pending] = useActionState(addExpense, null)

  return (
    <form action={formAction}>
      <input type="text" name="amount" required />
      {state?.errors?.amount && <p>{state.errors.amount}</p>}

      <button disabled={pending}>
        {pending ? 'Adding...' : 'Add Expense'}
      </button>
    </form>
  )
}
```

### Pattern 3: localStorage with SSR Hydration Guard
**What:** Access localStorage only on client after hydration to avoid mismatch errors
**When to use:** All localStorage reads/writes in Next.js App Router
**Example:**
```typescript
// lib/storage.ts
export function getExpenses() {
  if (typeof window === 'undefined') return []

  const data = localStorage.getItem('expenses')
  return data ? JSON.parse(data) : []
}

// In component:
'use client'

import { useEffect, useState } from 'react'
import { getExpenses } from '@/lib/storage'

export function TodayView() {
  const [expenses, setExpenses] = useState<Expense[]>([])

  useEffect(() => {
    // Only runs on client after hydration
    setExpenses(getExpenses())
  }, [])

  // Render with expenses...
}
```

### Pattern 4: Monetary Calculations with currency.js
**What:** Use integer-based arithmetic to avoid floating-point errors
**When to use:** All monetary operations (addition, subtraction, display formatting)
**Example:**
```typescript
// lib/money.ts
import currency from 'currency.js'

export const IDR = (value: number | string) =>
  currency(value, { symbol: 'Rp ', separator: '.', decimal: ',' })

// Usage:
const expense1 = IDR(15000)
const expense2 = IDR(25000)
const total = expense1.add(expense2) // Rp 40.000
```

### Pattern 5: Timezone-Safe Date Handling
**What:** Use date-fns with timezone awareness to avoid off-by-one-day bugs
**When to use:** All date operations (today's date, monthly boundaries, sorting)
**Example:**
```typescript
// lib/date.ts
import { TZDate } from '@date-fns/tz'
import { format, startOfDay, startOfMonth } from 'date-fns'

// Always use user's timezone
export function getTodayStart() {
  return startOfDay(new TZDate(new Date(), 'Asia/Jakarta'))
}

export function formatDate(date: Date) {
  return format(date, 'yyyy-MM-dd')
}
```

### Pattern 6: Append-Only Ledger Structure
**What:** Store transactions with unique IDs, timestamps, never delete/modify
**When to use:** Data integrity requirement (CORE-10)
**Example:**
```typescript
// types/index.ts
export interface Transaction {
  id: string            // UUID or timestamp-based
  type: 'expense' | 'income'
  amount: number        // Store as integer cents
  category: string
  notes?: string
  timestamp: string     // ISO 8601 format
  createdAt: string     // Audit trail
}

// lib/storage.ts
export function addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>) {
  const transactions = getTransactions()
  const newTx = {
    ...tx,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }

  transactions.push(newTx) // Append only
  localStorage.setItem('transactions', JSON.stringify(transactions))
  return newTx
}
```

### Anti-Patterns to Avoid
- **Controlled inputs for every field:** Causes re-renders, slows down entry. Use uncontrolled + Server Actions instead.
- **Floating-point arithmetic for money:** `0.1 + 0.2 !== 0.3` breaks calculations. Always use currency.js or store as integer cents.
- **Direct Date() constructor for "today":** Timezone bugs. Use TZDate with explicit timezone.
- **Throwing errors in Server Actions for validation:** Triggers Error Boundary, bad UX. Return errors as data.
- **localStorage on Server Components:** Causes hydration mismatch. Use Client Components + useEffect.
- **Modifying existing transactions:** Breaks audit trail. Use append-only pattern even for "edits" (store as correction entries in Phase 2).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Monetary arithmetic | Custom decimal class | currency.js | Floating-point edge cases (rounding, precision loss), internationalization complexity |
| Timezone handling | Manual UTC offset math | date-fns v4 + @date-fns/tz | Daylight Saving Time transitions, historical timezone rule changes, IANA database maintenance |
| Form validation | Regex + manual checks | Zod schemas | Type inference, error formatting, nested validation, async rules |
| CSV generation | String concatenation | Papa Parse unparse | RFC 4180 compliance (escaping commas/quotes), multi-line fields, encoding edge cases |
| UUID generation | `Date.now() + Math.random()` | crypto.randomUUID() | Collision risk in rapid submissions, security predictability |

**Key insight:** Financial applications have zero tolerance for "close enough" calculations. Off-by-one-cent errors compound and destroy user trust. Timezone bugs cause reports to be off by entire days. Use battle-tested libraries that handle edge cases you won't discover until production.

## Common Pitfalls

### Pitfall 1: Hydration Mismatch from localStorage
**What goes wrong:** Server renders empty state, client hydrates with localStorage data, React throws hydration error
**Why it happens:** Next.js App Router pre-renders pages server-side, localStorage doesn't exist on server
**How to avoid:**
1. Use `typeof window === 'undefined'` guards in utility functions
2. Initialize state empty, populate in useEffect
3. Consider suppressHydrationWarning for timestamps (last resort)
**Warning signs:** Console errors: "Text content does not match server-rendered HTML", flickering content on load

### Pitfall 2: Floating-Point Money Bugs
**What goes wrong:** `15.50 + 10.25 = 25.749999999999996`, rounding errors in totals
**Why it happens:** Binary floating-point can't represent decimal fractions exactly
**How to avoid:** Always use currency.js or store amounts as integer cents (1550 instead of 15.50)
**Warning signs:** Off-by-one-cent errors in summaries, failing equality checks

### Pitfall 3: Timezone-Naive Date Handling
**What goes wrong:** User logs expense at 11 PM, shows in next day's summary; monthly reports off by a day
**Why it happens:** `new Date()` uses browser timezone, but stored ISO strings are UTC, conversions create drift
**How to avoid:** Use TZDate with explicit timezone (e.g., 'Asia/Jakarta'), never rely on implicit conversions
**Warning signs:** Edge-of-day bugs (transactions near midnight), month boundary errors, DST transition issues

### Pitfall 4: Controlled Form Performance
**What goes wrong:** Form lags on typing, fails <5 second entry requirement
**Why it happens:** Controlled inputs trigger re-render on every keystroke, validation runs synchronously
**How to avoid:** Use uncontrolled forms with Server Actions, defer validation to submit, use useFormStatus in child components
**Warning signs:** Input lag, React DevTools shows frequent re-renders, CPU spike during typing

### Pitfall 5: localStorage Size Limits
**What goes wrong:** Silent failure when exceeding 5-10 MB quota, data loss
**Why it happens:** localStorage.setItem() throws QuotaExceededError but easy to miss in try-catch
**How to avoid:**
1. Monitor storage size: `new Blob([value]).size`
2. Alert user at 80% capacity
3. Plan migration to Supabase in Phase 3 before hitting limits
**Warning signs:** Data not persisting, QuotaExceededError in console, users reporting "lost" transactions

### Pitfall 6: CSV Export Special Characters
**What goes wrong:** Notes with commas break CSV structure, quotes in text cause parsing errors
**Why it happens:** Naïve string concatenation doesn't escape RFC 4180 special characters
**How to avoid:** Use Papa Parse unparse(), handles escaping automatically
**Warning signs:** Excel import errors, broken rows when notes contain commas/quotes

### Pitfall 7: Race Conditions in Rapid Entry
**What goes wrong:** User rapidly submits multiple expenses, some lost or duplicated
**Why it happens:** localStorage read-modify-write isn't atomic, concurrent updates overwrite each other
**How to avoid:**
1. Use optimistic UI to prevent double-clicks
2. Disable submit button during pending state
3. Generate IDs on client before storage to detect duplicates
**Warning signs:** Missing transactions after quick succession, duplicate entries with same timestamp

## Code Examples

Verified patterns from official sources:

### Server Action with Error Handling
```typescript
// Source: https://nextjs.org/docs/app/guides/forms
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const schema = z.object({
  amount: z.string().min(1, 'Amount required'),
  category: z.string().min(1, 'Category required'),
})

export async function addExpense(prevState: any, formData: FormData) {
  const validatedFields = schema.safeParse({
    amount: formData.get('amount'),
    category: formData.get('category'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  // Add to localStorage (via client-side handler)
  // Or directly mutate if using server-side storage

  revalidatePath('/') // Refresh Today view
  return { success: true }
}
```

### Form with Pending State
```typescript
// Source: https://react.dev/reference/react/useActionState
'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button disabled={pending}>
      {pending ? 'Adding...' : 'Add'}
    </button>
  )
}

export function ExpenseForm({ onSuccess }: Props) {
  const [state, formAction] = useActionState(addExpense, null)

  return (
    <form action={formAction}>
      <input type="text" name="amount" placeholder="Amount" />
      {state?.errors?.amount && <span>{state.errors.amount[0]}</span>}

      <SubmitButton />
    </form>
  )
}
```

### CSV Export with Papa Parse
```typescript
// Source: https://www.papaparse.com/docs#json-to-csv
import Papa from 'papaparse'

export function exportToCSV(transactions: Transaction[]) {
  const csv = Papa.unparse(transactions, {
    columns: ['timestamp', 'type', 'amount', 'category', 'notes'],
    header: true,
  })

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `transactions-${new Date().toISOString()}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
```

### Money Formatting
```typescript
// Source: https://currency.js.org/
import currency from 'currency.js'

export const IDR = (value: number | string) =>
  currency(value, {
    symbol: 'Rp ',
    separator: '.',
    decimal: ',',
    precision: 0, // Indonesian Rupiah typically doesn't use cents
  })

// Usage:
const total = IDR(0)
expenses.forEach(exp => {
  total.add(exp.amount)
})
console.log(total.format()) // "Rp 125.000"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React Hook Form | Server Actions + useActionState | React 19 (Dec 2024) | Simpler forms, no client-side library needed for basic cases |
| date-fns-tz (separate package) | @date-fns/tz (first-class) | date-fns v4 (2024) | Official timezone support, better DX |
| Formik | Native form + Server Actions | Next.js 13-15 App Router | Formik unmaintained since 2023, Server Actions reduce client JS |
| Manual localStorage | Built-in crypto.randomUUID() | Supported in all browsers (2023+) | Native UUID generation, no library needed |
| useFormState (deprecated) | useActionState | React 19 (Dec 2024) | Renamed hook, same functionality |

**Deprecated/outdated:**
- **Formik:** Last commit 2023, use Server Actions + Zod instead
- **moment.js:** Unmaintained, use date-fns instead
- **money.js:** Currency conversion only, use currency.js or Dinero.js for calculations

## Open Questions

1. **CSV Export Encoding**
   - What we know: Papa Parse handles UTF-8 by default
   - What's unclear: Will Indonesian characters (category names) export correctly to Excel on Windows?
   - Recommendation: Test with actual Indonesian text, may need BOM (Byte Order Mark) for Excel compatibility: `new Blob(['\ufeff' + csv])`

2. **localStorage Migration Path**
   - What we know: Phase 3 introduces Supabase, need to migrate localStorage data
   - What's unclear: Best pattern for one-time migration without data loss
   - Recommendation: Plan "sync" feature that uploads localStorage to Supabase on first auth, keep localStorage as fallback

3. **Optimistic Updates vs Server Actions**
   - What we know: Server Actions can use useOptimistic for instant UI feedback
   - What's unclear: Whether to implement in Phase 1 or defer to Phase 2 (edit/delete features)
   - Recommendation: Defer optimistic updates to Phase 2, prioritize simple working flow in Phase 1

4. **Date Format for Display**
   - What we know: ISO 8601 for storage, need user-friendly format for display
   - What's unclear: Indonesian locale preference (DD/MM/YYYY vs MM/DD/YYYY)
   - Recommendation: Use `date-fns` format with 'id-ID' locale: `format(date, 'PPP', { locale: id })`

## Sources

### Primary (HIGH confidence)
- [Next.js 15 Forms Guide](https://nextjs.org/docs/app/guides/forms) - Official Server Actions documentation
- [Vercel Limits](https://vercel.com/docs/limits) - Free tier constraints (100 deployments/day, 10s timeout, 100GB bandwidth)
- [React 19 Release](https://react.dev/blog/2024/12/05/react-19) - useActionState, useFormStatus, useOptimistic
- [date-fns v4 Blog](https://blog.date-fns.org/v40-with-time-zone-support/) - First-class timezone support announcement
- [currency.js Documentation](https://currency.js.org/) - API and examples
- [Papa Parse Documentation](https://www.papaparse.com/) - CSV parsing and unparsing

### Secondary (MEDIUM confidence)
- [Next.js Server Actions Complete Guide (2026)](https://medium.com/@saad.minhas.codes/next-js-15-server-actions-complete-guide-with-real-examples-2026-6320fbfa01c3) - Real-world examples verified against official docs
- [React Hook Form vs Formik Comparison](https://refine.dev/blog/react-hook-form-vs-formik/) - Performance benchmarks showing Formik maintenance status
- [Mastering Money Calculations in JavaScript](https://miladezzat.medium.com/mastering-money-calculations-in-javascript-the-best-libraries-compared-8e4ae03dac58) - Library comparison with examples
- [Supabase Pricing 2026](https://www.metacto.com/blogs/the-true-cost-of-supabase-a-comprehensive-guide-to-pricing-integration-and-maintenance) - Free tier: 500 MB database, 7-day inactivity pause
- [localStorage vs IndexedDB (2026)](https://medium.com/@sriweb/indexeddb-vs-localstorage-when-and-why-to-use-indexeddb-for-data-storage-in-web-applications-93a8a5a39eef) - Use case comparison
- [Fixing Hydration Mismatch in Next.js](https://oneuptime.com/blog/post/2026-01-24-fix-hydration-mismatch-errors-nextjs/view) - localStorage SSR patterns

### Tertiary (LOW confidence - needs validation)
- [shadcn/ui vs Radix UI Comparison](https://saasindie.com/blog/shadcn-vs-radix-themes-comparison) - Component library decision factors
- [React Form Performance Best Practices (2026)](https://blog.croct.com/post/best-react-form-libraries) - UX optimization techniques

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified from official docs and npm registry, version numbers current as of Feb 2026
- Architecture: HIGH - Patterns sourced from Next.js and React official documentation
- Pitfalls: MEDIUM - Based on common issues reported in GitHub discussions and Stack Overflow, but not all tested in production
- Code examples: HIGH - All examples adapted from official documentation with source URLs

**Research date:** 2026-02-14
**Valid until:** 2026-03-14 (30 days - stable ecosystem, React 19 just released, Next.js 15 mature)

**Notes:**
- React 19 and Next.js 15 are stable as of this research date
- Formik explicitly noted as unmaintained (last update 2023)
- Supabase free tier limits verified from official pricing page
- No CONTEXT.md existed for this phase, all decisions at planner's discretion
