# Phase 6: Financial Planning & Goal Tracking - Context

**Gathered:** 2026-02-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable users to create and track multi-goal financial plans with timelines, funding sources, and progress monitoring. Users can plan for multiple financial goals (wedding, house, education, car, travel, etc.) by defining goals with target amounts and deadlines, specifying funding sources (savings, investments, income), viewing monthly timeline showing cashflow projections, and tracking progress against targets.

This phase delivers a **generic goal-based financial planning system** that works for any life goals, not just specific scenarios.

</domain>

<decisions>
## Implementation Decisions

### Goal Structure & Management
- **Core fields:** Keep it simple - name (text), target amount (integer IDR), deadline (date)
- **Categories:** Predefined list - Wedding, Vehicle, Travel, Education, Home, Emergency Fund, Other
- **Priority system:** High / Medium / Low labels (not numeric 1/2/3)
- **Status lifecycle:** Hybrid approach - system auto-sets status based on progress & deadline (upcoming, in-progress, completed, overdue), but user can manually override

### Timeline Visualization
- **Time granularity:** Monthly only - no weekly or custom date ranges for MVP
- **Event markers:** Inline in month row - show event name + amount in the month it happens (e.g., "NIKAH Rp 100jt")
- **Cashflow representation:** Stacked categories - break down income sources (salary, bonus) and expense types (goal expenses, savings, asset liquidation, loan payments) in the timeline
- **Display format:** Claude's discretion - choose between calendar/Gantt, monthly table, or interactive chart based on best UX

### Funding Sources & Liquidation
- **Funding specification:** Free-form text notes per goal - simple text field like "Sell reksadana" or "Monthly savings from salary Rp 4.5jt"
- **Liquidation scheduling:** Auto-suggest timing - system calculates when to liquidate funding sources based on goal deadlines and total funding needed
- **Multiple sources per goal:** Yes - each goal can list multiple funding sources (e.g., "Wedding = Reksadana Rp 77jt + Emas Rp 13jt + Savings Rp 10jt")
- **Actual vs planned tracking:** Yes via manual entry - user updates "Actually saved Rp 5jt this month (planned Rp 4.5jt)"

### Progress Tracking & KPIs
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

</decisions>

<specifics>
## Specific Ideas

- Goal categories should align with common Indonesian life events: Wedding (Pernikahan), Vehicle (Kendaraan), Travel (Liburan), Education (Pendidikan), Home (Rumah), Emergency Fund (Dana Darurat)
- Timeline should feel like a planning spreadsheet - clear monthly breakdown, easy to scan
- Risk indicators inspired by traffic lights: green = on track, yellow = warning, red = critical
- Keep it simple for MVP - users can always extend with more features later

</specifics>

<deferred>
## Deferred Ideas

- **Loan tracking integration:** Track monthly loan payments (car, house) as recurring expenses in the plan. Decision: Keep simple for MVP - loans can be represented as recurring monthly expenses in timeline. Dedicated loan tracking (principal, interest calculation, amortization schedule) can be separate phase if needed.
- **Investment portfolio integration:** Direct linking between Phase 4 investments and Phase 6 goals (e.g., mark BMRI stock as "HOLD for this goal"). Decision: MVP uses free-form text for funding sources. Deep integration with investment module can come later.
- **Debt-to-income ratio KPI:** Calculate monthly debt / income percentage with warning thresholds. Decision: Not selected for core KPIs. Can add later if users track loans.

None — discussion stayed focused on core financial planning capabilities.

</deferred>

---

*Phase: 06-financial-planning-goal-tracking*
*Context gathered: 2026-02-16*
