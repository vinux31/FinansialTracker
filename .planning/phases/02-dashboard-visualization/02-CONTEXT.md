# Phase 2: Dashboard & Visualization - Context

**Gathered:** 2026-02-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Add visual insights (charts showing spending patterns) and transaction management (edit/delete capabilities) to the existing expense tracker. This phase builds on Phase 1's core tracking to provide data visualization and correction tools.

Scope:
- Visual charts for category spending breakdown
- Month-to-month spending trends and comparisons
- Edit existing transactions to correct mistakes
- Delete incorrect transactions
- Performance optimization for 500+ transactions (< 2 seconds load time)

</domain>

<decisions>
## Implementation Decisions

### Chart Types & Visualization Style
- **Chart type**: Claude's discretion (choose best fit for category breakdown visualization)
- **Color scheme**: Fixed colors per category
  - Each category (Makan, Transportasi, Rokok, Belanja, Lainnya) gets a consistent color
  - Colors remain the same across all views for visual consistency
- **Interactivity**: Legend toggle only
  - User can click legend to hide/show specific categories
  - Keep it simple - no hover tooltips or click-to-drill-down
- **Placement**: Monthly page only
  - Category breakdown chart appears on Monthly page
  - Today page stays simple and focused on quick entry

### Comparison View Layout
- **Format**: Timeline/trend line visualization
  - Line chart showing spending trends over multiple months
- **Data displayed**:
  - Total spending per month (primary trend line)
  - Income vs Expense (two separate lines for comparison)
- **Time range**: User selectable
  - Dropdown to choose: 3 months, 6 months, or 12 months
  - User controls how far back to look
- **Additional metrics**:
  - Percentage change vs previous month (e.g., "+15%" or "-10%")
  - Average spending across selected time range

### Edit/Delete Transaction UX
- **Access point**: Today's transaction list only
  - Edit and delete buttons available only on Today page
  - Users can only modify today's transactions
- **Button placement**: Three-dot menu (⋮)
  - Menu icon on each transaction row
  - Click menu → reveals edit and delete options
- **Edit flow**: Modal/Dialog
  - Clicking "Edit" opens a modal popup with edit form
  - Form pre-filled with transaction data
  - Save or Cancel actions in modal
- **Delete confirmation**: Simple browser confirm dialog
  - Native `confirm()` dialog: "Are you sure you want to delete this transaction?"
  - Quick and straightforward - balance between safety and speed

### Empty States & Data Display
- **Empty chart state**: Placeholder message
  - Show friendly message: "No data yet. Start by adding an expense!"
  - Include illustration to guide new users
- **Limited data handling**: Show what we have
  - Display trend line even with only 1-2 months of data
  - No minimum threshold - user sees insights from day one
- **Default sorting**: Newest first
  - Transaction list sorted with most recent at top
  - Consistent with Today page behavior
- **Monthly page content**:
  - Summary cards at top (Total expense, Total income, Net amount)
  - Category breakdown chart (visual spending distribution)
  - Trend comparison (multi-month trend line)
  - NO full transaction list on Monthly page (that's on History page)

### Claude's Discretion
- Specific chart library selection (Recharts, Chart.js, etc.)
- Exact color palette values (as long as colors are fixed per category)
- Loading skeleton design while charts render
- Error state handling and retry logic
- Exact spacing, typography, and visual polish
- Performance optimization techniques for 500+ transactions

</decisions>

<specifics>
## Specific Ideas

- Monthly page should provide visual insights at a glance - charts and summary, not detailed lists
- Edit/delete functionality scoped to today only prevents accidental changes to historical data
- Trend lines should be informative even with minimal data - don't hide insights behind arbitrary thresholds

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-dashboard-visualization*
*Context gathered: 2026-02-14*
