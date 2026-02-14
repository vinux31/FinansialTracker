# Architecture Patterns

**Domain:** Personal Finance Tracker
**Researched:** 2026-02-14
**Confidence:** MEDIUM

## Recommended Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Quick   │  │ Dashboard│  │Portfolio│  │ Category│        │
│  │ Entry   │  │ Views    │  │ Tracker │  │ Summary │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
├───────┴────────────┴────────────┴────────────┴──────────────┤
│                    Application Layer                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Transaction  │  │ Aggregation  │  │ Category     │      │
│  │ Service      │  │ Service      │  │ Service      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
├─────────┴──────────────────┴──────────────────┴──────────────┤
│                      Data Layer                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │Transactns│  │Categories│  │Investmnts│  │Aggregates│    │
│  │ (append) │  │  (master)│  │ (current)│  │ (derived)│    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Quick Entry Form | Single-tap expense logging with minimal friction | React component with autofocus, category shortcuts, defaults to today's date |
| Dashboard Views | Display daily/monthly/yearly spending summaries | React components with chart library (Recharts/Victory), pre-aggregated data |
| Portfolio Tracker | Track investment values, categories, current worth | React component with manual entry form, calculated totals |
| Transaction Service | Handle all income/expense operations | CRUD operations on transactions table, validation, auto-categorization |
| Aggregation Service | Pre-compute summary statistics for dashboards | Scheduled/on-write aggregations to avoid expensive queries |
| Category Service | Manage expense categories, budgets, trends | Category CRUD, spending by category calculations |

## Recommended Project Structure

```
src/
├── components/          # UI components
│   ├── forms/          # QuickEntry, IncomeForm, InvestmentForm
│   ├── dashboards/     # DailyView, MonthlyView, YearlyView
│   ├── charts/         # CategoryChart, TrendChart, PortfolioChart
│   └── shared/         # Button, Input, DatePicker
├── services/           # Business logic layer
│   ├── transactions.ts # Transaction CRUD, validation
│   ├── aggregations.ts # Pre-computed summaries
│   ├── categories.ts   # Category management
│   └── portfolio.ts    # Investment tracking
├── hooks/              # Custom React hooks
│   ├── useTransactions.ts
│   ├── useDashboard.ts
│   └── usePortfolio.ts
├── lib/                # Database & utilities
│   ├── db.ts          # Database client setup
│   ├── schema.ts      # Table schemas
│   └── queries.ts     # Common queries
└── pages/              # Route components (if using Next.js/similar)
    ├── index.tsx      # Main dashboard
    ├── expenses.tsx   # Expense management
    └── portfolio.tsx  # Investment portfolio
```

### Structure Rationale

- **components/**: Organized by function (forms, dashboards, charts) rather than by feature to promote reusability across different views
- **services/**: Business logic separated from UI to enable easier testing and potential future API extraction
- **hooks/**: Custom hooks encapsulate data fetching and state management, keeping components focused on presentation
- **lib/**: Database and utility code isolated for easy swapping of database providers (critical for free hosting flexibility)

## Architectural Patterns

### Pattern 1: Append-Only Transaction Ledger

**What:** All financial transactions are stored as immutable records in an append-only table. Never update or delete transaction records; instead, create correcting entries.

**When to use:** Essential for personal finance because it provides complete audit trail, prevents accidental data loss, and enables "time travel" queries (what was my balance on date X?).

**Trade-offs:**
- **Pros:** Complete history, simple to reason about, naturally supports undo via reversing entries
- **Cons:** More storage than updating in place, requires aggregation for current state
- **Complexity:** Low - simpler than update-based approach because no concurrent update conflicts

**Free hosting implications:**
- Append-only tables can grow unbounded; free tier databases (Supabase: 500MB, PlanetScale free tier discontinued) may hit limits after ~10k-50k transactions depending on schema
- Mitigation: Archive old transactions yearly to separate cold storage tables

**Example:**
```typescript
// transactions table - never UPDATE or DELETE
interface Transaction {
  id: string;
  date: Date;
  amount: number;        // positive for income, negative for expense
  category_id: string;
  description: string;
  created_at: Date;      // when record was created (immutable)
}

// To "fix" a transaction, create a reversal + new correct entry
async function correctTransaction(originalId: string, correctedData: Partial<Transaction>) {
  const original = await getTransaction(originalId);

  // Create reversal
  await createTransaction({
    ...original,
    amount: -original.amount,
    description: `REVERSAL: ${original.description}`
  });

  // Create corrected entry
  await createTransaction({
    ...original,
    ...correctedData,
    description: `CORRECTED: ${correctedData.description}`
  });
}
```

### Pattern 2: Pre-Aggregated Dashboard Data

**What:** Instead of computing dashboard statistics on every page load, pre-calculate and store daily/monthly/yearly summaries in separate tables. Update these aggregates when transactions are added.

**When to use:** Critical for free hosting with limited compute. Dashboard queries like "total spending this month by category" can become expensive with large transaction histories.

**Trade-offs:**
- **Pros:** Fast dashboard loads (single table read vs complex GROUP BY), predictable performance, works within free tier function timeouts (typically 10s)
- **Cons:** Slightly stale data if aggregation fails, more storage, complexity in keeping aggregates in sync
- **Complexity:** Medium - need to handle aggregate updates reliably

**Free hosting implications:**
- Serverless function timeouts (Vercel: 10s free tier, Netlify: 10s) make on-the-fly aggregation risky for large datasets
- Pre-aggregation ensures dashboard loads stay under timeout limits
- Trade storage for compute (usually favorable on free tiers)

**Example:**
```typescript
// daily_summaries table (pre-aggregated)
interface DailySummary {
  date: Date;              // 2026-02-14
  total_income: number;
  total_expenses: number;
  net: number;
  expense_by_category: Record<string, number>;  // { "food": 50, "transport": 20 }
  updated_at: Date;
}

// Update aggregates when transaction is created
async function createTransaction(tx: Transaction) {
  // 1. Insert transaction (append-only)
  await db.insert('transactions', tx);

  // 2. Update today's summary
  const today = tx.date.toISOString().split('T')[0];
  const summary = await db.get('daily_summaries', { date: today }) || createEmpty(today);

  if (tx.amount > 0) {
    summary.total_income += tx.amount;
  } else {
    summary.total_expenses += Math.abs(tx.amount);
    summary.expense_by_category[tx.category_id] =
      (summary.expense_by_category[tx.category_id] || 0) + Math.abs(tx.amount);
  }
  summary.net = summary.total_income - summary.total_expenses;

  await db.upsert('daily_summaries', summary);
}

// Dashboard query is now trivial
async function getMonthSummary(year: number, month: number) {
  // Simple range query on pre-aggregated data
  return db.query('daily_summaries')
    .where('date', '>=', `${year}-${month}-01`)
    .where('date', '<', `${year}-${month + 1}-01`)
    .select();
}
```

### Pattern 3: Investment Snapshot Pattern

**What:** Store investment values as point-in-time snapshots rather than attempting to track every price change. Users manually update current values when they check them.

**When to use:** For personal finance without real-time market data APIs (which cost money and complicate free hosting). Users typically check portfolios weekly/monthly, not real-time.

**Trade-offs:**
- **Pros:** No API costs, no background jobs, simple data model, user controls data freshness
- **Cons:** Not real-time, requires manual updates, no automatic price tracking
- **Complexity:** Low - just a table with user-entered snapshots

**Free hosting implications:**
- Avoids need for scheduled jobs (cron) which may not be available or reliable on free tiers
- No external API dependencies (many free APIs have restrictive rate limits)
- No background workers needed

**Example:**
```typescript
// investments table
interface Investment {
  id: string;
  name: string;
  category: string;        // "stocks", "crypto", "bonds", "real estate"
  initial_value: number;
  initial_date: Date;
  current_value: number;
  last_updated: Date;      // user controls this
}

// investment_history table (optional, for trend tracking)
interface InvestmentSnapshot {
  investment_id: string;
  value: number;
  recorded_at: Date;
}

// User manually updates when checking portfolio
async function updateInvestmentValue(investmentId: string, newValue: number) {
  const investment = await db.get('investments', { id: investmentId });

  // Store snapshot for history/trends
  await db.insert('investment_history', {
    investment_id: investmentId,
    value: newValue,
    recorded_at: new Date()
  });

  // Update current value
  await db.update('investments', investmentId, {
    current_value: newValue,
    last_updated: new Date()
  });
}

// Portfolio summary is simple sum
async function getPortfolioSummary() {
  const investments = await db.query('investments').select();
  return {
    total_current: investments.reduce((sum, inv) => sum + inv.current_value, 0),
    total_initial: investments.reduce((sum, inv) => sum + inv.initial_value, 0),
    gain_loss: investments.reduce((sum, inv) => sum + (inv.current_value - inv.initial_value), 0)
  };
}
```

### Pattern 4: Client-Side Category Filtering (Free Hosting Optimization)

**What:** Load a reasonable window of transactions to the client (e.g., current month + last 3 months) and perform filtering/sorting/searching in the browser rather than via API calls.

**When to use:** When transaction volumes are modest (typical personal use: 5-30 transactions/day = 150-900/month) and free tier has limited function invocations (Vercel Hobby: unlimited functions but pay for execution time).

**Trade-offs:**
- **Pros:** Instant filtering without API roundtrips, fewer serverless function invocations, better UX responsiveness
- **Cons:** Initial load slightly larger, not suitable for huge datasets, needs periodic refresh
- **Complexity:** Low - standard React state management

**Free hosting implications:**
- Reduces serverless function invocations (some free tiers limit this)
- Single data fetch vs multiple filtered requests
- 3-4 months of transactions (~300-1200 records) is ~50-200KB JSON - negligible for modern browsers

**Example:**
```typescript
// Load recent transactions once
function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Single API call: last 120 days
    fetch('/api/transactions?days=120')
      .then(r => r.json())
      .then(setTransactions);
  }, []);

  // All filtering happens client-side
  const filterByCategory = (categoryId: string) =>
    transactions.filter(tx => tx.category_id === categoryId);

  const getDateRange = (startDate: Date, endDate: Date) =>
    transactions.filter(tx => tx.date >= startDate && tx.date <= endDate);

  const searchByDescription = (query: string) =>
    transactions.filter(tx =>
      tx.description.toLowerCase().includes(query.toLowerCase())
    );

  return { transactions, filterByCategory, getDateRange, searchByDescription };
}

// No API calls for filters - instant response
function ExpenseList() {
  const { transactions, filterByCategory } = useTransactions();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = selectedCategory
    ? filterByCategory(selectedCategory)
    : transactions;

  return (
    <div>
      <CategoryPicker onChange={setSelectedCategory} />
      {/* Instant filtering, no loading states */}
      <TransactionList items={filtered} />
    </div>
  );
}
```

### Pattern 5: Server State vs Client State Separation

**What:** Distinguish between server state (API data) and client state (UI state) and manage them with different tools.

**When to use:** Always. This is a fundamental principle for modern React applications.

**Trade-offs:**
- **Pro:** TanStack Query handles caching, refetching, and synchronization automatically
- **Pro:** Reduces complexity in client state (no need to manually sync API data)
- **Pro:** Better performance through automatic background refetching
- **Con:** Learning curve for TanStack Query
- **Con:** Two mental models (server vs client state)

**Example:**
```typescript
// Server state - managed by TanStack Query
import { useQuery, useMutation } from '@tanstack/react-query';

function useExpenses() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: () => fetch('/api/expenses').then(r => r.json())
  });
}

// Client state - managed by Zustand
import { create } from 'zustand';

const useUIStore = create((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen }))
}));
```

## Data Flow

### Request Flow - Transaction Creation

```
[User enters expense in Quick Entry Form]
    ↓
[Form Component] → [Validation] → [createTransaction API]
    ↓                                     ↓
[Optimistic UI Update]          [Insert to transactions table]
    ↓                                     ↓
[Success/Error Feedback]        [Update daily_summaries aggregate]
    ↓                                     ↓
[Refresh dashboard data]        [Return success]
```

### State Management Flow

```
┌─────────────────────────────────────────────┐
│           SERVER STATE (TanStack Query)      │
│  - Transactions                              │
│  - Categories                                │
│  - Investments                               │
│  - Analytics aggregations                    │
│  [Cached, auto-refetched, synchronized]      │
└─────────────────┬───────────────────────────┘
                  │
                  │ provides data to
                  ↓
┌─────────────────────────────────────────────┐
│               COMPONENTS                     │
│  - Read from queries                         │
│  - Trigger mutations                         │
│  - Subscribe to UI state                     │
└─────────────────┬───────────────────────────┘
                  │
                  │ manages UI state with
                  ↓
┌─────────────────────────────────────────────┐
│       CLIENT STATE (Zustand/Context)         │
│  - Sidebar open/closed                       │
│  - Selected date range                       │
│  - Theme preferences                         │
│  - Form draft state                          │
└─────────────────────────────────────────────┘
```

### Key Data Flows

1. **Quick Expense Entry Flow:** User types amount + category → Validation → API creates transaction → API updates today's summary → Client refetches today's summary → Dashboard updates instantly
   - **Optimization:** Optimistic UI updates - show transaction immediately, rollback if API fails
   - **Free hosting consideration:** Single write operation, minimal compute

2. **Dashboard Load Flow:** User navigates to dashboard → Client requests monthly aggregates (not raw transactions) → Single query returns pre-computed summaries → Charts render from aggregates
   - **Optimization:** Pre-aggregation means dashboard always loads in <1s even with years of history
   - **Free hosting consideration:** Minimal database query complexity, stays within function timeout

3. **Category Trend Analysis:** User selects category → Client filters already-loaded transactions by category OR queries daily_summaries.expense_by_category → Chart shows spending trend over time
   - **Optimization:** Hybrid approach - use client-side filtering for recent data, query aggregates for historical trends
   - **Free hosting consideration:** Balance between payload size and query complexity

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-100 users (personal/family) | Single database, all patterns above work as-is, free tier sufficient (Supabase/PlanetScale/Turso), client-side filtering perfectly fine |
| 100-1K users | Add caching layer (Redis/Vercel KV free tier), consider connection pooling for database (Supabase handles this), pre-aggregation becomes critical |
| 1K-10K users | Evaluate database limits (Supabase free tier likely insufficient), implement proper database pooling, consider CDN for static assets, may need paid database tier (~$25/mo) |
| 10K+ users | Move to paid infrastructure, implement proper background job processing for aggregations, consider read replicas for dashboard queries, add monitoring/alerting |

### Scaling Priorities

1. **First bottleneck: Database connection limits**
   - **Symptoms:** Timeouts on free tier (Supabase free: 60 connections)
   - **Fix:** Connection pooling (Supabase Supavisor, PgBouncer), or migrate to Turso (unlimited connections via HTTP)
   - **Cost:** Free with proper pooling configuration

2. **Second bottleneck: Aggregate computation time**
   - **Symptoms:** Slow transaction writes when updating multiple aggregates
   - **Fix:** Move aggregations to background queue (BullMQ + Redis), or accept eventual consistency (aggregate every 5 minutes instead of real-time)
   - **Cost:** Requires background worker (not available on pure free tiers)

3. **Third bottleneck: Dashboard query complexity**
   - **Symptoms:** Slow dashboard loads despite aggregation
   - **Fix:** More aggressive caching (Vercel KV, Redis), add database indexes on frequently queried columns (date, category_id), consider materialized views
   - **Cost:** Free tier caching (Vercel KV: 30K requests/mo) or Redis free tier (Upstash: 10K requests/day)

## Anti-Patterns

### Anti-Pattern 1: Real-Time Stock Price Integration in MVP

**What people do:** Integrate real-time market data APIs (Alpha Vantage, Yahoo Finance API) to automatically update investment values

**Why it's wrong:**
- Adds complexity: API authentication, rate limiting, error handling, background jobs
- Free APIs have severe rate limits (Alpha Vantage: 25 requests/day free tier)
- Requires scheduled jobs (cron) which free hosting often doesn't support reliably
- Users don't need real-time prices for personal finance - manual updates weekly/monthly is sufficient
- Creates external dependencies that can break deployment

**Do this instead:**
- Use Investment Snapshot Pattern (Pattern 3 above)
- Let users manually update values when they check their accounts
- Add a "last updated" timestamp to remind users to refresh
- If real-time data becomes critical, add it as Phase 2+ feature after validating user demand

### Anti-Pattern 2: Over-Normalized Database Schema

**What people do:** Create separate tables for every entity: currencies, countries, payment_methods, merchants, tags, etc. with full foreign key relationships

**Why it's wrong:**
- Query complexity explodes - simple "show expenses" requires 5+ table JOINs
- Free tier databases often have query time limits (serverless functions: 10s timeout)
- Complex migrations become painful
- Most personal finance apps have <10 users (individual/family), normalization overhead isn't justified
- Kills developer velocity - every feature requires touching multiple tables

**Do this instead:**
- Denormalize aggressively in MVP: Store category name in transactions table, not just ID
- Use JSON columns for semi-structured data (PostgreSQL JSONB, SQLite JSON)
- Keep it simple: 3-5 core tables (transactions, categories, investments, daily_summaries, users)
- Add normalization later only when data duplication actually causes problems
- Example: Store `category: "Food & Dining"` directly vs `category_id: 5` → JOIN categories table

### Anti-Pattern 3: Building Custom Authentication

**What people do:** Implement custom email/password authentication with bcrypt, password reset flows, email verification, session management

**Why it's wrong:**
- Security vulnerabilities: Easy to get wrong (password reset tokens, timing attacks, session fixation)
- Time sink: Auth is 30-40% of development time but 0% of core value proposition
- Free hosting limitations: Email sending requires external service (SendGrid, etc.)
- Maintenance burden: Security updates, handling edge cases, account recovery
- Compliance issues: GDPR, password storage regulations

**Do this instead:**
- Use auth provider: Supabase Auth (free tier), Clerk (free tier: 10K MAUs), NextAuth.js with OAuth providers
- Start with Google OAuth only - most users have Google accounts
- Benefits: Social login, password reset, email verification all handled
- Cost: Free tiers handle personal finance app scale (1-100 users) easily
- Focus development time on actual finance features

### Anti-Pattern 4: Implementing Double-Entry Accounting

**What people do:** Implement full double-entry bookkeeping with debits, credits, accounts, journals, posting to different accounts

**Why it's wrong for personal finance:**
- Massive complexity: Requires accounting knowledge, complex validation, reconciliation logic
- User confusion: Personal users don't think in debits/credits, they think "I spent $50 on groceries"
- Overkill: Double-entry is for businesses with complex accounting needs, not personal expense tracking
- Complicates simple queries: "How much did I spend this month?" requires summing across account postings
- Kills quick entry: "Quick expense logging" becomes "Create journal entry with offsetting accounts"

**Do this instead:**
- Use simple signed amounts: Positive for income, negative for expenses
- Single transactions table with amount, category, date, description
- For transfers between accounts: Create two linked transactions (one negative, one positive)
- Reserve double-entry for business accounting apps, not personal finance
- If formal accounting is needed, add it as advanced feature for subset of users

### Anti-Pattern 5: Mixing Server State in Client State Store

**What people do:** Store API response data in Redux/Zustand alongside UI state.

**Why it's wrong:** Manually managing cache invalidation, refetching, and synchronization is complex and error-prone. Leads to stale data, race conditions, and duplicated logic. TanStack Query solves these problems automatically.

**Do this instead:** Use TanStack Query for all API data. Reserve Zustand/Redux for client-only state (sidebar open/closed, selected filters, theme).

```typescript
// ❌ Bad: Storing API data in Zustand
const useStore = create((set) => ({
  expenses: [],
  fetchExpenses: async () => {
    const data = await fetch('/api/expenses').then(r => r.json());
    set({ expenses: data });
  }
}));

// ✅ Good: Use TanStack Query for server data
const { data: expenses } = useQuery({
  queryKey: ['expenses'],
  queryFn: () => fetch('/api/expenses').then(r => r.json())
});
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Database | Direct connection via client library | Supabase (PostgreSQL), Turso (SQLite), PlanetScale (MySQL) - pick one with generous free tier |
| Authentication | OAuth provider or auth service | Supabase Auth, Clerk, or NextAuth.js - avoid custom auth |
| Email (optional) | Transactional email API | Only needed if building budget alerts/notifications - defer to Phase 2+ |
| File Storage (optional) | Object storage for receipt images | Supabase Storage, Cloudflare R2 - only if supporting receipt uploads |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Components ↔ Services | Direct function calls | Services are just TypeScript functions, not separate microservices - keep it simple |
| Client ↔ API | REST or tRPC | tRPC if using full TypeScript stack (end-to-end type safety), otherwise REST |
| API ↔ Database | SQL via ORM or query builder | Prisma (type-safe ORM), Drizzle (lighter ORM), or Kysely (query builder) |

## Free Hosting Architecture Recommendations

### Recommended Stack for Free Hosting

**Frontend + Backend:**
- Vercel (free Hobby tier): Next.js app with API routes
- OR Netlify (free tier): Static site + Netlify Functions

**Database:**
- Supabase (free tier: 500MB, 2GB bandwidth, 60 connections) - Best for starting, includes auth
- OR Turso (free tier: 9GB storage, 1B row reads) - Best for scaling within free tier
- OR Neon (free tier: 10GB storage, 1 project) - Good PostgreSQL alternative

**State Management:**
- React Context for simple apps
- Zustand for medium complexity (lightweight, no boilerplate)

**Charts:**
- Recharts (easy, good docs) or Victory (more customizable)

### Database Design for Free Tier Constraints

```sql
-- Core schema optimized for free tier
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- from auth provider
  date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,  -- positive = income, negative = expense
  category VARCHAR(50) NOT NULL,   -- denormalized, no JOIN needed
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_user_date (user_id, date DESC),  -- Fast dashboard queries
  INDEX idx_user_category (user_id, category)  -- Category analysis
);

CREATE TABLE daily_summaries (
  date DATE NOT NULL,
  user_id UUID NOT NULL,
  total_income DECIMAL(10, 2) DEFAULT 0,
  total_expenses DECIMAL(10, 2) DEFAULT 0,
  net DECIMAL(10, 2) DEFAULT 0,
  expense_by_category JSONB,  -- {"food": 50.00, "transport": 20.00}
  updated_at TIMESTAMP DEFAULT NOW(),

  PRIMARY KEY (user_id, date)
);

CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,  -- "stocks", "crypto", "bonds", "real estate"
  initial_value DECIMAL(10, 2) NOT NULL,
  initial_date DATE NOT NULL,
  current_value DECIMAL(10, 2) NOT NULL,
  last_updated TIMESTAMP NOT NULL,

  INDEX idx_user (user_id)
);

-- Optional: Only if tracking investment history
CREATE TABLE investment_snapshots (
  investment_id UUID NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  recorded_at TIMESTAMP NOT NULL,

  INDEX idx_investment_date (investment_id, recorded_at DESC)
);

-- Optional: Only if allowing custom categories with budgets
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(50) NOT NULL,
  monthly_budget DECIMAL(10, 2),  -- NULL if no budget set
  color VARCHAR(7),  -- Hex color for charts

  UNIQUE (user_id, name)
);
```

### Key Design Decisions for Free Tier

1. **Denormalize category names** in transactions table to avoid JOINs on every query (trade storage for speed)
2. **Use JSONB for expense_by_category** instead of separate table (fewer tables, simpler queries)
3. **Indexes on (user_id, date)** make dashboard queries fast without expensive full table scans
4. **UUIDs for IDs** enable client-side ID generation (optimistic UI updates without server roundtrip)
5. **No cascading deletes** - simpler to reason about, less risk of accidental data loss

## Sources

### Architecture Patterns
- [Building a Personal Finance Management App: Database Setup with PostgreSQL and Docker](https://medium.com/towards-data-engineering/building-a-personal-finance-management-app-database-setup-with-postgresql-and-docker-5075e283303e)
- [How to Design a Database for Financial Applications - GeeksforGeeks](https://www.geeksforgeeks.org/dbms/how-to-design-a-database-for-financial-applications/)
- [Books, an immutable double-entry accounting database service - Square](https://developer.squareup.com/blog/books-an-immutable-double-entry-accounting-database-service/)
- [Building your own Ledger Database - Oskar Dudycz](https://www.architecture-weekly.com/p/building-your-own-ledger-database)
- [How to Build a Personal Finance App in 2026 - Orangesoft](https://orangesoft.co/blog/how-to-build-a-personal-finance-app)

### Database Schema Design
- [Investment Portfolio Tracker Database Structure and Schema](https://databasesample.com/database/investment-portfolio-tracker-database)
- [Investment Portfolio Data Modeling - DataStax](https://www.datastax.com/learn/data-modeling-by-example/investment-data-model)
- [An Elegant DB Schema for Double-Entry Accounting - Journalize.io](https://blog.journalize.io/posts/an-elegant-db-schema-for-double-entry-accounting/)

### Real-Time Dashboards
- [A step-by-step guide to build a real-time dashboard - Tinybird](https://www.tinybird.co/blog/real-time-dashboard-step-by-step)
- [How to Build Real-Time Dashboards for Web Applications](https://blog.pixelfreestudio.com/how-to-build-real-time-dashboards-for-web-applications/)
- [System Design Realtime Monitoring System](https://systemdesignschool.io/problems/realtime-monitoring-system/solution)

### Event Sourcing & CQRS (Advanced Patterns)
- [Understanding Event Sourcing and CQRS Pattern - Mia-Platform](https://mia-platform.eu/blog/understanding-event-sourcing-and-cqrs-pattern/)
- [CQRS & Event Sourcing in Financial Services - Icon Solutions](https://iconsolutions.com/blog/cqrs-event-sourcing)
- [Event Sourcing pattern - Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing)

### Free Hosting Constraints
- [Vercel Hobby Plan Documentation](https://vercel.com/docs/plans/hobby)
- [Vercel Limits](https://vercel.com/docs/limits)
- [Supabase Pricing 2026](https://checkthat.ai/brands/supabase/pricing)
- [Self-host a $1M personal finance app for free - Open-source Projects](https://www.opensourceprojects.dev/post/c1c63c12-8173-4375-a30f-ee6cb2a09856)
- [Serverless Architecture in 2026 - Middleware.io](https://middleware.io/blog/serverless-architecture/)

### Industry Best Practices
- [Key Features Every Personal Finance App Needs in 2026](https://financialpanther.com/key-features-every-personal-finance-app-needs-in-2026/)
- [Fintech UX Best Practices 2026](https://www.eleken.co/blog-posts/fintech-ux-best-practices)
- [Guide to Expense Management Software Development - Appinventiv](https://appinventiv.com/blog/expense-management-software-development/)

---
*Architecture research for: Personal Finance Tracker*
*Researched: 2026-02-14*
*Confidence: MEDIUM - Based on web search findings verified across multiple sources. Some patterns (append-only ledger, pre-aggregation) are industry-standard. Free tier limits verified from official documentation. Investment snapshot pattern is pragmatic recommendation based on constraints, not universally documented pattern.*
