---
created: 2026-02-15T09:36:10.137Z
title: Add date picker to expense form for logging past expenses
area: ui
files:
  - src/components/expense-form.tsx
  - src/app/(dashboard)/today/page.tsx
---

## Problem

Currently, the expense form only logs expenses for today's date. Users need the ability to log expenses from previous days (e.g., yesterday's expense that they forgot to log).

This limitation means if users forget to log an expense on the day it happened, they either:
1. Can't log it at all, or
2. Have to log it with today's date, which skews their daily/monthly reports

User request during Phase 2 verification: "can u add a feature that can setting date expense, in menu today. so i can add expenses yesterday"

## Solution

Add a date input field to the expense form (src/components/expense-form.tsx) with:
- Default value: today's date (current behavior)
- Allow selection of past dates (not future dates to prevent data entry errors)
- Use proper timezone handling (Asia/Jakarta) consistent with existing date-fns usage
- Update transaction storage to use the selected date instead of always using new Date()
- Consider UX: date picker should be optional/collapsible to maintain fast entry for today's expenses

Technical approach:
- Add date input field (HTML5 date input or date picker library)
- Update form submission handler to use selected date
- Ensure transaction sorting still works correctly in history views
- Test that monthly summaries aggregate correctly with backdated transactions
