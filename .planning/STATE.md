# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-14)

**Core value:** Quick daily expense logging with clear visualization of spending patterns. If everything else fails, logging an expense must be fast and seeing where money goes must be clear.
**Current focus:** Phase 4 - Investment Portfolio Tracking

## Current Position

Phase: 4 of 5 (Investment Portfolio Tracking)
Plan: 1 of 4 in current phase
Status: In Progress
Last activity: 2026-02-16 — Completed Phase 4 Plan 1 (04-01 Database Foundation)

Progress: [██████████████████] 68%

## Performance Metrics

**Velocity:**
- Total plans completed: 14
- Average duration: 7.1 min
- Total execution time: 1.6 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-core-tracking | 4 | 25 min | 6.25 min |
| 02-dashboard-visualization | 4 | 17 min | 4.25 min |
| 03-authentication-multi-device-sync | 5 | 55 min | 11.0 min |
| 04-investment-portfolio-tracking | 1 | 1 min | 1.0 min |

**Recent Trend:**
- Last 5 plans: 03-02 (6 min), 03-03 (6 min), 03-04 (<1 min), 03-05 (1 min), 04-01 (1 min)
- Note: Phase 03-04 skipped verification by user request
- Note: Phase 03-05 gap closure plan - surgical React Hooks fix
- Note: Phase 04-01 fast execution - foundational schema work only

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| Phase 03-authentication-multi-device-sync P04 | <1min | 1 tasks | 0 files |
| Phase 03 P05 | 1 | 1 tasks | 1 files |
| Phase 04-investment-portfolio-tracking P01 | 1 min | 3 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

1. **Using currency.js for all monetary calculations** - Avoids floating-point errors, critical for financial accuracy
2. **IDR amounts stored as integers** - Indonesian Rupiah has no cents, enforced via Zod validation
3. **Timezone-aware date handling with Asia/Jakarta** - User is in Indonesia, all date/time operations use proper timezone
4. **Append-only transaction storage pattern** - Immutable ledger approach for Phase 1
5. **SSR-safe localStorage abstraction** - All storage functions guard with typeof window checks
6. **Uncontrolled form with FormData for expense entry** - Avoids re-renders on every keystroke, better performance
7. **Default category to 'Makan' for fastest entry** - Most common expense type enables type-amount-enter workflow
- [Phase 01-03]: Income form placed on history page rather than main dashboard (income logging is less frequent)
- [Phase 01-03]: BOM prefix in CSV export for Excel compatibility with Indonesian category names
- [Phase 01-04]: Removed root src/app/page.tsx to fix routing - Next.js route groups require no conflicting root page
- [Project]: PWA deployment strategy chosen for mobile access - free, works on iOS/Android, installable from browser
- [Phase 02-01]: Recharts 3.7.0 chosen for chart visualization - React-idiomatic, SVG-based for CSS styling
- [Phase 02-01]: Fixed category color palette for visual consistency across all views
- [Phase 02-01]: useMemo pattern for data aggregation to optimize 500+ transaction performance
- [Phase 02-02]: Native select for time range instead of shadcn Select - simpler UX for 3-option control
- [Phase 02-02]: Percentage change color coding inverted - red for increase (more spending is bad)
- [Phase 02-02]: Chart components are self-contained with own data loading and state management
- [Phase 02-03]: Breaking append-only ledger pattern for edit/delete - user explicitly requested transaction modification capability
- [Phase 02-03]: Edit/delete limited to Today page only - modification only for today's entries, not historical data
- [Phase 02-03]: Native confirm() for delete confirmation - simple, accessible, follows browser UX patterns
- [Phase 02-03]: Transaction type is read-only in edit modal - cannot change expense to income (different schemas)
- [Phase 02-04]: Phase 2 verified complete - all charts, edit/delete, and performance meet requirements
- [Phase 03-01]: Cookie-based sessions over localStorage - Using @supabase/ssr with httpOnly cookies prevents XSS token theft
- [Phase 03-01]: getUser() instead of getSession() - Middleware validates tokens with Supabase Auth server on every request
- [Phase 03-01]: UUID for transaction IDs - Changed from string to UUID to match Supabase defaults
- [Phase 03-01]: Indexes before RLS - Created user_id indexes in schema migration before enabling RLS to prevent slow queries at scale
- [Phase 03-02]: Client-side auth functions - Auth helpers use browser Supabase client for forms, separate from server-side validation
- [Phase 03-02]: Password minimum 8 characters - Prevents weak passwords with confirmation validation
- [Phase 03-02]: Email verification required - Users must verify email before dashboard access
- [Phase 03-02]: Server-side route protection - Layout calls getUser() server-side to prevent flash of protected content
- [Phase 03-03]: Database operations in client components - Using 'use client' directive for db.ts allows async Supabase calls
- [Phase 03-03]: Migration verification with count matching - Batch insert → count verification → localStorage clear prevents data loss
- [Phase 03-03]: Migration detector in layout - Automatic check on dashboard mount redirects users to migration page seamlessly
- [Phase 03-03]: Preserved storage.ts for migration - Keeping getTransactions() allows migration page to read localStorage data
- [Phase 03-03]: getUserId() authentication helper - All database operations require authenticated user context, enforcing user_id filtering
- [Phase 03-03]: Loading states on all operations - Prevents UI flicker and provides user feedback during async database calls
- [Phase 03-authentication-multi-device-sync]: User chose to skip comprehensive end-to-end verification test suite — Phase 3 implementation complete but unverified - manual testing recommended before production
- [Phase 04-01]: Investments table follows exact transactions table pattern (RLS, indexes, constraints) — Proven pattern from Phase 3 ensures consistency and maintainability
- [Phase 04-01]: Category constraint at database level prevents invalid investment types — Defense-in-depth: database CHECK constraint enforces valid categories alongside Zod validation

### Pending Todos

- Add date picker to expense form for logging past expenses (.planning/todos/pending/2026-02-15-add-date-picker-to-expense-form-for-logging-past-expense.md)

### Roadmap Evolution

- Phase 6 added: Financial Planning & Goal Tracking (generic goal-based planning system)

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-16
Stopped at: Completed 04-01-PLAN.md (Database Foundation)
Resume file: None
Next action: Phase 4 Plan 1 complete. Database foundation established with investments table, RLS policies, and CRUD operations. Continue with 04-02 to build investment entry UI and portfolio list page.
