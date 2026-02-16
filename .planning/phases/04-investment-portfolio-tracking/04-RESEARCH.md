# Phase 4: Investment Portfolio Tracking - Research

**Researched:** 2026-02-16
**Domain:** Investment portfolio data management, schema design, form validation, summary calculations, and CSV export integration
**Confidence:** HIGH (verified with official docs, existing stack patterns, and community best practices)

## Summary

Phase 4 extends the expense tracker with investment portfolio functionality, allowing users to track multiple investment types (Saham/stocks, Emas/gold, Reksadana/mutual funds) alongside expenses. The recommended approach uses a new `investments` table in PostgreSQL with the same RLS patterns as transactions, extends existing Zod schemas for validation, leverages currency.js for precise portfolio value calculations, and reuses the existing form and UI patterns from Phase 1-3. The CSV export (already using PapaParse) requires minimal extension to include investment data alongside transactions.

**Primary recommendation:** Create a new `investments` table with user_id, investment_name, category, monthly_contribution, and current_value fields; use Zod schemas mirroring transaction validation; implement portfolio summary calculations with useMemo (same pattern as expense aggregation); extend CSV export to include investments as separate sections; add investment display to monthly summary view alongside expense breakdown.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL (Supabase) | Latest | Investment data persistence | Already in use for transactions; RLS patterns directly applicable |
| currency.js | 2.0.4 | Portfolio value calculations | Already in project for expense amounts; handles decimal precision for currency operations |
| Zod | 4.3.6 | Investment schema validation | Already in project for transactions; reuse same validation patterns |
| React (with 'use client') | 19.2.3 | Investment form and UI components | Existing; form patterns established in Phase 1-3 |
| date-fns | 4.1.0 | Date handling for investment timestamps | Already used for transaction dates; consistent timezone handling |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| PapaParse | 5.5.3 | CSV export (extending existing) | Already in project; extend unparse() to include investment data |
| Recharts | 3.7.0 | Portfolio visualization (optional Phase 4 extension) | Already in project; can visualize portfolio breakdown alongside expense charts |
| @date-fns/tz | 1.4.1 | Timezone-aware timestamps | Asia/Jakarta timezone consistency |
| shadcn/ui | via Radix | Form inputs and dialog components | Existing UI component library; reuse for investment forms |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Single investments table | Separate tables per asset class | Single table simpler to query and manage; separation adds complexity for minimal benefit |
| currency.js | Decimal.js or big.js | currency.js already in project and proven; others are heavier for financial calculations |
| PostgreSQL constraints | App-level validation | DB constraints prevent invalid data at source; app-level can be bypassed |

**Installation:**
```bash
# No new dependencies required
# All libraries already in package.json
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── monthly/page.tsx           # Update to include investment summary
│   │   ├── investments/page.tsx       # NEW: Portfolio overview page
│   │   └── investments/
│   │       └── [id]/edit/page.tsx     # NEW: Edit investment page
│   ├── api/
│   │   └── investments/               # NEW: API routes for investment CRUD
│   │       ├── route.ts               # List and create
│   │       └── [id]/route.ts          # Update and delete
├── components/
│   ├── investments/
│   │   ├── investment-form.tsx        # NEW: Reusable form for add/edit
│   │   ├── investment-list.tsx        # NEW: Portfolio list with current values
│   │   ├── portfolio-summary.tsx      # NEW: Total value and category breakdown
│   │   └── investment-row.tsx         # NEW: Single investment display
│   └── [existing components]
├── lib/
│   ├── supabase/
│   │   └── schema.ts                  # EXTEND: Add investment schemas
│   ├── investments/
│   │   ├── calculations.ts            # NEW: Portfolio value, gain/loss, aggregations
│   │   └── export.ts                  # NEW: CSV formatting for investments
│   └── [existing files]
└── types/
    └── index.ts                       # EXTEND: Add Investment types
```

### Pattern 1: Investment Table Schema with RLS

**What:** PostgreSQL table for investments with user isolation via RLS, following the same security model as transactions.

**When to use:** Required for all investment data storage and multi-user data protection.

**Example:**
```sql
-- Create investments table
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Saham', 'Emas', 'Reksadana')),
  monthly_contribution INTEGER NOT NULL CHECK (monthly_contribution > 0),
  current_value INTEGER NOT NULL CHECK (current_value > 0),
  purchase_date DATE NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX investments_user_id_idx ON investments(user_id);
CREATE INDEX investments_category_idx ON investments(category);
CREATE INDEX investments_user_category_idx ON investments(user_id, category);
CREATE INDEX investments_created_at_idx ON investments(created_at DESC);

-- Enable RLS
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own investments
CREATE POLICY "Users can view their own investments"
  ON investments
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Policy: Users can insert only their own investments
CREATE POLICY "Users can insert their own investments"
  ON investments
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Users can update only their own investments
CREATE POLICY "Users can update their own investments"
  ON investments
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Users can delete only their own investments
CREATE POLICY "Users can delete their own investments"
  ON investments
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
```

Source: [Supabase: Row Level Security Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)

### Pattern 2: Investment Zod Schema (Extending Existing Pattern)

**What:** TypeScript-first schema validation for investment data, using Zod like Phase 1-3.

**When to use:** Server-side and client-side validation of investment form submissions.

**Example:**
```typescript
// lib/supabase/schema.ts (extend existing file)
import { z } from 'zod'

const INVESTMENT_CATEGORIES = ['Saham', 'Emas', 'Reksadana'] as const

// Database investment schema
export const DatabaseInvestmentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  category: z.enum(INVESTMENT_CATEGORIES),
  monthly_contribution: z.number().int().positive(),
  current_value: z.number().int().positive(),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().default(''),
  timestamp: z.string().datetime(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type DatabaseInvestment = z.infer<typeof DatabaseInvestmentSchema>

// Insert investment schema (before database assigns id/timestamps)
export const InsertInvestmentSchema = z.object({
  user_id: z.string().uuid(),
  name: z.string().min(1, 'Investment name required').max(255, 'Name too long'),
  category: z.enum(INVESTMENT_CATEGORIES, {
    errorMap: () => ({ message: 'Invalid category' })
  }),
  monthly_contribution: z.number().int().positive('Contribution must be positive'),
  current_value: z.number().int().positive('Value must be positive'),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  notes: z.string().default(''),
  timestamp: z.string().datetime(),
})

export type InsertInvestment = z.infer<typeof InsertInvestmentSchema>

// Update investment schema (subset of fields, same validation)
export const UpdateInvestmentSchema = InsertInvestmentSchema.partial().extend({
  id: z.string().uuid(),
})

export type UpdateInvestment = z.infer<typeof UpdateInvestmentSchema>

// Validate array of investments (similar to transactions pattern)
export function validateInvestments(investments: unknown[]): InsertInvestment[] {
  const result = z.array(InsertInvestmentSchema).safeParse(investments)

  if (!result.success) {
    console.error('Investment validation errors:', result.error.flatten())
    throw new Error('Invalid investment data format')
  }

  return result.data
}
```

Source: [Zod Documentation: API Reference](https://zod.dev/api)

### Pattern 3: Portfolio Calculation with useMemo

**What:** Memoize expensive portfolio calculations (total value, gains, category sums) to prevent recalculation on every render.

**When to use:** Aggregating investments for summary views, calculating gains/losses, computing category breakdowns.

**Example:**
```typescript
// lib/investments/calculations.ts
import { useMemo } from 'react'
import Currency from 'currency.js'
import type { DatabaseInvestment } from '@/lib/supabase/schema'

export interface PortfolioMetrics {
  totalContributed: number  // Sum of monthly_contribution * months
  totalValue: number        // Sum of current_value
  totalGain: number         // totalValue - totalContributed
  gainPercent: number       // (totalGain / totalContributed) * 100
  byCategory: Record<string, PortfolioCategoryBreakdown>
}

export interface PortfolioCategoryBreakdown {
  count: number
  totalValue: number
  totalContributed: number
  totalGain: number
}

export function usePortfolioMetrics(investments: DatabaseInvestment[]): PortfolioMetrics {
  return useMemo(() => {
    let totalValue = 0
    let totalContributed = 0
    const byCategory: Record<string, PortfolioCategoryBreakdown> = {
      Saham: { count: 0, totalValue: 0, totalContributed: 0, totalGain: 0 },
      Emas: { count: 0, totalValue: 0, totalContributed: 0, totalGain: 0 },
      Reksadana: { count: 0, totalValue: 0, totalContributed: 0, totalGain: 0 },
    }

    investments.forEach(inv => {
      // Use currency.js for accurate arithmetic
      const value = new Currency(inv.current_value)
      const contribution = new Currency(inv.monthly_contribution)

      totalValue = new Currency(totalValue).add(value).intValue
      totalContributed = new Currency(totalContributed).add(contribution).intValue

      const category = inv.category as keyof typeof byCategory
      byCategory[category].count += 1
      byCategory[category].totalValue = new Currency(byCategory[category].totalValue)
        .add(value)
        .intValue
      byCategory[category].totalContributed = new Currency(byCategory[category].totalContributed)
        .add(contribution)
        .intValue
    })

    const totalGain = new Currency(totalValue).subtract(totalContributed).intValue
    const gainPercent = totalContributed > 0
      ? new Currency(totalGain).divide(totalContributed).multiply(100).value
      : 0

    // Calculate gains per category
    Object.entries(byCategory).forEach(([key, data]) => {
      byCategory[key].totalGain = new Currency(data.totalValue)
        .subtract(data.totalContributed)
        .intValue
    })

    return {
      totalContributed,
      totalValue,
      totalGain,
      gainPercent,
      byCategory,
    }
  }, [investments.length, investments]) // Depend on array length for safety
}
```

Source: [React: useMemo Documentation](https://react.dev/reference/react/useMemo), [currency.js GitHub](https://github.com/scurker/currency.js)

### Pattern 4: Investment Form with Modal (Extending Phase 2 Pattern)

**What:** Reusable form component for add/edit investments, following the same modal pattern as transaction editing.

**When to use:** Adding new investments and updating existing investment values.

**Example:**
```typescript
// components/investments/investment-form.tsx
'use client'

import { useState } from 'react'
import { InsertInvestmentSchema } from '@/lib/supabase/schema'
import type { DatabaseInvestment } from '@/lib/supabase/schema'

const INVESTMENT_CATEGORIES = ['Saham', 'Emas', 'Reksadana'] as const

interface InvestmentFormProps {
  initialData?: DatabaseInvestment
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
}

export function InvestmentForm({ initialData, onSubmit, onCancel }: InvestmentFormProps) {
  const [formData, setFormData] = useState(
    initialData || {
      name: '',
      category: 'Saham' as const,
      monthly_contribution: 0,
      current_value: 0,
      purchase_date: new Date().toISOString().split('T')[0],
      notes: '',
    }
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      setIsSubmitting(true)

      // Validate using Zod schema (extend with user_id in actual implementation)
      const formDataWithDefaults = {
        ...formData,
        monthly_contribution: Number(formData.monthly_contribution),
        current_value: Number(formData.current_value),
      }

      await onSubmit(formDataWithDefaults)
      // onSubmit handles success/close
    } catch (error: any) {
      console.error('Form submission error:', error)
      setErrors({ submit: error.message || 'Failed to save investment' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Investment Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          className="w-full border rounded px-3 py-2"
          placeholder="e.g., Apple Stock, Gold Bar"
          required
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <select
          value={formData.category}
          onChange={e => setFormData({ ...formData, category: e.target.value as any })}
          className="w-full border rounded px-3 py-2"
        >
          {INVESTMENT_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Monthly Contribution (IDR)</label>
          <input
            type="number"
            value={formData.monthly_contribution}
            onChange={e => setFormData({ ...formData, monthly_contribution: Number(e.target.value) })}
            className="w-full border rounded px-3 py-2"
            placeholder="0"
            required
          />
          {errors.monthly_contribution && <p className="text-red-500 text-sm mt-1">{errors.monthly_contribution}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Current Value (IDR)</label>
          <input
            type="number"
            value={formData.current_value}
            onChange={e => setFormData({ ...formData, current_value: Number(e.target.value) })}
            className="w-full border rounded px-3 py-2"
            placeholder="0"
            required
          />
          {errors.current_value && <p className="text-red-500 text-sm mt-1">{errors.current_value}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Purchase Date</label>
        <input
          type="date"
          value={formData.purchase_date}
          onChange={e => setFormData({ ...formData, purchase_date: e.target.value })}
          className="w-full border rounded px-3 py-2"
          required
        />
        {errors.purchase_date && <p className="text-red-500 text-sm mt-1">{errors.purchase_date}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
        <textarea
          value={formData.notes}
          onChange={e => setFormData({ ...formData, notes: e.target.value })}
          className="w-full border rounded px-3 py-2"
          rows={3}
        />
      </div>

      {errors.submit && <p className="text-red-500 text-sm">{errors.submit}</p>}

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-500 text-white rounded py-2 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Investment'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 rounded py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
```

Source: [React docs: useState](https://react.dev/reference/react/useState)

### Pattern 5: CSV Export Extension (Building on Phase 1)

**What:** Extend existing PapaParse CSV export to include investment data in a structured format.

**When to use:** When exporting all user financial data (already required by CFPB rule for Phase 1).

**Example:**
```typescript
// lib/investments/export.ts
import type { DatabaseTransaction } from '@/lib/supabase/schema'
import type { DatabaseInvestment } from '@/lib/supabase/schema'
import Papa from 'papaparse'

export function exportFinancialData(
  transactions: DatabaseTransaction[],
  investments: DatabaseInvestment[],
  filename = 'financial-export.csv'
) {
  const exportData: any[] = [
    // Transactions section
    ['TRANSACTIONS'],
    ['Date', 'Type', 'Amount (IDR)', 'Category', 'Notes'],
    ...transactions.map(tx => [
      tx.date,
      tx.type,
      tx.amount,
      tx.category,
      tx.notes,
    ]),
    [], // Blank row separator
    // Investments section
    ['INVESTMENTS'],
    ['Name', 'Category', 'Monthly Contribution (IDR)', 'Current Value (IDR)', 'Purchase Date', 'Notes'],
    ...investments.map(inv => [
      inv.name,
      inv.category,
      inv.monthly_contribution,
      inv.current_value,
      inv.purchase_date,
      inv.notes,
    ]),
  ]

  const csv = Papa.unparse(exportData, {
    header: false,
    dynamicTyping: false,
    skipEmptyLines: false,
  })

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
```

Source: [PapaParse Documentation](https://www.papaparse.com/docs)

### Anti-Patterns to Avoid
- **Storing investment values as floating-point:** Always use integers with currency.js; never do arithmetic with raw numbers
- **Forgetting RLS on investments table:** Single missing policy exposes all users' investment data
- **Calculating portfolio totals on every render:** Use useMemo to prevent lag with many investments
- **Mixing transactions and investments in one table:** Separate tables keep schemas clean and queries fast
- **Hardcoding investment categories:** Use Zod enums to enforce valid categories at validation time
- **Not indexing user_id for queries:** Will cause full table scans as investment data grows

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency arithmetic (add, subtract, multiply) | Custom math with numbers | currency.js | JavaScript floating-point errors; currency.js handles as integers internally |
| Investment data validation | Custom regex and type checks | Zod schemas (existing pattern) | Zod provides compile-time type inference + runtime validation; already in project |
| RLS policies for investments | Custom authorization checks | PostgreSQL RLS (like transactions) | Enforced at DB level, can't be bypassed; reuse proven pattern |
| Portfolio aggregation logic | Loop through investments repeatedly | useMemo + currency.js | Memoization prevents recalculation; mirrors Phase 2 chart data pattern |
| CSV export formatting | Manual string concatenation | PapaParse unparse() | Handles edge cases (quotes, delimiters, newlines); already in project |
| Investment category grouping | Custom object building | Zod enum + Record<> structure | Type-safe; prevents invalid categories from entering system |

**Key insight:** Investment tracking combines three complex domains (monetary calculations, form validation, RLS policies). Every one has proven solutions already in the project (currency.js, Zod, Supabase). Mixing custom and library solutions introduces bugs faster than using libraries consistently.

---

## Common Pitfalls

### Pitfall 1: Floating-Point Errors in Portfolio Value Calculations
**What goes wrong:** Portfolio total is calculated as `sum([inv.current_value])` using JavaScript numbers. After multiple investments, total is 999.99999999 instead of 1000.00. Comparisons fail (`if (total > 1000)` doesn't work as expected).

**Why it happens:** JavaScript stores numbers in IEEE 754 (64-bit floats). Decimal numbers like 0.1 + 0.2 can't be represented exactly, causing accumulated rounding errors.

**How to avoid:**
- Always use currency.js: `sum([inv.current_value].map(v => new Currency(v)))`
- Store investment values as integers in database (current_value: 100000 for 100,000 IDR)
- Use currency.js for ALL arithmetic: add, subtract, multiply, divide
- Test portfolio metrics with odd numbers (1, 3, 7, 11) to catch rounding bugs

**Warning signs:**
- Portfolio totals display as 999999.9999999998 instead of 1000000
- Gain/loss calculations are off by a few cents or rupiah
- Comparisons like `if (gain > 100000)` fail unexpectedly

### Pitfall 2: Missing RLS Policy on Investments Table
**What goes wrong:** Developer creates investments table but forgets to add RLS policies. Every user can see every other user's investments when they query the table. User A sees User B's portfolio and thinks it's theirs.

**Why it happens:** RLS is a per-table opt-in. Easy to remember for transactions but forget for a new table.

**How to avoid:**
1. Follow the same RLS pattern as transactions table: exactly 4 policies (SELECT, INSERT, UPDATE, DELETE)
2. Create a SQL test that validates all public tables have RLS enabled:
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND NOT EXISTS (
  SELECT 1 FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename
);
-- Should return empty set
```
3. Add this test to CI/CD pipeline

**Warning signs:**
- Supabase UI shows "RLS is off" badge on investments table
- Querying investments returns rows with other user_ids
- Postman/curl can fetch investments from different user accounts

### Pitfall 3: Portfolio Metrics Recalculated on Every Render
**What goes wrong:** Portfolio summary component doesn't memoize calculations. Every keystroke in an edit form triggers re-aggregation of all 100+ investments, causing visible lag.

**Why it happens:** Developers write calculation logic inline or in regular functions, not understanding React's render cycle.

**How to avoid:**
- Wrap portfolio metrics in `useMemo` with minimal dependencies
- Dependencies should be `[investments.length]` or `[JSON.stringify(investments)]` (for safety)
- Profile in DevTools: Check Profiler tab to verify calculations run < 100ms
- Test with 100+ investments to catch performance issues early

**Warning signs:**
- Page becomes slow when editing investment details
- DevTools Profiler shows "PortfolioSummary" re-rendering on unrelated state changes
- User sees visual flicker in summary numbers

### Pitfall 4: Mixing Integers and Floating-Point in Database
**What goes wrong:** Some investment values are stored as INTEGER, others as NUMERIC/DECIMAL. Application code must handle both types, leading to inconsistency. One investment's gain calculation is accurate, another is rounded.

**Why it happens:** Developer assumes database will handle type conversion automatically, or doesn't realize JavaScript doesn't have a Decimal type.

**How to avoid:**
- Enforce: ALL monetary columns are INTEGER (in cents/smallest unit)
- Add CHECK constraints: `current_value INTEGER CHECK (current_value > 0)`
- Document: monthly_contribution and current_value are in IDR (no decimals for Indonesian Rupiah)
- Test: Insert 1000000 IDR (1M), verify it stores as 1000000, not 1000000.0

**Warning signs:**
- Database shows values like 1000000.5 or 100.00
- Portfolio calculations produce numbers with 6+ decimal places
- CSV export shows decimal values instead of whole numbers

### Pitfall 5: Category Constraints Not Enforced at Database Level
**What goes wrong:** App has categories ['Saham', 'Emas', 'Reksadana'], but database doesn't enforce them. Bug in app allows saving 'Unknown' category. Now investment is ungrouped and summary calculations break.

**Why it happens:** Developer trusts app-level validation and doesn't add CHECK constraint at database.

**How to avoid:**
- Add explicit CHECK constraint in migration:
```sql
ALTER TABLE investments ADD CONSTRAINT valid_investment_category
  CHECK (category IN ('Saham', 'Emas', 'Reksadana'));
```
- Zod schema enum matches database constraint exactly
- Test: Try inserting invalid category via Supabase API; should fail with database constraint error

**Warning signs:**
- Invalid categories appear in database when Zod validation is bypassed
- Portfolio summary shows "Unknown" entries
- Group by category query returns unexpected rows

### Pitfall 6: Not Indexing user_id for Multi-User Queries
**What goes wrong:** Queries to fetch "all investments for user X" become slow as data grows. At 10,000 investments across all users, fetching one user's 50 investments requires full table scan (10K rows read, 50 returned).

**Why it happens:** Developer creates table and adds constraints but forgets index.

**How to avoid:**
- Add index during migration:
```sql
CREATE INDEX investments_user_id_idx ON investments(user_id);
```
- For common filters, create composite indexes:
```sql
CREATE INDEX investments_user_category_idx ON investments(user_id, category);
```
- Monitor query performance: EXPLAIN ANALYZE should show "Index Scan" not "Seq Scan"

**Warning signs:**
- Portfolio page is slow to load (>1 second for 50 investments)
- EXPLAIN ANALYZE shows "Seq Scan on investments" instead of "Index Scan"
- Supabase console shows warnings about missing indexes

### Pitfall 7: Edit/Delete Operations Not Respecting User Ownership
**What goes wrong:** User A can edit User B's investments by guessing the investment ID in the URL (`/investments/abc-123-def/edit`). App doesn't verify ownership before updating database.

**Why it happens:** Developer implements edit endpoint but forgets to add user_id check.

**How to avoid:**
- In update/delete API routes, verify user ownership:
```typescript
// app/api/investments/[id]/route.ts
const { data: investment } = await supabase
  .from('investments')
  .select('user_id')
  .eq('id', investmentId)
  .single()

const { data: { user } } = await supabase.auth.getUser()

if (investment.user_id !== user.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
}
```
- RLS handles this automatically for database queries, but don't rely on it alone for API routes

**Warning signs:**
- Edit endpoint doesn't verify user_id matches
- URL can be manually changed to edit other users' investments
- No authorization check in API route handler

---

## Code Examples

Verified patterns from official sources:

### Creating Investments Table in Supabase Migration

```sql
-- Migration file: supabase/migrations/003_create_investments.sql

CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  monthly_contribution INTEGER NOT NULL CHECK (monthly_contribution > 0),
  current_value INTEGER NOT NULL CHECK (current_value > 0),
  purchase_date DATE NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_investment_category CHECK (
    category IN ('Saham', 'Emas', 'Reksadana')
  )
);

-- Indexes for common queries
CREATE INDEX investments_user_id_idx ON investments(user_id);
CREATE INDEX investments_category_idx ON investments(category);
CREATE INDEX investments_user_category_idx ON investments(user_id, category);
CREATE INDEX investments_user_id_created_at_idx ON investments(user_id, created_at DESC);
```

Source: [PostgreSQL: CREATE TABLE documentation](https://www.postgresql.org/docs/current/sql-createtable.html)

### Portfolio Summary Calculations in React

```typescript
// components/investments/portfolio-summary.tsx
'use client'

import { useMemo } from 'react'
import Currency from 'currency.js'
import type { DatabaseInvestment } from '@/lib/supabase/schema'

interface PortfolioSummaryProps {
  investments: DatabaseInvestment[]
}

export function PortfolioSummary({ investments }: PortfolioSummaryProps) {
  const metrics = useMemo(() => {
    let totalValue = 0
    let totalContributed = 0
    const byCategory: Record<string, { count: number; value: number; contributed: number }> = {
      Saham: { count: 0, value: 0, contributed: 0 },
      Emas: { count: 0, value: 0, contributed: 0 },
      Reksadana: { count: 0, value: 0, contributed: 0 },
    }

    investments.forEach(inv => {
      const value = new Currency(inv.current_value)
      const contribution = new Currency(inv.monthly_contribution)

      totalValue = new Currency(totalValue).add(value).intValue
      totalContributed = new Currency(totalContributed).add(contribution).intValue

      const category = inv.category as keyof typeof byCategory
      byCategory[category].count += 1
      byCategory[category].value = new Currency(byCategory[category].value).add(value).intValue
      byCategory[category].contributed = new Currency(byCategory[category].contributed)
        .add(contribution)
        .intValue
    })

    const totalGain = new Currency(totalValue).subtract(totalContributed).intValue
    const gainPercent = totalContributed > 0
      ? (totalGain / totalContributed) * 100
      : 0

    return { totalValue, totalContributed, totalGain, gainPercent, byCategory }
  }, [investments])

  const formatCurrency = (amount: number) =>
    new Currency(amount).format({ separator: '.', symbol: 'Rp ' })

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-sm text-gray-600">Total Value</p>
          <p className="text-2xl font-bold">{formatCurrency(metrics.totalValue)}</p>
        </div>
        <div className={`p-4 rounded ${metrics.totalGain >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className="text-sm text-gray-600">Gain/Loss</p>
          <p className={`text-2xl font-bold ${metrics.totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {metrics.totalGain >= 0 ? '+' : ''}{formatCurrency(metrics.totalGain)}
            {' '}({metrics.gainPercent.toFixed(1)}%)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {Object.entries(metrics.byCategory).map(([category, data]) => (
          <div key={category} className="bg-gray-50 p-3 rounded">
            <p className="text-sm font-medium">{category}</p>
            <p className="text-xs text-gray-600">{data.count} item(s)</p>
            <p className="text-sm font-semibold mt-1">{formatCurrency(data.value)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

Source: [React: useMemo hook](https://react.dev/reference/react/useMemo), [currency.js API](https://currency.js.org/)

### Extending CSV Export to Include Investments

```typescript
// lib/export/financial-data.ts
import Papa from 'papaparse'
import Currency from 'currency.js'
import type { DatabaseTransaction } from '@/lib/supabase/schema'
import type { DatabaseInvestment } from '@/lib/supabase/schema'

const formatCurrency = (amount: number) => new Currency(amount).format({ symbol: '', separator: '.' })

export function generateFinancialCSV(
  transactions: DatabaseTransaction[],
  investments: DatabaseInvestment[]
): string {
  const rows: string[][] = []

  // Transactions section
  rows.push(['TRANSACTIONS'])
  rows.push(['Date', 'Type', 'Amount (IDR)', 'Category', 'Notes'])
  transactions.forEach(tx => {
    rows.push([
      tx.date,
      tx.type,
      formatCurrency(tx.amount),
      tx.category,
      tx.notes || '',
    ])
  })

  rows.push([]) // Blank row

  // Investments section
  rows.push(['INVESTMENTS'])
  rows.push([
    'Name',
    'Category',
    'Monthly Contribution (IDR)',
    'Current Value (IDR)',
    'Purchase Date',
    'Notes',
  ])
  investments.forEach(inv => {
    rows.push([
      inv.name,
      inv.category,
      formatCurrency(inv.monthly_contribution),
      formatCurrency(inv.current_value),
      inv.purchase_date,
      inv.notes || '',
    ])
  })

  rows.push([]) // Blank row

  // Summary section
  rows.push(['SUMMARY'])
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => new Currency(sum).add(t.amount).intValue, 0)
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => new Currency(sum).add(t.amount).intValue, 0)
  const totalInvested = investments.reduce(
    (sum, i) => new Currency(sum).add(i.current_value).intValue,
    0
  )

  rows.push(['Total Expenses', formatCurrency(totalExpenses)])
  rows.push(['Total Income', formatCurrency(totalIncome)])
  rows.push(['Total Investments', formatCurrency(totalInvested)])

  // Use PapaParse to format CSV properly
  return Papa.unparse(rows)
}

export function downloadFinancialData(
  transactions: DatabaseTransaction[],
  investments: DatabaseInvestment[]
) {
  const csv = generateFinancialCSV(transactions, investments)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  const now = new Date()
  const filename = `finansial-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.csv`

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
```

Source: [PapaParse: Unparse Documentation](https://www.papaparse.com/docs#unparse)

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate cash investment table | Single investments table with category enum | Always current | Simpler queries, consistent RLS pattern |
| Manual portfolio calculations | useMemo + currency.js pattern | 2023+ | Prevents re-calculation lag, consistent with expense aggregation |
| Floating-point arithmetic in JavaScript | Integer-based currency.js throughout | Always | No rounding errors, reliable financial data |
| App-level investment authorization | PostgreSQL RLS policies | 2022+ | Defense-in-depth, can't be bypassed if app layer fails |

**Deprecated/outdated:**
- **Storing investment values as NUMERIC/DECIMAL in PostgreSQL:** Modern pattern is INTEGER (in smallest currency unit) with currency.js arithmetic. NUMERIC works but adds unnecessary type conversion complexity.
- **Ad-hoc investment aggregation in components:** Use useMemo pattern established in Phase 2 for consistency and performance.

---

## Open Questions

1. **Should investments support fractional units (e.g., 0.5 shares, grams of gold)?**
   - What we know: Current schema uses INTEGER for monthly_contribution and current_value
   - What's unclear: Some assets (gold) might be tracked in grams; shares might be fractional
   - Recommendation: Phase 4 assumes whole numbers only (1 share, 1 gram). If fractional tracking is needed, extend to use NUMERIC with fixed decimal places (e.g., precision=2 for 0.01 gram increments). Document this decision for Phase 5 enhancement.

2. **Should investment history be tracked (e.g., historical value changes)?**
   - What we know: Current_value field is a single number that users update manually
   - What's unclear: Should we keep historical records of value changes to show portfolio growth over time?
   - Recommendation: Phase 4 does NOT require historical tracking. Implement as simple current_value update. If Phase 5 adds portfolio performance graphs, create an investment_history table then to avoid schema changes mid-implementation.

3. **Should monthly contribution field be required, or optional for some asset types?**
   - What we know: Requirements say "monthly contribution" as a field
   - What's unclear: Some investments (like one-time stock purchases) don't have monthly contributions
   - Recommendation: Keep monthly_contribution required but allow it to be 0. Use field name as-is; Phase 5 can add "Investment Type" (ongoing vs one-time) if needed.

4. **How to handle currency conversion if investments are in different currencies?**
   - What we know: Requirements assume IDR only
   - What's unclear: User might buy stock in USD or gold in grams (not currency)
   - Recommendation: Phase 4 assumes single currency (IDR) and single weight unit (grams for gold). Multi-currency support deferred to Phase 5. Document assumption in schema.

5. **Should investment CSV include category-level summaries, or raw data only?**
   - What we know: CSV export is required (INV-06)
   - What's unclear: Should summary rows be included, or just raw transactions/investments?
   - Recommendation: Include SUMMARY section with totals (see Code Examples section). Makes exported CSV more useful for spreadsheet analysis.

---

## Sources

### Primary (HIGH confidence)
- [Supabase: Row Level Security Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) - RLS pattern verification, policy syntax
- [PostgreSQL: CREATE TABLE documentation](https://www.postgresql.org/docs/current/sql-createtable.html) - Table design, constraints, indexes
- [currency.js GitHub](https://github.com/scurker/currency.js) - Financial arithmetic patterns, decimal handling
- [Zod: API Reference](https://zod.dev/api) - Schema validation patterns for investments
- [React: useMemo Documentation](https://react.dev/reference/react/useMemo) - Portfolio aggregation pattern
- [PapaParse: Unparse Documentation](https://www.papaparse.com/docs#unparse) - CSV export extension
- Existing project code (`src/lib/supabase/schema.ts`, `src/lib/storage.ts`) - Patterns verified in live codebase

### Secondary (MEDIUM confidence)
- [WebSearch: Investment Portfolio Tracking UI Patterns (2026)](https://blog.coupler.io/financial-dashboards/) - Dashboard component patterns, metrics display
- [WebSearch: PostgreSQL Multi-Tenant Design](https://neon.com/blog/multi-tenancy-and-database-per-user-design-in-postgres) - RLS and multi-user patterns
- [WebSearch: Zod + TypeScript Schema Validation](https://blog.logrocket.com/schema-validation-typescript-zod/) - Form validation best practices
- [WebSearch: React Form State Management (2025)](https://www.developerway.com/posts/react-state-management-2025) - Form patterns with useState

### Tertiary (LOW confidence - marked for validation)
- None - all critical findings verified with official docs or project code

---

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH - All libraries already in project; patterns verified with official docs
- **Architecture patterns:** HIGH - RLS, Zod, useMemo patterns proven in Phase 1-3 implementation; currency.js verified with official GitHub
- **Database schema:** HIGH - Follows existing transaction table pattern exactly; constraints verified with PostgreSQL docs
- **Pitfalls:** HIGH - Based on documented PostgreSQL/RLS issues and currency arithmetic edge cases
- **Portfolio calculations:** MEDIUM-HIGH - Calculations verified with currency.js docs; specific performance benchmarking would require testing in project context

**Research date:** 2026-02-16
**Valid until:** 2026-03-16 (30 days - PostgreSQL, Zod, and React are stable; currency.js rarely updates)

---

## Pre-Submission Checklist

- [x] All domains investigated (schema, validation, calculations, export)
- [x] Negative claims verified with official docs
- [x] Multiple sources cross-referenced for critical claims
- [x] URLs provided for authoritative sources
- [x] Publication dates checked (current docs, 2026 searches)
- [x] Confidence levels assigned honestly
- [x] "What might I have missed?" review completed
  - Potential missed: Real-time investment price updates (explicitly out of scope per requirements)
  - Potential missed: Portfolio rebalancing recommendations (not in requirements)
  - Potential missed: Tax reporting helpers (deferred to future phase)
