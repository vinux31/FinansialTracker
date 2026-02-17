# Personal Finance Tracker

## What This Is

A personal finance tracker for daily expense logging, income tracking, investment portfolio management, and financial goal planning. Provides visual dashboards (category charts, trend analysis, KPI metrics), multi-device sync via Supabase authentication, and comprehensive CSV export. Built with Next.js 15 + Supabase on free hosting.

## Core Value

Quick daily expense logging with clear visualization of spending patterns. If everything else fails, logging an expense must be fast and seeing where money goes must be clear.

## Requirements

### Validated (v1.0)

- ✓ User can log daily expenses with amount, category, and optional notes — v1.0 (sub-5 second entry confirmed)
- ✓ User can track income from single source — v1.0
- ✓ User sees today's total spending on dashboard when opening the app — v1.0
- ✓ User can view monthly summary showing total spent and breakdown by category — v1.0
- ✓ User can view category trends showing how each expense category changes over time (month-to-month chart) — v1.0
- ✓ User can compare current month spending vs previous months — v1.0
- ✓ User can edit and delete transactions — v1.0
- ✓ User can export all data as CSV (transactions, investments, goals, progress) — v1.0
- ✓ User can create account and access data from multiple devices — v1.0
- ✓ User can track multiple investments (Saham/Emas/Reksadana) with portfolio summary — v1.0
- ✓ User can create financial goals with deadlines, track monthly progress, and view KPI dashboard — v1.0

### Active (v1.1 targets)

- [ ] User can view yearly summary showing annual totals and month-by-month averages (ENH-01)
- [ ] User can see per-category trends over time to understand spending patterns (ENH-02)
- [ ] User can save recurring expense templates for quick re-entry (ENH-03)
- [ ] User can set budget limits per category (ENH-04)
- [ ] User can see date picker in expense form to log past expenses

### Out of Scope

- Budget alerts/notifications — deferred past v1.1 (complexity, notification infrastructure)
- Import from existing spreadsheet — starting fresh, no historical import needed
- Mobile native app — web-first, PWA approach works on iOS/Android
- Multi-user support / sharing — single user focus for v1.x
- Receipt scanning/upload — simple text entry only
- Payment method tracking — category sufficient for now
- Multiple income sources — single income source sufficient
- Real-time stock price APIs — manual value entry only
- Dark mode — deferred to v1.1+ (ENH-06)
- Keyboard shortcuts — deferred to v1.1+ (ENH-07)

## Context

**Current state (v1.0 shipped):**
- 5,187 lines TypeScript across 5 phases, 22 plans
- Tech stack: Next.js 15, React 19, Supabase (PostgreSQL + Auth), Recharts, shadcn/ui, Zod, currency.js, date-fns
- Deployed to Vercel + Supabase free tiers
- 4 database tables: transactions, investments, goals, goal_progress_entries — all with RLS

**User needs:**
- Fast entry: Open app → Fill form (amount, category, notes) → Save
- Visual clarity: See spending patterns at a glance, not buried in rows
- Comprehensive tracking: Full financial picture (income, expenses, investments, goals)
- Decision support: KPI metrics and timeline adherence for goal planning

## Constraints

- **Cost**: Free hosting and services only — Vercel + Supabase free tiers
- **Platform**: Web application (desktop-first) — responsive for mobile browser
- **Language**: English UI — supports Indonesian text in user-defined data
- **Hosting**: Vercel (frontend) + Supabase (PostgreSQL + Auth)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| currency.js for monetary calculations | Avoids floating-point errors | ✓ Good — no precision bugs |
| IDR amounts stored as integers | No cents in Indonesian Rupiah | ✓ Good — clean data |
| Timezone-aware dates (Asia/Jakarta) | User in Indonesia | ✓ Good — no DST issues |
| SSR-safe localStorage abstraction | typeof window guards for Next.js | ✓ Good — no hydration errors |
| Uncontrolled form with FormData | Avoids re-renders on keystroke | ✓ Good — fast entry UX |
| Default category to 'Makan' | Most common expense type | ✓ Good — fastest daily workflow |
| Income form on History page | Income logging less frequent | ✓ Good — keeps dashboard clean |
| BOM prefix in CSV export | Excel compatibility for Indonesian chars | ✓ Good — opens cleanly in Excel |
| Recharts 3.7.0 for charts | React-idiomatic, SVG-based | ✓ Good — easy to style |
| Native select for time range | Simpler UX for 3-option control | ✓ Good — no dependency needed |
| Cookie-based sessions (@supabase/ssr) | httpOnly cookies prevent XSS | ✓ Good — secure by default |
| getUser() not getSession() | Server-validates tokens every request | ✓ Good — prevents spoofed sessions |
| UUID for transaction IDs | Matches Supabase defaults | ✓ Good — consistent |
| Indexes before RLS | Prevents slow queries at scale | ✓ Good — performance maintained |
| Database operations in client components | 'use client' allows async Supabase calls | ✓ Good — simple architecture |
| Migration verification with count matching | Prevents data loss | ✓ Good — safe migration |
| Goals: status_override field | Manual control over auto-inferred status | ✓ Good — user flexibility |
| Goals: monthly progress YYYY-MM unique constraint | Prevents duplicate entries | ✓ Good — clean data |
| Timeline table format over calendar/Gantt | Spreadsheet feel, side-by-side comparison | ✓ Good — clear and familiar |
| InsertGoalSchema.safeParse() before insert | Specific error messages vs generic failure | ✓ Good — fixed UAT blocker |

---
*Last updated: 2026-02-17 after v1.0 milestone*
