# Personal Finance Tracker

## What This Is

A personal finance tracker for daily expense logging, income tracking, and investment portfolio management. Provides visual dashboards and reports to help understand spending patterns and make better financial decisions. Web-based application for desktop use.

## Core Value

Quick daily expense logging with clear visualization of spending patterns. If everything else fails, logging an expense must be fast and seeing where money goes must be clear.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can log daily expenses with amount, category (Makan, Transportasi, Rokok, Belanja, Lainnya), and optional notes
- [ ] User can track income from single source
- [ ] User can track multiple investments with name, category (saham, emas, reksadana), monthly contribution amount, and current value
- [ ] User sees today's total spending on dashboard when opening the app
- [ ] User can view monthly summary showing total spent and breakdown by category
- [ ] User can view category trends showing how each expense category changes over time
- [ ] User can view yearly summary showing annual totals and averages
- [ ] User can compare current month spending vs previous months

### Out of Scope

- Budget setting and alerts — Deferred for future version (just tracking for now)
- Import from existing spreadsheet — Starting fresh, no historical data import needed
- Mobile native app — Web-first approach, responsive design is sufficient
- Multi-user support / sharing with spouse — Single user for v1, add sharing capability later
- Receipt scanning/upload — Simple text entry only for v1
- Payment method tracking — Category is sufficient for now
- Multiple income sources — Single income source sufficient for current needs

## Context

**Current situation:**
- Currently tracking finances in spreadsheets (Excel/Google Sheets)
- Main pain point: Hard to visualize patterns and trends in spreadsheet format
- Uses Indonesian category names for personal data
- Has existing expense categories and investment tracking needs

**User needs:**
- Fast entry: Open app → Fill form (amount, category, notes) → Save
- Visual clarity: See spending patterns at a glance, not buried in rows
- Comprehensive tracking: Not just expenses, but full financial picture (income, expenses, investments)
- Decision support: Understand spending to make better financial choices

**Investment tracking specifics:**
- Tracks multiple separate investments (stocks, gold, mutual funds)
- For each investment: name, category type, contribution amount, current portfolio value
- Monthly tracking of investment performance

## Constraints

- **Cost**: Free hosting and services only — No paid infrastructure or third-party services
- **Platform**: Web application (desktop-first) — Free mobile options are limited, so focusing on desktop web access
- **Language**: English UI — Application interface in English, but supports Indonesian text in user-defined categories
- **Hosting**: Must be deployable on free hosting platforms (Vercel, Netlify, or similar)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| — | — | — Pending |

---
*Last updated: 2026-02-14 after initialization*
