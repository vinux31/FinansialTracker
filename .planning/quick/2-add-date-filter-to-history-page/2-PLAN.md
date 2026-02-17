# Quick Task 2: Add Date Filter to History Page

## Goal

Add From/To date filter to Transaction History so user can view transactions in a specific date range.

## Approach

Client-side filter — all transactions already loaded in state. Add two date inputs (from/to), filter the rendered list. No backend changes needed.

## Tasks

- [ ] Task 1: Add dateFrom/dateTo state + filter UI (two date inputs + Clear button) to history/page.tsx
- [ ] Task 2: Apply filter to transaction list display + show result count

## Design

- Two `<input type="date">` fields: "From" and "To"
- Both optional — empty = no filter on that side
- Filter applied to `tx.date` (YYYY-MM-DD string comparison works correctly)
- "Clear" button resets both to empty
- Show "X transactions" count below filter
- Export CSV still exports ALL transactions (not just filtered view)
