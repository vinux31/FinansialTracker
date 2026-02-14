# Requirements

## Milestone Goal

**Build a personal finance tracker** that makes daily expense logging fast (<5 seconds) with clear visualization of spending patterns. Users should use it daily, understand where money goes, and make better financial decisions.

## Success Criteria

- [ ] User logs expenses in under 5 seconds
- [ ] User can see today's spending at a glance
- [ ] User can view monthly spending breakdown by category
- [ ] User can track income and investments alongside expenses
- [ ] User can export all data as CSV
- [ ] Application runs on 100% free hosting (Vercel + Supabase)

## Scope

### Phase 1: Foundation & Core Tracking (MVP)

**Goal:** Enable daily expense and income tracking with minimal friction

**In scope:**
- [ ] Quick expense entry form (amount, category, optional notes)
- [ ] Income logging (single source)
- [ ] Today's spending summary view
- [ ] Monthly summary (total spent + breakdown by category)
- [ ] Transaction history list (view all entries)
- [ ] CSV export (all data)
- [ ] Fixed expense categories: Makan, Transportasi, Rokok, Belanja, Lainnya
- [ ] Proper date handling (timezone-aware, DST-safe)
- [ ] Decimal-based monetary amounts (no floating-point errors)
- [ ] Append-only transaction ledger (data integrity)

**Out of scope:**
- Authentication/multi-device sync (Phase 3)
- Charts and visualizations (Phase 2)
- Edit/delete transactions (Phase 2)
- Investment tracking (Phase 4)
- Custom categories (deferred)

### Phase 2: Dashboard & Visualization

**Goal:** Add visual insights and transaction management

**In scope:**
- [ ] Pre-aggregated dashboard with charts
- [ ] Visual spending breakdown by category
- [ ] Month-to-month comparison
- [ ] Edit transaction capability
- [ ] Delete transaction capability
- [ ] Performance optimization for 500+ transactions

**Out of scope:**
- Yearly view (Phase 5)
- Category trends (Phase 5)
- Advanced filtering

### Phase 3: Authentication & Multi-Device Sync

**Goal:** Enable cross-device access with user authentication

**In scope:**
- [ ] User authentication (Supabase Auth)
- [ ] Multi-device data sync
- [ ] Secure data access per user
- [ ] Migration from single-user to multi-user schema

**Out of scope:**
- Multi-user sharing (future v2.0)
- Social features
- Collaboration

### Phase 4: Investment Portfolio Tracking

**Goal:** Track investment portfolio alongside expenses

**In scope:**
- [ ] Add investment entry (name, category, amount, current value)
- [ ] Investment categories: Saham (stocks), Emas (gold), Reksadana (mutual funds)
- [ ] View investment portfolio with current values
- [ ] Edit/update investment values
- [ ] Investment summary in monthly view
- [ ] Include investments in CSV export

**Out of scope:**
- Real-time stock price APIs (manual entry only)
- Automated portfolio updates
- Historical performance tracking

### Phase 5: Enhanced Tracking Features

**Goal:** Quality-of-life improvements and advanced insights

**In scope:**
- [ ] Yearly summary (annual totals and averages)
- [ ] Category trend visualization over time
- [ ] Recurring expense templates (save common expenses for quick re-entry)
- [ ] Budget limits per category
- [ ] Budget alerts when approaching limits
- [ ] Dark mode
- [ ] Quick-entry keyboard shortcuts

**Out of scope:**
- Receipt scanning
- Bank account sync
- AI categorization
- Multi-currency support
- Offline mode

## Constraints

**Technical:**
- Must use 100% free hosting (Vercel + Supabase free tiers)
- Must handle 500+ transactions without performance issues
- Serverless function timeout: 10 seconds max
- Database limit: 500MB (Supabase free tier)

**Legal:**
- Must provide CSV export (CFPB Personal Financial Data Rights Rule, April 1, 2026)

**UX:**
- Expense entry must be under 5 seconds (retention critical)
- English UI with support for Indonesian category names

**Cost:**
- Zero paid services or APIs
- No ongoing infrastructure costs

## Non-Functional Requirements

**Performance:**
- Dashboard load time: <2 seconds
- Expense entry: <5 seconds
- CSV export: <10 seconds for 1000 transactions

**Data Integrity:**
- No floating-point monetary amounts (use integer cents or Decimal)
- Proper timezone handling for dates (no DST bugs)
- Append-only transaction ledger (preserve audit trail)

**Security:**
- User data isolated per account (Phase 3+)
- Secure authentication via Supabase Auth
- No sensitive data in client-side code

**Privacy:**
- User owns their data
- Full data export available
- No third-party data sharing

## Out of Scope (All Phases)

**Explicitly not building:**
- Automatic bank account syncing (expensive, privacy concerns)
- Real-time cryptocurrency tracking (API costs)
- AI-powered categorization (complexity, accuracy issues)
- Multi-user collaboration/sharing (single-user focus)
- Mobile native apps (web-first, responsive design sufficient)
- Receipt photo upload/scanning (storage costs)
- Historical data import from spreadsheets (starting fresh)
- Multiple income sources (single source sufficient)
- Payment method tracking (category sufficient)
- Budgeting features in MVP (deferred to Phase 5)

## Dependencies

**Phase dependencies:**
- Phase 2 requires Phase 1 (need transactions before visualizations)
- Phase 3 required before Phase 4 (investments need auth for multi-user data isolation)
- Phase 5 requires Phase 1-4 (enhanced features build on core)

**External dependencies:**
- Next.js 16 + React 19
- Supabase (PostgreSQL + Auth)
- Vercel hosting
- Recharts or shadcn/ui charts
- date-fns for date handling

## Validation Checkpoints

**Phase 1 validation:**
- User logs 10+ expenses in first week
- Sub-5 second entry time achieved
- CSV export works correctly
- No date/time bugs reported

**Phase 2 validation:**
- Dashboard loads in <2 seconds with 100+ transactions
- Charts clearly show spending patterns
- Users successfully edit mistakes

**Phase 3 validation:**
- Multi-device sync works reliably
- Authentication flow is smooth
- No data loss during migration

**Phase 4 validation:**
- Investment tracking matches expense entry speed
- Portfolio values update correctly
- Users find investment view useful

**Phase 5 validation:**
- Users utilize at least 2 of 3 enhanced features
- Budget alerts reduce overspending
- Recurring templates save time

---
*Created: 2026-02-14 after research phase*
