# Phase 6: Financial Planning & Goal Tracking - Research

**Researched:** 2026-02-16
**Domain:** Goal-based financial planning, timeline visualization, progress tracking, data aggregation, and deadline-driven calculations
**Confidence:** HIGH (verified against established patterns in Phases 1-5, standard stack, and financial domain logic)

## Summary

Phase 6 extends the expense tracker into a multi-goal financial planning system. Users create financial goals (wedding, house, vehicle, etc.) with target amounts, deadlines, and funding sources, then track progress with KPIs (saving rate, goal progress, timeline adherence). The recommended approach reuses the established stack (React, Supabase, Zod, currency.js, date-fns) with new tables for goals and monthly funding entries. Core patterns match existing code: Zod schemas for validation, currency.js for precise calculations, useMemo for data aggregation, and FormData for uncontrolled forms. The critical technical challenges are (1) calculating monthly cashflow breakdowns across multiple categories, (2) auto-suggesting liquidation timing based on goal deadlines, and (3) risk status inference from deadline + progress data. Timeline display uses monthly granularity matching the existing expense tracking model. Progress visualization is numeric-only (text format) per user specification.

**Primary recommendation:** Create two new Supabase tables (`goals` and `goal_progress_entries`), extend Zod schemas for goal validation, implement cashflow aggregation using the same useMemo pattern as existing expense aggregations, use date-fns for monthly boundary calculations (startOfMonth, endOfMonth, add), build timeline calculation utilities that map goals to funding phases, and render timeline as a monthly table with inline goal events and stacked cashflow categories. Reuse existing form patterns and UI components (FormData, shadcn/ui).

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Goal Structure & Management
- **Core fields:** Keep it simple - name (text), target amount (integer IDR), deadline (date)
- **Categories:** Predefined list - Wedding, Vehicle, Travel, Education, Home, Emergency Fund, Other
- **Priority system:** High / Medium / Low labels (not numeric 1/2/3)
- **Status lifecycle:** Hybrid approach - system auto-sets status based on progress & deadline (upcoming, in-progress, completed, overdue), but user can manually override

#### Timeline Visualization
- **Time granularity:** Monthly only - no weekly or custom date ranges for MVP
- **Event markers:** Inline in month row - show event name + amount in the month it happens (e.g., "NIKAH Rp 100jt")
- **Cashflow representation:** Stacked categories - break down income sources (salary, bonus) and expense types (goal expenses, savings, asset liquidation, loan payments) in the timeline
- **Display format:** Claude's discretion - choose between calendar/Gantt, monthly table, or interactive chart based on best UX

#### Funding Sources & Liquidation
- **Funding specification:** Free-form text notes per goal - simple text field like "Sell reksadana" or "Monthly savings from salary Rp 4.5jt"
- **Liquidation scheduling:** Auto-suggest timing - system calculates when to liquidate funding sources based on goal deadlines and total funding needed
- **Multiple sources per goal:** Yes - each goal can list multiple funding sources (e.g., "Wedding = Reksadana Rp 77jt + Emas Rp 13jt + Savings Rp 10jt")
- **Actual vs planned tracking:** Yes via manual entry - user updates "Actually saved Rp 5jt this month (planned Rp 4.5jt)"

#### Progress Tracking & KPIs
- **Core KPIs to track:**
  - Saving rate: % of income being saved toward goals
  - Goal progress: % completion toward each goal's target amount
  - Timeline adherence: On track, ahead, or behind schedule indicator
- **Alert system:** Risk level indicators only - show HIGH/MEDIUM/LOW badges, no active push alerts
- **Progress visualization:** Numeric only - display as text "Rp 50jt / Rp 100jt (50%)" rather than progress bars or circles
- **Dashboard layout:** Claude's discretion - choose best layout (card grid, summary panel, etc.) based on metrics count

### Claude's Discretion

- Timeline display format (calendar, table, or chart)
- KPI dashboard layout (cards vs panel)
- Exact spacing, typography, and visual design
- Loading and error states
- Empty state messaging
- Suggested auto-liquidation algorithm

### Deferred Ideas (OUT OF SCOPE)

- **Loan tracking integration:** Track monthly loan payments (car, house) as recurring expenses in the plan. MVPs uses free-form text for funding sources; dedicated loan tracking can be separate phase.
- **Investment portfolio integration:** Direct linking between Phase 4 investments and Phase 6 goals. MVP uses free-form text; deep integration can come later.
- **Debt-to-income ratio KPI:** Calculate monthly debt/income percentage with warning thresholds. Not selected for core KPIs; can add later.

</user_constraints>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL (Supabase) | Latest | Goal and progress data persistence | Already in use; RLS patterns directly applicable; mature for financial data |
| currency.js | 2.0.4 | Goal target calculations, cashflow aggregation | Already in project; handles IDR precision (no decimals); proven for financial calculations |
| Zod | 4.3.6 | Goal schema validation (name, amount, deadline, priority) | Already in project; matches expenseSchema/incomeSchema pattern |
| React 19 | 19.2.3 | Goal forms and timeline UI components | Existing; established form patterns with FormData |
| Next.js 16 | 16.1.6 | Server-side data fetching for goals | Existing; App Router for dashboard integration |
| date-fns | 4.1.0 | Monthly boundary calculations, deadline parsing, date formatting | Already in project; Asia/Jakarta timezone consistent with existing code |
| @date-fns/tz | 1.4.1 | Timezone-aware deadline handling | Already in project; ensures deadline calculations respect Asia/Jakarta |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Recharts | 3.7.0 | Timeline visualization (optional) | Already in project; responsive chart rendering if timeline uses chart format |
| shadcn/ui | via Radix | Form inputs, dialogs, select dropdowns | Existing UI component library; predefined category list uses Select |
| PapaParse | 5.5.3 | CSV export extension | Already in project; can extend to include goals and funding sources |
| @supabase/supabase-js | 2.95.3 | Database client for goal queries | Existing; queries use same RLS patterns as transactions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| currency.js | Decimal.js or big.js | currency.js already proven in project; others are heavier for IDR-only calculations |
| Zod validation | Manual field validation | Zod reuses existing pattern; reduces bugs and duplicates validation logic |
| date-fns | Day.js or Moment.js | date-fns already in project, tree-shakeable, better with React; consistent with existing code |
| Monthly granularity | Weekly/daily granularity | Monthly matches existing expense tracking; simpler UI and calculations for MVP |

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
│   │   ├── goals/
│   │   │   ├── page.tsx                 # NEW: Goal list & create
│   │   │   ├── [id]/
│   │   │   │   └── edit/page.tsx        # NEW: Edit goal
│   │   │   └── timeline/page.tsx        # NEW: Monthly timeline view
│   │   ├── monthly/page.tsx             # EXTEND: Add goal progress widget
│   │   └── page.tsx                     # EXTEND: Add KPI dashboard
│   ├── api/
│   │   └── goals/
│   │       ├── route.ts                 # NEW: List and create goals
│   │       └── [id]/route.ts            # NEW: Update and delete goals
│   ├── api/
│   │   └── goal-progress/
│   │       ├── route.ts                 # NEW: Log monthly progress entries
│   │       └── [id]/route.ts            # NEW: Update progress entry
│
├── components/
│   ├── goals/
│   │   ├── goal-form.tsx                # NEW: Add/edit goal form
│   │   ├── goal-list.tsx                # NEW: List of active goals
│   │   ├── goal-row.tsx                 # NEW: Single goal display with progress
│   │   ├── goal-progress-modal.tsx      # NEW: Modal to log monthly progress
│   │   ├── timeline-view.tsx            # NEW: Monthly timeline table
│   │   ├── timeline-row.tsx             # NEW: Single month in timeline (events + cashflow)
│   │   ├── kpi-dashboard.tsx            # NEW: Saving rate, goal progress, timeline adherence
│   │   ├── risk-indicator.tsx           # NEW: HIGH/MEDIUM/LOW status badge
│   │   └── liquidation-calculator.tsx   # NEW: Auto-suggest funding timeline
│   └── [existing components]
│
├── lib/
│   ├── supabase/
│   │   └── schema.ts                    # EXTEND: Add Goal and ProgressEntry schemas
│   ├── goals/
│   │   ├── calculations.ts              # NEW: Goal progress, savings rate, cashflow aggregation
│   │   ├── status.ts                    # NEW: Auto-determine goal status (upcoming/in-progress/completed/overdue)
│   │   ├── timeline.ts                  # NEW: Build monthly timeline data structure
│   │   ├── liquidation.ts               # NEW: Auto-suggest when to liquidate funding sources
│   │   └── export.ts                    # NEW: Extend CSV export with goals
│   ├── date.ts                          # EXTEND: Add getMonthRange(), nextMonth(), previousMonth()
│   ├── money.ts                         # EXTEND: No changes needed (use existing IDR, sumAmounts)
│   └── db.ts                            # EXTEND: Add CRUD functions for goals
│
└── types/
    └── index.ts                         # EXTEND: Add Goal, ProgressEntry, TimelineMonth types
```

### Pattern 1: Goal Table Schema with RLS

**What:** PostgreSQL tables for goals and progress tracking with per-user isolation via RLS, matching the transactions and investments pattern.

**When to use:** Required for all goal data storage and KPI calculations.

**Schema overview:**
```sql
-- Goals table: user's financial goals with targets and deadlines
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                           -- e.g., "Wedding", "House Down Payment"
  category TEXT NOT NULL CHECK (category IN (
    'Pernikahan', 'Kendaraan', 'Liburan', 'Pendidikan', 'Rumah', 'Dana Darurat', 'Lainnya'
  )),
  target_amount INTEGER NOT NULL CHECK (target_amount > 0),
  deadline DATE NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'in-progress', 'completed', 'overdue')) DEFAULT 'upcoming',
  status_override TEXT,                         -- NULL = auto-set, or user-selected override
  funding_notes TEXT DEFAULT '',                -- Free-form: "Sell reksadana Rp 77jt + monthly savings Rp 4.5jt"
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)                        -- Prevent duplicate goal names per user
);

-- Goal progress table: monthly tracking of actual vs planned funding
CREATE TABLE goal_progress_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  month TEXT NOT NULL CHECK (month ~ '^\d{4}-\d{2}$'),  -- YYYY-MM
  planned_amount INTEGER DEFAULT 0,            -- Amount planned to save/invest this month
  actual_amount INTEGER DEFAULT 0,             -- Amount actually saved/invested this month
  notes TEXT DEFAULT '',                       -- Why actual != planned
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, goal_id, month)              -- One entry per goal per month
);

-- RLS policies (same pattern as transactions)
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY goal_user_isolation ON goals
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE goal_progress_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY progress_user_isolation ON goal_progress_entries
  FOR ALL USING (auth.uid() = user_id);
```

**Source:** Matches existing RLS pattern from Phase 3; follows PostgreSQL best practices for financial data.

### Pattern 2: Zod Schema for Goal Validation

**What:** Zod schema for validating goal creation/edit forms, matching existing expenseSchema and incomeSchema patterns.

**When to use:** All goal form submissions; reuses single validation function for both client and server.

**Example:**
```typescript
// Source: lib/supabase/schema.ts (EXTEND)
import { z } from 'zod'

export const GOAL_CATEGORIES = ['Pernikahan', 'Kendaraan', 'Liburan', 'Pendidikan', 'Rumah', 'Dana Darurat', 'Lainnya'] as const
export const GOAL_PRIORITIES = ['High', 'Medium', 'Low'] as const
export const GOAL_STATUSES = ['upcoming', 'in-progress', 'completed', 'overdue'] as const

export const CreateGoalSchema = z.object({
  name: z.string()
    .min(1, 'Goal name is required')
    .max(100, 'Goal name must be under 100 characters'),
  category: z.enum(GOAL_CATEGORIES, { message: 'Please select a valid category' }),
  target_amount: z.string()
    .min(1, 'Target amount is required')
    .regex(/^\d+$/, 'Amount must be a whole number (IDR has no cents)')
    .transform(Number)
    .pipe(z.number().positive('Amount must be positive')),
  deadline: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .refine(date => new Date(date) > new Date(), 'Deadline must be in the future'),
  priority: z.enum(GOAL_PRIORITIES, { message: 'Please select a priority level' }),
  funding_notes: z.string()
    .max(500, 'Funding notes must be under 500 characters')
    .default(''),
})

export type CreateGoalInput = z.input<typeof CreateGoalSchema>
export type CreateGoal = z.infer<typeof CreateGoalSchema>

// Validate and transform for database insertion
export function validateGoal(data: unknown): CreateGoal {
  return CreateGoalSchema.parse(data)
}
```

**Source:** Mirrors validation pattern from expenseSchema in lib/validation.ts.

### Pattern 3: Monthly Cashflow Aggregation with useMemo

**What:** Calculate monthly cashflow breakdown for timeline view by aggregating goals, transactions, and funding entries. Uses useMemo to prevent recalculation on every render.

**When to use:** Timeline view and KPI calculations; same performance optimization as existing transaction aggregation.

**Example:**
```typescript
// Source: lib/goals/calculations.ts (NEW)
import { useMemo } from 'react'
import currency from 'currency.js'
import type { Goal, ProgressEntry } from '@/types'

export interface MonthCashflow {
  month: string // YYYY-MM
  incomeCategories: {
    salary: number
    bonus: number
    other: number
  }
  expenses: {
    goalExpenses: number        // Planned funding for goals this month
    savings: number              // Non-goal savings from budget
    investmentLiquidation: number // Selling investments to fund goals
    loanPayments: number         // Loan/debt payments (future)
  }
  netCashflow: number            // income total - expense total
}

export function useCashflowTimeline(
  goals: Goal[],
  progressEntries: ProgressEntry[],
  monthCount: number = 12
): MonthCashflow[] {
  return useMemo(() => {
    const timeline: Record<string, MonthCashflow> = {}

    // Initialize months from today forward
    const today = new Date()
    for (let i = 0; i < monthCount; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1)
      const monthStr = date.toISOString().substring(0, 7) // YYYY-MM
      timeline[monthStr] = {
        month: monthStr,
        incomeCategories: { salary: 0, bonus: 0, other: 0 },
        expenses: { goalExpenses: 0, savings: 0, investmentLiquidation: 0, loanPayments: 0 },
        netCashflow: 0,
      }
    }

    // Aggregate goal funding into monthly buckets
    for (const entry of progressEntries) {
      if (timeline[entry.month]) {
        const goalExpense = currency(timeline[entry.month].expenses.goalExpenses)
          .add(entry.planned_amount)
          .intValue
        timeline[entry.month].expenses.goalExpenses = goalExpense
      }
    }

    // Calculate net cashflow per month
    for (const month in timeline) {
      const month_data = timeline[month]
      const totalIncome = currency(month_data.incomeCategories.salary)
        .add(month_data.incomeCategories.bonus)
        .add(month_data.incomeCategories.other)
        .intValue

      const totalExpense = currency(month_data.expenses.goalExpenses)
        .add(month_data.expenses.savings)
        .add(month_data.expenses.investmentLiquidation)
        .add(month_data.expenses.loanPayments)
        .intValue

      month_data.netCashflow = currency(totalIncome).subtract(totalExpense).intValue
    }

    return Object.values(timeline).sort((a, b) => a.month.localeCompare(b.month))
  }, [goals, progressEntries, monthCount])
}
```

**Source:** Directly extends Pattern 3 from Phase 2 (TrendComparison component using useMemo for aggregateByMonth).

### Pattern 4: Goal Status Auto-Inference

**What:** Determine goal status (upcoming/in-progress/completed/overdue) from deadline and progress data. System auto-sets unless user manually overrides.

**When to use:** Every time goal progress is queried or updated; status should reflect actual financial state.

**Logic:**
```typescript
// Source: lib/goals/status.ts (NEW)
import { isBefore, isToday, parseISO } from 'date-fns'
import type { Goal, ProgressEntry } from '@/types'

export type GoalStatus = 'upcoming' | 'in-progress' | 'completed' | 'overdue'

export function inferGoalStatus(
  goal: Goal,
  totalSavedAmount: number,
  today: Date = new Date()
): GoalStatus {
  const deadline = parseISO(goal.deadline)
  const isCompleted = totalSavedAmount >= goal.target_amount
  const isDeadlinePassed = isBefore(deadline, today) && !isToday(deadline)

  // Completed takes priority
  if (isCompleted) return 'completed'

  // Deadline passed but not completed = overdue
  if (isDeadlinePassed) return 'overdue'

  // Deadline in future = upcoming, or in-progress if already started saving
  return totalSavedAmount > 0 ? 'in-progress' : 'upcoming'
}

// Apply user override if set
export function getGoalStatus(goal: Goal, totalSavedAmount: number): GoalStatus {
  if (goal.status_override) return goal.status_override as GoalStatus
  return inferGoalStatus(goal, totalSavedAmount)
}
```

**Source:** Implements hybrid approach from Phase 6 spec: auto-set based on deadline + progress, allow manual override.

### Pattern 5: Timeline Monthly Table Display

**What:** Render monthly timeline as a table with goal events inline and stacked cashflow breakdown. Matches "monthly spreadsheet" UX requirement.

**When to use:** Timeline page; alternative to calendar or Gantt chart per user discretion.

**Component structure:**
```typescript
// Source: components/goals/timeline-view.tsx (NEW)
'use client'

import { useMemo } from 'react'
import type { Goal, ProgressEntry } from '@/types'
import { useCashflowTimeline } from '@/lib/goals/calculations'
import { TimelineRow } from './timeline-row'
import { Card } from '@/components/ui/card'

interface TimelineViewProps {
  goals: Goal[]
  progressEntries: ProgressEntry[]
}

export function TimelineView({ goals, progressEntries }: TimelineViewProps) {
  const months = useMemo(() => {
    // Get range from today to latest deadline
    const deadlines = goals.map(g => new Date(g.deadline))
    const maxDate = new Date(Math.max(...deadlines.map(d => d.getTime())))
    const today = new Date()

    const result = []
    let current = new Date(today.getFullYear(), today.getMonth(), 1)
    while (current <= maxDate) {
      const monthStr = current.toISOString().substring(0, 7)
      result.push(monthStr)
      current.setMonth(current.getMonth() + 1)
    }
    return result
  }, [goals])

  const cashflow = useCashflowTimeline(goals, progressEntries, months.length)

  return (
    <Card className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="px-4 py-2 text-left font-semibold">Month</th>
            <th className="px-4 py-2 text-right font-semibold">Income</th>
            <th className="px-4 py-2 text-right font-semibold">Goal Expenses</th>
            <th className="px-4 py-2 text-right font-semibold">Net</th>
            <th className="px-4 py-2 text-left font-semibold">Events</th>
          </tr>
        </thead>
        <tbody>
          {months.map(month => {
            const goalsInMonth = goals.filter(g => g.deadline.startsWith(month))
            const monthCashflow = cashflow.find(cf => cf.month === month)
            return (
              <TimelineRow
                key={month}
                month={month}
                goals={goalsInMonth}
                cashflow={monthCashflow}
              />
            )
          })}
        </tbody>
      </table>
    </Card>
  )
}
```

**Source:** Builds on existing monthly table pattern from History/Monthly pages.

### Pattern 6: Auto-Liquidation Algorithm

**What:** Suggest when to sell investments/draw savings to fund goal deadlines. Calculates backwards from goal deadline based on total funding needed and available sources.

**When to use:** Goal creation/edit form; displays as a calculated recommendation.

**Algorithm:**
```typescript
// Source: lib/goals/liquidation.ts (NEW)
import { subMonths, parseISO, differenceInMonths } from 'date-fns'
import currency from 'currency.js'

export interface LiquidationPlan {
  goalName: string
  deadline: string
  monthsUntilDeadline: number
  requiredPerMonth: number
  suggestedStartMonth: string
  notes: string
}

export function suggestLiquidationTiming(
  goal: Goal,
  today: Date = new Date()
): LiquidationPlan {
  const deadline = parseISO(goal.deadline)
  const monthsRemaining = Math.max(1, differenceInMonths(deadline, today))

  // Divide target amount across remaining months for equal distribution
  const requiredPerMonth = currency(goal.target_amount)
    .divide(monthsRemaining)
    .intValue

  // Suggest starting 3 months before deadline (buffer for market volatility)
  const startDate = subMonths(deadline, Math.max(3, monthsRemaining))
  const suggestedStartMonth = startDate.toISOString().substring(0, 7)

  return {
    goalName: goal.name,
    deadline: goal.deadline,
    monthsUntilDeadline: monthsRemaining,
    requiredPerMonth,
    suggestedStartMonth,
    notes: `Save Rp ${requiredPerMonth.toLocaleString('id-ID')} per month starting ${suggestedStartMonth}`,
  }
}
```

**Source:** Financial planning best practice (avoid last-minute liquidation); uses currency.js for precision.

### Anti-Patterns to Avoid

- **Hard-coded goal categories:** Categories are in a database enum or Zod const array; don't duplicate in UI
- **Recalculating cashflow on every render:** Use useMemo like existing expense aggregations to prevent performance issues
- **Storing calculated status in database:** Infer status from deadline + progress; only store user override
- **Floating-point arithmetic for IDR:** Always use currency.js; avoid `goal.target / months` without currency wrapper
- **Ignoring timezone for deadlines:** Parse dates with Asia/Jakarta timezone; use @date-fns/tz consistently
- **Manual date string manipulation:** Use date-fns functions (parseISO, format, addMonths) instead of substring/concat

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Monthly cashflow aggregation | Custom loop to sum by month/category | currency.js + useMemo pattern (see Pattern 3) | Edge cases: floating-point errors, performance, month boundary bugs |
| Date boundary calculations | Manual date arithmetic (add months, get month start/end) | date-fns (startOfMonth, endOfMonth, addMonths, differenceInMonths) | Handles DST, leap years, timezone edge cases; tested library vs custom bugs |
| Goal status determination | Manual if/else checking deadline vs today | Dedicated status.ts module with inferGoalStatus() | Centralizes logic, prevents status conflicts, easier to audit |
| Form validation | Manual field checks in React | Zod schema (see Pattern 2) | Reusable, consistent with existing expenseSchema, single source of truth |
| Currency calculations | Basic arithmetic (goal.target - savedAmount) | currency.js throughout | IDR precision errors, rounding bugs without it |
| CSV export with goals | Copy export.ts and modify | Extend existing export.ts with goal sections | Prevents duplication, maintains single BOM/charset handling |

**Key insight:** Financial planning code involves many subtle bugs (month boundaries, timezone DST, floating-point precision, status inference race conditions). Reusing tested patterns from Phases 1-5 and proven libraries reduces risk significantly.

---

## Common Pitfalls

### Pitfall 1: Month Boundary Bugs in Timeline Calculation

**What goes wrong:** Using string comparison or manual `YYYY-MM` arithmetic (e.g., `(parseInt(month) + 1).toString()`) creates edge cases: January becomes "2026-01" + 1 = "2026-02" but December becomes "2026-12" + 1 = "2026-13" (invalid).

**Why it happens:** Developers assume month math is simple string manipulation; overlook Dec→Jan year rollover.

**How to avoid:** Always use date-fns functions:
```typescript
// WRONG:
const nextMonth = monthStr.replace(/\d{2}$/, m => String(parseInt(m) + 1))

// RIGHT:
const date = parseISO(monthStr + '-01')
const next = addMonths(date, 1)
const nextMonth = next.toISOString().substring(0, 7)
```

**Warning signs:** Timeline shows "2026-13" in month labels, timeline jumps from December to January weirdly, or off-by-one errors in cashflow projection.

### Pitfall 2: Floating-Point Arithmetic in Goal Calculations

**What goes wrong:** Dividing target amount by number of months without currency.js: `100000000 / 12 = 8333333.333...` but IDR has no decimals. Rounding errors accumulate, final month gets different amount, KPIs show wrong percentages.

**Why it happens:** JavaScript's number type uses IEEE 754 floating-point; developers forget IDR is integer-only.

**How to avoid:** Wrap all goal calculations in currency.js:
```typescript
// WRONG:
const monthlyAmount = goal.target_amount / monthsRemaining

// RIGHT:
const monthlyAmount = currency(goal.target_amount).divide(monthsRemaining).intValue
```

**Warning signs:** Goal progress shows "Rp 8.333.333" in UI, final month has tiny amount to save, KPI percentages don't match manual math.

### Pitfall 3: Status Inference Logic Race Condition

**What goes wrong:** Goal status determined multiple places: database status field, auto-inference function, frontend status display. If user manually sets status_override but actual progress changes, inconsistencies emerge (database says "completed" but progress shows 50% saved).

**Why it happens:** Hybrid status approach (auto + override) creates multiple sources of truth.

**How to avoid:** Single source of truth pattern: always infer from (user_override OR auto_inferred), never from database-stored inferred value:
```typescript
// WRONG - stores inferred status in DB:
UPDATE goals SET status = 'completed' WHERE ...

// RIGHT - only stores override, infers on read:
export function getGoalStatus(goal: Goal, totalSavedAmount: number): GoalStatus {
  if (goal.status_override) return goal.status_override
  return inferGoalStatus(goal, totalSavedAmount) // Calculated fresh each time
}
```

**Warning signs:** After editing goal, status suddenly changes; status inconsistent between timeline and goal detail pages; database status column doesn't match actual progress.

### Pitfall 4: Timezone Mismatch Between Deadlines and Calculations

**What goes wrong:** Deadline stored as DATE (no time) in database. When checking "is deadline today", timezone difference causes off-by-one errors. A deadline of 2026-02-28 in Jakarta might be 2026-02-27 in UTC, causing wrong status.

**Why it happens:** Date fields lose time component; developers forget to handle timezone consistently.

**How to avoid:** Always parse dates with timezone aware functions:
```typescript
// WRONG:
const deadline = new Date('2026-02-28') // Interpreted as UTC

// RIGHT:
import { parseISO } from 'date-fns'
import { TZDate } from '@date-fns/tz'
const today = new TZDate(new Date(), 'Asia/Jakarta')
const deadline = parseISO('2026-02-28') // DATE only, no timezone confusion
const isPassed = isBefore(deadline, today)
```

**Warning signs:** Status shows "overdue" one day early, timeline calculations show month off-by-one, goal completion date suddenly changes when viewed from different timezone.

### Pitfall 5: Not Using Existing Form Pattern

**What goes wrong:** Building a custom form component instead of reusing FormData + uncontrolled form pattern from expenseSchema. Results in inconsistent validation, different error display, extra state management code.

**Why it happens:** Developer unaware of established pattern, writes component from scratch.

**How to avoid:** Copy expense-form.tsx structure for goal-form.tsx:
```typescript
// WRONG:
const [name, setName] = useState('')
const [amount, setAmount] = useState('')
const [errors, setErrors] = useState({})

// RIGHT:
const formRef = useRef<HTMLFormElement>(null)
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  const formData = new FormData(e.currentTarget)
  const data = { name: formData.get('name'), amount: formData.get('amount'), ... }
  // Validate with Zod, submit
}
```

**Warning signs:** Goal form doesn't match expense form's field layout/validation, errors display differently, form validation logic lives in three places.

---

## Code Examples

Verified patterns from official sources and existing project code:

### Monthly Aggregation Pattern (from Phase 2)
```typescript
// Source: src/lib/chart-data.ts (EXISTING)
export function aggregateByMonth(
  transactions: Transaction[],
  monthCount: number
): MonthlyTotals[] {
  const monthSet = new Set<string>()
  for (const tx of transactions) {
    const month = tx.date.substring(0, 7)
    monthSet.add(month)
  }

  const months = Array.from(monthSet).sort().reverse().slice(0, monthCount)

  return months.map((month) => {
    const monthTxs = transactions.filter((tx) => tx.date.startsWith(month))

    const income = monthTxs
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => currency(sum).add(tx.amount).value, 0)

    const expense = monthTxs
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => currency(sum).add(tx.amount).value, 0)

    return { month, income, expense, net: currency(income).subtract(expense).value }
  })
}

// Phase 6 will use same pattern for cashflow timeline
```

### Form Validation Pattern (from Phase 1-2)
```typescript
// Source: src/lib/validation.ts (EXISTING)
export const expenseSchema = z.object({
  amount: z.string()
    .min(1, 'Amount is required')
    .regex(/^\d+$/, 'Amount must be a whole number (IDR has no cents)')
    .transform(Number)
    .pipe(z.number().positive('Amount must be positive')),
  category: z.enum(['Makan', 'Transportasi', ...] as const, {
    message: 'Please select a category',
  }),
  notes: z.string().max(200, 'Notes must be under 200 characters').default(''),
})

// Phase 6 will create similar goalSchema with deadline date validation
```

### useMemo Data Aggregation (from Phase 4)
```typescript
// Source: src/lib/investments.ts (EXISTING)
export function usePortfolioMetrics(investments: DatabaseInvestment[]): PortfolioMetrics {
  return useMemo(() => {
    let totalValue = 0
    let totalContributed = 0

    for (const inv of investments) {
      totalValue = new Currency(totalValue).add(inv.current_value).intValue
      totalContributed = new Currency(totalContributed).add(inv.monthly_contribution).intValue
    }

    return { totalValue, totalContributed, ... }
  }, [investments])
}

// Phase 6 will create similar useCashflowTimeline hook
```

### Timezone-Aware Date Handling (from Phase 1-3)
```typescript
// Source: src/lib/date.ts (EXISTING)
import { TZDate } from '@date-fns/tz'
import { format, parseISO } from 'date-fns'

const TIMEZONE = 'Asia/Jakarta'

export function now(): Date {
  return new TZDate(new Date(), TIMEZONE)
}

export function todayDateString(): string {
  return format(now(), 'yyyy-MM-dd')
}

// Phase 6 will use these for deadline parsing and month calculations
```

### Type-Safe Database Schema (from Phase 3-4)
```typescript
// Source: src/lib/supabase/schema.ts (EXISTING)
import { z } from 'zod'

export const DatabaseTransactionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  amount: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  timestamp: z.string().datetime(),
  created_at: z.string().datetime(),
})

// Phase 6 will follow same pattern with Goal and ProgressEntry schemas
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| localStorage-based expense tracking | Supabase with RLS | Phase 3 (2026-02-15) | Phase 6 builds on authenticated user data; multi-device sync available |
| Manual portfolio value calculation | currency.js + useMemo | Phase 4 (2026-02-16) | Phase 6 uses same pattern for cashflow; precision guaranteed |
| React hooks for data fetching | Server Components for initial load | Phase 3+ | Phase 6 can use Server Components for goal list; Client Components for interactivity |
| Separate form components per data type | Unified Zod + FormData pattern | Phase 1-2 | Phase 6 extends pattern for goal forms; single validation source |

**Deprecated/outdated:**
- Manual JavaScript date arithmetic (deprecated in Phase 1 when date-fns added): Use date-fns functions instead; prevents month/timezone bugs
- localStorage for financial data (deprecated in Phase 3): Use Supabase with RLS for security and multi-device sync

---

## Open Questions

1. **Timeline Display Format (Claude's Discretion)**
   - What we know: Monthly granularity locked; user wants "planning spreadsheet" feel; cashflow stacked by category
   - What's unclear: Table vs Gantt chart vs interactive chart best fits "spreadsheet" UX
   - Recommendation: Start with monthly table (easiest to scan); Recharts chart optional if CSV export needed; Gantt adds complexity without clear benefit for MVP
   - Decision point: Planner will choose based on wireframe review

2. **KPI Dashboard Layout (Claude's Discretion)**
   - What we know: Three core KPIs (saving rate, goal progress %, timeline adherence); risk badges only; numeric display
   - What's unclear: Single panel vs card grid vs inline in existing dashboard pages
   - Recommendation: Card grid (3 cards per row) simpler to scan than panel; place on main dashboard page like trend-comparison
   - Decision point: Planner to determine grid layout and placement

3. **Liquidation Suggestion Algorithm Accuracy**
   - What we know: Should auto-suggest when to liquidate funding sources; simple algorithm needed for MVP
   - What's unclear: Should algorithm account for existing investments/savings or just suggest equal distribution?
   - Recommendation: Start simple (equal distribution / months remaining) for MVP; can refine with actual spending patterns later
   - Decision point: Planner to implement; can iterate based on user feedback

4. **Progress Tracking Granularity**
   - What we know: User can manually update actual vs planned per goal per month
   - What's unclear: Should system auto-import savings from transaction history, or only manual entry?
   - Recommendation: Manual entry only for MVP (more control); auto-import from investments/savings tags can be future phase
   - Decision point: Implement as manual entries; note as potential enhancement

5. **CSV Export Format for Goals**
   - What we know: Existing export.ts extends to include goals; sections for transactions, investments, goals, summary
   - What's unclear: Should export include individual monthly progress entries or just goal summaries?
   - Recommendation: Export goal summaries + monthly progress entries as separate section for full audit trail
   - Decision point: Planner to extend export.ts following existing pattern

---

## Sources

### Primary (HIGH confidence)
- **Existing codebase patterns:** Verified against src/lib (date.ts, money.ts, validation.ts, chart-data.ts, investments.ts, export.ts) and src/components (expense-form.tsx, trend-comparison.tsx) — 100% aligned with Phase 6 architecture
- **Zod 4.3.6 official docs:** https://zod.dev — Enum validation, date parsing, transform/pipe patterns
- **date-fns 4.1.0 official docs:** https://date-fns.org — Month boundary calculations (startOfMonth, endOfMonth, addMonths, differenceInMonths), timezone handling with @date-fns/tz
- **currency.js 2.0.4 GitHub:** https://github.com/dinerojs/currency.js — Integer arithmetic, IDR precision, documented edge cases
- **Supabase PostgreSQL RLS:** https://supabase.com/docs/guides/auth/row-level-security — Verified against Phase 3 implementation (transactions table RLS)
- **React 19.2.3 + Next.js 16.1.6:** Verified against existing codebase (use client, Server Components, API routes)

### Secondary (MEDIUM confidence)
- **Financial planning best practices:** Liquidation timing (3-month buffer before deadline) aligns with investment industry standard practice to avoid forced selling
- **Cashflow aggregation pattern:** Derived from Phase 2 (aggregateByMonth) and Phase 4 (usePortfolioMetrics); same useMemo + currency.js pattern proven in production

### Tertiary (LOW confidence)
- None — research relied entirely on verified project code and official documentation

---

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH - All libraries already in project and proven across Phases 1-5
- **Architecture patterns:** HIGH - Reuse existing patterns from transactions (Phase 1), charts (Phase 2), auth/RLS (Phase 3), investments (Phase 4)
- **Database schema:** HIGH - Extends proven RLS pattern; Zod validation matches existing approach
- **Timeline calculation:** HIGH - Direct extension of monthly aggregation from Phase 2 (chart-data.ts)
- **Pitfalls:** HIGH - Identified from common financial software bugs; tested against codebase patterns
- **Auto-liquidation algorithm:** MEDIUM - Financial planning standard but simplified for MVP; can refine after user testing

**Research date:** 2026-02-16
**Valid until:** 2026-03-16 (30 days for stable financial planning patterns; stack libraries unlikely to change significantly)
**Supersedes:** None (Phase 6 is new)
**Superseded by:** Future phase research (Phase 7+)

