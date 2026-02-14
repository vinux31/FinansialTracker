# Roadmap: Personal Finance Tracker

## Overview

This roadmap delivers a personal finance tracker in five phases, starting with fast expense entry and clear visualization, then adding authentication for multi-device sync, investment portfolio tracking, and enhanced features. Each phase builds on proven patterns (append-only ledgers, pre-aggregated dashboards) to work within free hosting constraints while delivering daily-use value from Phase 1 onward.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Core Tracking** - Fast expense entry with monthly summaries and CSV export
- [ ] **Phase 2: Dashboard & Visualization** - Visual insights with charts and transaction management
- [ ] **Phase 3: Authentication & Multi-Device Sync** - Cross-device access with user accounts
- [ ] **Phase 4: Investment Portfolio Tracking** - Track investments alongside expenses
- [ ] **Phase 5: Enhanced Tracking Features** - Yearly summaries, trends, budgets, and quality-of-life improvements

## Phase Details

### Phase 1: Foundation & Core Tracking
**Goal**: Enable daily expense and income tracking with minimal friction
**Depends on**: Nothing (first phase)
**Requirements**: CORE-01 through CORE-10 (expense entry, income logging, transaction history, monthly summary, CSV export, proper date handling, decimal amounts, append-only ledger, fixed categories, today's spending view)
**Success Criteria** (what must be TRUE):
  1. User can log an expense in under 5 seconds (amount, category, optional notes)
  2. User sees today's total spending immediately when opening the app
  3. User can view monthly summary showing total spent and breakdown by category (Makan, Transportasi, Rokok, Belanja, Lainnya)
  4. User can view complete transaction history with all entries
  5. User can export all data as CSV for backup or analysis
**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md — Project scaffolding, types, and core libraries
- [x] 01-02-PLAN.md — Expense form and today's spending view
- [x] 01-03-PLAN.md — Income form, transaction history, monthly summary, CSV export
- [x] 01-04-PLAN.md — Integration verification checkpoint

### Phase 2: Dashboard & Visualization
**Goal**: Add visual insights and transaction management capabilities
**Depends on**: Phase 1 (needs transactions before visualizations)
**Requirements**: VIZ-01 through VIZ-06 (pre-aggregated dashboard, visual category breakdown, month-to-month comparison, edit transactions, delete transactions, performance optimization for 500+ transactions)
**Success Criteria** (what must be TRUE):
  1. User sees visual charts showing spending breakdown by category
  2. User can compare current month spending against previous months
  3. User can edit existing transactions to correct mistakes
  4. User can delete incorrect transactions
  5. Dashboard loads in under 2 seconds even with 500+ transactions
**Plans**: 4 plans

Plans:
- [ ] 02-01-PLAN.md — Category breakdown chart with Recharts and data aggregation
- [ ] 02-02-PLAN.md — Trend comparison chart with time range selector
- [ ] 02-03-PLAN.md — Edit and delete transactions on Today page
- [ ] 02-04-PLAN.md — Phase verification checkpoint

### Phase 3: Authentication & Multi-Device Sync
**Goal**: Enable cross-device access with secure user authentication
**Depends on**: Phase 2 (needs working app before adding multi-user)
**Requirements**: AUTH-01 through AUTH-04 (user authentication via Supabase Auth, multi-device data sync, secure per-user data access, migration from single-user to multi-user schema)
**Success Criteria** (what must be TRUE):
  1. User can create an account and log in with email/password
  2. User can access their data from multiple devices (desktop, mobile browser)
  3. User's data remains private and isolated from other users
  4. User's existing data migrates successfully from localStorage to authenticated account
**Plans**: TBD

Plans:
- [ ] TBD during phase planning

### Phase 4: Investment Portfolio Tracking
**Goal**: Track investment portfolio alongside expenses for complete financial picture
**Depends on**: Phase 3 (needs auth for multi-user data isolation)
**Requirements**: INV-01 through INV-06 (add investment entry with name/category/amount/value, investment categories for Saham/Emas/Reksadana, view portfolio with current values, edit/update investment values, investment summary in monthly view, include investments in CSV export)
**Success Criteria** (what must be TRUE):
  1. User can add new investments with name, category, monthly contribution, and current value
  2. User can view complete investment portfolio showing all investments and their current values
  3. User can update investment values as portfolios change
  4. User sees investment summary alongside expense summary in monthly view
  5. User can export investments as part of CSV data export
**Plans**: TBD

Plans:
- [ ] TBD during phase planning

### Phase 5: Enhanced Tracking Features
**Goal**: Quality-of-life improvements and advanced insights for long-term users
**Depends on**: Phase 4 (builds on complete tracking foundation)
**Requirements**: ENH-01 through ENH-07 (yearly summary with annual totals, category trend visualization over time, recurring expense templates, budget limits per category, budget alerts when approaching limits, dark mode, quick-entry keyboard shortcuts)
**Success Criteria** (what must be TRUE):
  1. User can view yearly summary showing annual totals and month-by-month averages
  2. User can see category trends visualized over time to understand spending patterns
  3. User can save recurring expenses as templates for quick re-entry (rent, subscriptions)
  4. User can set budget limits per category and see progress against limits
  5. User receives alerts when approaching budget limits
**Plans**: TBD

Plans:
- [ ] TBD during phase planning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Core Tracking | 4/4 | Complete | 2026-02-14 |
| 2. Dashboard & Visualization | 0/4 | Planned | - |
| 3. Authentication & Multi-Device Sync | 0/? | Not started | - |
| 4. Investment Portfolio Tracking | 0/? | Not started | - |
| 5. Enhanced Tracking Features | 0/? | Not started | - |
