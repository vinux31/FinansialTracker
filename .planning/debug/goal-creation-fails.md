---
status: diagnosed
trigger: "when try create goal. show error 'Failed to create goal'"
created: 2026-02-16T00:00:00Z
updated: 2026-02-16T00:00:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: createGoal() function missing getUserId() call or has authentication issue
test: examining form submission flow and database function
expecting: find missing auth check or incorrect field mapping
next_action: read GoalForm component and createGoal function

## Symptoms

expected: Fill goal form, submit, goal appears in list, form resets
actual: Form submission shows error "Failed to create goal"
errors: "Failed to create goal"
reproduction: Fill goal form and submit
started: Current issue in phase 06

## Eliminated

## Evidence

- timestamp: 2026-02-16T00:01:00Z
  checked: src/components/goals/goal-form.tsx lines 23-37
  found: Form collects data and calls createGoal() without validation
  implication: No client-side schema validation before submission

- timestamp: 2026-02-16T00:02:00Z
  checked: src/lib/db.ts lines 446-472 (createGoal function)
  found: No validation schema check, unlike createInvestment (lines 265-280)
  implication: Missing InsertGoalSchema validation before database insert

- timestamp: 2026-02-16T00:03:00Z
  checked: src/lib/supabase/schema.ts lines 120-130
  found: InsertGoalSchema exists with validation rules including deadline future check
  implication: Schema is defined but not being used

- timestamp: 2026-02-16T00:04:00Z
  checked: Comparison with createInvestment (db.ts lines 253-315)
  found: createInvestment validates with InsertInvestmentSchema.safeParse() and throws on failure
  implication: createGoal is missing this validation step entirely

- timestamp: 2026-02-16T00:05:00Z
  checked: supabase/migrations/004_create_goals.sql line 15
  found: UNIQUE(user_id, name) constraint in database
  implication: Duplicate goal names will fail silently with generic "Failed to create goal" error

## Resolution

root_cause: createGoal() function in db.ts lacks schema validation and specific error handling, causing validation failures or constraint violations to throw generic "Failed to create goal" error instead of specific feedback
fix: Add InsertGoalSchema.safeParse() validation before insert (like createInvestment does) and improve error messages for constraint violations
verification: N/A (diagnosis-only mode)
files_changed: ['src/lib/db.ts']
