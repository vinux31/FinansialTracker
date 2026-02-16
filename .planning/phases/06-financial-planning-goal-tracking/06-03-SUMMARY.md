---
phase: 06-financial-planning-goal-tracking
plan: 03
subsystem: goal-timeline-visualization
tags: [timeline, progress-tracking, calculations, status-inference, ui-components]

dependency_graph:
  requires: [phase-06-plan-01]
  provides: [timeline-visualization, progress-tracking-ui, goal-calculations, status-logic]
  affects: [goal-management, ui-layer]

tech_stack:
  added: [goal-calculations, status-inference, timeline-components]
  patterns: [useMemo-optimization, timezone-aware-dates, currency-precision, table-visualization]

key_files:
  created:
    - src/lib/goals/calculations.ts
    - src/lib/goals/status.ts
    - src/components/goals/timeline-view.tsx
    - src/components/goals/progress-modal.tsx
    - src/app/(dashboard)/goals/timeline/page.tsx
  modified: []

decisions:
  - decision: Timeline table format over calendar/Gantt chart
    rationale: Provides "spreadsheet feel" per user requirements - clear monthly breakdown, easy to scan, shows planned vs actual side-by-side
    alternatives: [calendar-view, gantt-chart, interactive-chart]
  - decision: useMemo for timeline data aggregation
    rationale: Follows chart-data.ts pattern - prevents re-aggregation on every render, optimizes performance with large goal/progress datasets
    alternatives: [no-optimization, custom-hook, react-query-cache]
  - decision: Color-coded actual vs planned (green/red)
    rationale: Instant visual feedback - green signals on-track progress, red signals under-saving, aligns with traffic light UX pattern
    alternatives: [neutral-colors, icon-indicators, percentage-badges]

patterns_established:
  - "Timeline aggregation: buildMonthlyTimeline creates month buckets from today forward, maps goals to deadline months, aggregates progress entries"
  - "Status inference: Hybrid approach - auto-infer from deadline/progress with user override support via status_override field"
  - "Risk calculation: Traffic light levels (LOW/MEDIUM/HIGH) based on progress vs expected trajectory"
  - "Currency safety: All monetary calculations use currency.js to prevent floating-point errors"
  - "Timezone consistency: Asia/Jakarta timezone for all date comparisons via TZDate"

metrics:
  duration_seconds: 198
  duration_minutes: 3
  tasks_completed: 4
  files_created: 5
  files_modified: 0
  commits: 4
  completed_date: 2026-02-16
---

# Phase 06 Plan 03: Timeline Visualization & Progress Tracking Summary

**One-liner:** Monthly timeline table showing goal deadlines and savings progress with timezone-aware status inference, currency-safe calculations, and useMemo optimization.

## What Was Built

Complete timeline visualization system for goal tracking with 12-month forward view, monthly progress comparison, and auto-status inference. Users can see when goals are due, track planned vs actual savings, and identify goals falling behind schedule.

### Calculation Utilities (calculations.ts)

**calculateGoalProgress:**
- Sums actual amounts from progress entries using currency.js
- Calculates percent complete (0-100%, capped at 100%)
- Computes months remaining to deadline
- Returns: totalSaved, percentComplete, monthsRemaining

**calculateSavingsRate:**
- Calculates percentage of income saved toward goals
- Filters progress entries for current month (YYYY-MM)
- Sums planned amounts, divides by monthly income
- Returns: savings rate as integer percentage

**buildMonthlyTimeline:**
- Creates 12-month timeline from today forward
- Initializes empty buckets for each month
- Maps goals to deadline months (YYYY-MM extraction)
- Aggregates progress entries by month (planned/actual sums)
- Returns: sorted array of monthly data structures

**Pattern:** Follows chart-data.ts aggregateByMonth pattern - currency.js for precision, month string extraction, reduce with currency safety.

### Status Inference Logic (status.ts)

**inferGoalStatus:**
- Completed: totalSaved >= target_amount (highest priority)
- Overdue: deadline passed and not completed
- In-progress: future deadline + totalSaved > 0
- Upcoming: future deadline + totalSaved = 0
- Uses TZDate with Asia/Jakarta timezone for deadline comparison

**getGoalStatus:**
- Checks status_override first (user manual control)
- Falls back to inferGoalStatus if no override
- Implements hybrid auto/manual approach per Phase 6 decisions

**getTimelineRisk:**
- Calculates expected progress (linear trajectory from created_at to deadline)
- Compares actual progress to expected progress
- LOW: >= 90% of expected (on track or ahead)
- MEDIUM: 60-90% of expected (somewhat behind)
- HIGH: < 60% of expected (significantly behind)

**Timezone:** Asia/Jakarta enforced via TZDate constant, matching existing date.ts pattern.

### Timeline Components

**TimelineView (timeline-view.tsx):**
- useMemo wrapper around buildMonthlyTimeline for performance
- Table format with 4 columns: Month | Planned Savings | Actual Savings | Goal Events
- Indonesian locale for month display (id-ID)
- Color coding: green if actual >= planned, red otherwise
- Goal events show inline with name + target amount
- Empty state: dash (—) for months with no goals

**ProgressModal (progress-modal.tsx):**
- Modal overlay with backdrop (fixed positioning, z-50)
- Form fields: planned_amount, actual_amount, notes (optional)
- FormData pattern matching expense-form.tsx
- Calls upsertGoalProgress with YYYY-MM month format
- Loading state disables submit button
- Success callback + close on save

### Timeline Page (timeline/page.tsx)

- Client component with useEffect data loading
- Fetches goals via getGoals() (ordered by deadline)
- Loads progress for all goals in loop (concatenates arrays)
- Loading state: "Loading timeline..."
- Empty state: "No goals to display" with helper text
- Main view: TimelineView in white card with shadow

**Layout:** max-w-6xl container, heading with subtitle, single table card.

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-16T08:24:52Z
- **Completed:** 2026-02-16T08:28:10Z
- **Tasks:** 4
- **Files created:** 5

## Task Commits

1. **Task 1: Goal calculation utilities** - `2947bd4` (feat)
2. **Task 2: Status inference logic** - `7f7fff1` (feat)
3. **Task 3: Timeline and modal components** - `f460382` (feat)
4. **Task 4: Timeline page** - `54e1bf3` (feat)

## Files Created

- `src/lib/goals/calculations.ts` - Goal progress calculations with currency.js precision
- `src/lib/goals/status.ts` - Status inference with timezone-aware date logic
- `src/components/goals/timeline-view.tsx` - Monthly timeline table with useMemo optimization
- `src/components/goals/progress-modal.tsx` - Progress logging form with FormData pattern
- `src/app/(dashboard)/goals/timeline/page.tsx` - Timeline page with loading/empty states

## Key Decisions Made

1. **Table format for timeline:** Chosen over calendar or Gantt chart to provide "spreadsheet feel" per user requirements. Table shows side-by-side planned vs actual, easy to scan, aligns with financial planning mental model.

2. **useMemo optimization:** Applied to buildMonthlyTimeline aggregation following chart-data.ts pattern. Prevents unnecessary re-computation when goals/progress data unchanged, critical for performance with many entries.

3. **Color-coded progress feedback:** Green for actual >= planned (meeting or exceeding targets), red for under-saving. Provides instant visual feedback without requiring user to compare numbers.

4. **Timezone consistency:** Asia/Jakarta enforced via TZDate for all deadline comparisons. Ensures status inference (overdue detection) works correctly across different server/client timezones.

5. **Currency.js everywhere:** All monetary calculations use currency.js to prevent floating-point errors. Follows established pattern from Phase 1 - critical for financial accuracy.

## Deviations from Plan

None - plan executed exactly as written. No bugs found, no blocking issues encountered, no architectural changes needed.

## Verification Results

**Calculations (Task 1):**
- calculateGoalProgress exports verified
- calculateSavingsRate exports verified
- buildMonthlyTimeline exports verified
- currency.js import confirmed

**Status Logic (Task 2):**
- inferGoalStatus exports verified
- getGoalStatus exports verified (with override support)
- getTimelineRisk exports verified
- Asia/Jakarta timezone constant confirmed

**Components (Task 3):**
- TimelineView uses useMemo wrapper confirmed
- buildMonthlyTimeline called inside useMemo
- ProgressModal uses FormData pattern confirmed
- upsertGoalProgress import and usage verified

**Page (Task 4):**
- getGoals() and getGoalProgress() imports verified
- useEffect data loading confirmed
- Loading and empty states present
- TimelineView integration verified

## Success Criteria Met

- User can view timeline page showing 12 months forward: YES (buildMonthlyTimeline generates 12 months from today)
- Timeline table displays monthly planned vs actual savings: YES (table columns show both with color coding)
- Goal events appear inline in deadline month: YES (goals array in month row, shows name + target)
- Actual savings color-coded: YES (green if >= planned, red if behind)
- Goal status infers from deadline and progress: YES (inferGoalStatus checks completed/overdue/in-progress/upcoming)
- User override preserved if set: YES (getGoalStatus checks status_override first)
- Timeline risk calculation uses traffic light levels: YES (getTimelineRisk returns LOW/MEDIUM/HIGH)
- All calculations use currency.js: YES (verified in calculations.ts)
- Date comparisons use Asia/Jakarta timezone: YES (TZDate with TIMEZONE constant in status.ts)

## Integration Notes

**Timeline page ready for navigation integration:**
- Route: /goals/timeline (Next.js app directory route)
- Add to navigation menu in src/components/navigation.tsx
- Link label: "Goal Timeline" or "Timeline"
- Icon suggestion: calendar or timeline icon

**Progress modal ready for integration:**
- Import ProgressModal in goal management UI
- Trigger on "Log Progress" button click
- Pass goal object and month string (YYYY-MM)
- Reload data in onSuccess callback

**Status utilities ready for goal list UI:**
- Use getGoalStatus(goal, totalSaved) to display badge
- Use getTimelineRisk(goal, totalSaved) for risk indicator
- Color coding: LOW=green, MEDIUM=yellow, HIGH=red

## Next Steps

Phase 06 Plan 04 will complete the goal management system with:
- Goal creation/edit/delete UI forms
- Goal list view with status/deadline badges
- Integration with navigation menu
- Monthly progress tracking interface
- Export functionality for goal data

## Self-Check: PASSED

**Created files verification:**
- src/lib/goals/calculations.ts: FOUND
- src/lib/goals/status.ts: FOUND
- src/components/goals/timeline-view.tsx: FOUND
- src/components/goals/progress-modal.tsx: FOUND
- src/app/(dashboard)/goals/timeline/page.tsx: FOUND

**Commits verification:**
- 2947bd4: FOUND
- 7f7fff1: FOUND
- f460382: FOUND
- 54e1bf3: FOUND

All files created, all commits exist, all exports verified. Timeline visualization complete and ready for integration.
