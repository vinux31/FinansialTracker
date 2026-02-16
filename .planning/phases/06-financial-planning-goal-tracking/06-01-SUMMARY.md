---
phase: 06-financial-planning-goal-tracking
plan: 01
subsystem: goal-tracking-foundation
tags: [database, schema, validation, crud, rls]

dependency_graph:
  requires: [phase-04-investment-portfolio-tracking]
  provides: [goals-table, progress-entries-table, goal-schemas, goal-crud-operations]
  affects: [database-layer, type-system]

tech_stack:
  added: [goal-tracking-tables, goal-validation-schemas]
  patterns: [rls-user-isolation, zod-validation, crud-with-ownership-verification]

key_files:
  created:
    - supabase/migrations/004_create_goals.sql
  modified:
    - src/lib/supabase/schema.ts
    - src/lib/db.ts
    - src/types/index.ts

decisions:
  - decision: Goals table uses status field with optional status_override for manual control
    rationale: Auto-inferred status from deadline/progress with user override capability provides flexibility
    alternatives: [fully-manual-status, fully-automatic-status]
  - decision: Monthly progress tracking uses YYYY-MM format with unique constraint on user_id+goal_id+month
    rationale: Prevents duplicate entries while allowing historical tracking and variance analysis
    alternatives: [daily-tracking, weekly-tracking]
  - decision: ON DELETE CASCADE for progress entries when goal deleted
    rationale: Progress data is meaningless without parent goal - automatic cleanup prevents orphaned records
    alternatives: [soft-delete, archive-progress-entries]

metrics:
  duration_seconds: 124
  duration_minutes: 2
  tasks_completed: 3
  files_created: 1
  files_modified: 3
  commits: 3
  completed_date: 2026-02-16
---

# Phase 06 Plan 01: Goal Tracking Foundation Summary

**One-liner:** PostgreSQL goals/progress tables with RLS policies, Zod validation schemas, and CRUD operations for authenticated multi-user goal tracking.

## What Was Built

Created complete database foundation for financial goal tracking following proven patterns from Phase 3 (transactions) and Phase 4 (investments). Provides multi-user goal storage with Row-Level Security, type-safe validation, and authenticated database operations.

### Database Migration (004_create_goals.sql)

**Goals table (11 columns):**
- Core fields: id, user_id, name, category, target_amount, deadline
- Status tracking: status (auto-inferred), status_override (manual control), priority
- Metadata: funding_notes, created_at, updated_at
- Constraints: UNIQUE(user_id, name) prevents duplicate goal names per user

**Goal progress entries table (8 columns):**
- Links: id, user_id, goal_id, month (YYYY-MM format)
- Tracking: planned_amount, actual_amount, notes
- Metadata: created_at, updated_at
- Constraints: UNIQUE(user_id, goal_id, month) ensures one entry per goal per month

**Performance indexes (7 total):**
- Goals: user_id, category, deadline, status (4 indexes)
- Progress: user_id, goal_id, month (3 indexes)
- Created BEFORE RLS per Phase 3 decision to prevent slow queries at scale

**RLS policies (8 total - 4 per table):**
- SELECT, INSERT, UPDATE, DELETE policies enforce auth.uid() = user_id
- Follows exact Phase 3/4 pattern for consistency across all tables

### Validation Layer (schema.ts)

**Constants:**
- GOAL_CATEGORIES: 7 Indonesian categories (Pernikahan, Kendaraan, Liburan, Pendidikan, Rumah, Dana Darurat, Lainnya)
- GOAL_PRIORITIES: High, Medium, Low
- GOAL_STATUSES: upcoming, in-progress, completed, overdue

**Schemas:**
- DatabaseGoalSchema: validates data from Supabase (12 fields including timestamps)
- InsertGoalSchema: validates goal creation with future deadline refinement
- UpdateGoalSchema: partial updates with status_override support
- DatabaseProgressEntrySchema: validates progress data from database (9 fields)
- InsertProgressEntrySchema: validates monthly progress entry (YYYY-MM format)

**Validation features:**
- Target amount must be positive integer (IDR)
- Goal name 1-100 characters
- Deadline must be future date
- Progress notes max 200 characters
- Funding notes max 500 characters

### CRUD Operations (db.ts)

**Goal operations:**
- getGoals(): fetch all user goals ordered by nearest deadline
- createGoal(): create goal with default 'upcoming' status
- updateGoal(): update with ownership verification and status_override support
- deleteGoal(): delete with ownership verification (cascades to progress entries)

**Progress tracking:**
- getGoalProgress(goalId): fetch progress entries for goal ordered by month (latest first)
- upsertGoalProgress(): create/update monthly entry using unique constraint

**Security:**
- All operations enforce authentication via getUserId()
- Update/delete operations verify ownership before modifying data
- RLS policies provide defense-in-depth alongside application-level checks

### Type System (types/index.ts)

**Goal interface:** 12 fields matching database schema
**ProgressEntry interface:** 9 fields matching progress_entries table

Both interfaces provide type safety for UI components.

## Deviations from Plan

None - plan executed exactly as written. No bugs found, no blocking issues encountered, no architectural changes needed.

## Verification Results

**Migration file structure:**
- 2 tables created (goals, goal_progress_entries)
- 7 indexes created (4 on goals, 3 on progress)
- 8 RLS policies created (4 per table)
- Follows Phase 3/4 pattern: indexes → ENABLE RLS → CREATE POLICY

**Zod schemas:**
- All constants exported (GOAL_CATEGORIES, GOAL_PRIORITIES, GOAL_STATUSES)
- Database schemas mirror database constraints
- Insert schemas validate user input with error messages
- Update schema supports partial updates and status_override

**CRUD operations:**
- All 6 operations implemented (getGoals, createGoal, updateGoal, deleteGoal, getGoalProgress, upsertGoalProgress)
- Ownership verification in update/delete operations
- getUserId() enforcement in all operations
- Upsert uses onConflict for unique constraint handling

**Type exports:**
- Goal interface matches all 12 database columns
- ProgressEntry interface matches all 9 database columns

## Key Decisions Made

1. **Status management approach:** Implemented dual-mode status system - auto-inferred status from deadline/progress data with optional status_override for manual control. Provides automation while preserving user agency.

2. **Progress tracking granularity:** Monthly tracking (YYYY-MM format) chosen over daily/weekly. Balances detail level with usability - financial goals typically tracked monthly aligned with income cycles.

3. **Cascade deletion strategy:** ON DELETE CASCADE for progress entries when goal deleted. Progress data meaningless without parent goal - automatic cleanup prevents orphaned records and maintains referential integrity.

4. **Category localization:** Indonesian category names (Pernikahan, Kendaraan, etc.) maintain consistency with existing transaction/investment categories. User is in Indonesia per Phase 1 decisions.

## Testing Recommendations

**Manual testing before UI implementation:**
1. Verify migration runs without errors (supabase db reset)
2. Test goal creation with various categories/priorities
3. Test unique constraint on user_id+name (duplicate goal names should fail)
4. Test progress entry upsert (create new, then update existing for same month)
5. Test RLS policies with multiple test users (ensure isolation)
6. Test deadline validation (past dates should be rejected)
7. Test cascade deletion (delete goal, verify progress entries deleted)

## Next Steps

Phase 06 Plan 02 will build the goal management UI components leveraging these CRUD operations. UI will provide:
- Goal creation form with category/priority selection
- Goal list view with status/deadline display
- Monthly progress tracking interface
- Goal edit/delete functionality

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 61be468 | feat(06-01): create goals and goal_progress_entries tables with RLS |
| 2 | 6561e86 | feat(06-01): add goal Zod schemas to schema.ts |
| 3 | 2684588 | feat(06-01): add goal CRUD operations to db.ts and Goal/ProgressEntry types |

## Self-Check: PASSED

**Created files verification:**
- supabase/migrations/004_create_goals.sql: FOUND

**Modified files verification:**
- src/lib/supabase/schema.ts: FOUND
- src/lib/db.ts: FOUND
- src/types/index.ts: FOUND

**Commits verification:**
- 61be468: FOUND
- 6561e86: FOUND
- 2684588: FOUND

All files created, all commits exist, all exports verified. Foundation ready for UI integration.
