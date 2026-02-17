---
status: diagnosed
trigger: "Investigate React Hooks order violation in MonthlyPage component causing crashes in Phase 3."
created: 2026-02-15T00:00:00Z
updated: 2026-02-15T00:02:30Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED - useMemo is called AFTER early return on line 58-67, violating Rules of Hooks
test: code inspection complete
expecting: confirmed root cause
next_action: document root cause and fix recommendations

## Symptoms

expected: All hooks should be called in same order every render (5 useState, 2 useEffect, 1 useMemo)
actual: Hook order changes between renders - useMemo appears as position 8 in some renders, undefined in others
errors: "React has detected a change in the order of Hooks called by MonthlyPage"
reproduction: Run UAT tests 14 and 15
started: Phase 3 implementation

## Eliminated

## Evidence

- timestamp: 2026-02-15T00:01:00Z
  checked: MonthlyPage component structure (lines 21-175)
  found: Early return statement at lines 58-67 that returns JSX when !summary
  implication: This early return happens BEFORE useMemo at line 72

- timestamp: 2026-02-15T00:01:30Z
  checked: Hook call order in component
  found: |
    Line 22-26: 5 useState hooks
    Line 28-44: useEffect #1
    Line 46-56: useEffect #2
    Line 58-67: EARLY RETURN when !summary (conditional!)
    Line 72-74: useMemo (only called if summary exists)
  implication: useMemo is conditionally executed based on summary state

- timestamp: 2026-02-15T00:02:00Z
  checked: React error stack trace
  found: "Previous render" shows 7 hooks (5 useState + 2 useEffect), "Next render" shows 8 hooks (adds useMemo)
  implication: First render has !summary, returns early (7 hooks). Second render has summary, reaches useMemo (8 hooks). This violates Rules of Hooks.

## Resolution

root_cause: |
  The useMemo hook at line 72 is called AFTER a conditional early return at line 58-67.

  When summary is null (first render or while loading), the component returns early at line 58,
  calling only 7 hooks (5 useState + 2 useEffect).

  When summary exists (after data loads), the component continues past line 67 and calls useMemo
  at line 72, totaling 8 hooks (5 useState + 2 useEffect + 1 useMemo).

  This violates the Rules of Hooks: "Don't call Hooks inside loops, conditions, or nested functions."
  All hooks must be called in the same order on every render.

fix: |
  Move useMemo hook BEFORE the early return statement (before line 58).

  Recommended fix:
  1. Move lines 68-74 (const net, hasData, and useMemo) to BEFORE line 58
  2. The useMemo can safely be called even when summary is null - it will just return empty data
  3. Update useMemo dependencies if needed to handle null summary case

  Alternative fix:
  1. Remove the early return entirely
  2. Conditionally render the loading state within the main return statement
  3. This ensures all hooks are always called

  The first approach (moving useMemo up) is simpler and more surgical.

verification: |
  After fix:
  1. Run UAT tests 14 and 15 - should pass without hook order errors
  2. Verify component renders correctly in both loading and loaded states
  3. Check that category data displays properly when summary exists

files_changed:
  - src/app/(dashboard)/monthly/page.tsx
