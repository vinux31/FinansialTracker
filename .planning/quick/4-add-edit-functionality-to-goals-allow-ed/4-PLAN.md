---
phase: quick-4
plan: 4
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/goals/goal-row.tsx
autonomous: true

must_haves:
  truths:
    - "Each goal row has an Edit button"
    - "Clicking Edit opens a modal pre-filled with that goal's current deadline and target amount"
    - "Submitting the form updates the goal and closes the modal"
    - "The goal list refreshes to show the updated values after save"
  artifacts:
    - path: "src/components/goals/goal-row.tsx"
      provides: "Edit button + inline edit modal using GoalForm"
  key_links:
    - from: "src/components/goals/goal-row.tsx"
      to: "src/components/goals/goal-form.tsx"
      via: "GoalForm rendered with goal prop inside modal"
      pattern: "<GoalForm goal=\\{goal\\}"
    - from: "src/components/goals/goal-form.tsx"
      to: "src/lib/db.ts updateGoal"
      via: "updateGoal called when goal prop is present"
      pattern: "updateGoal"
---

<objective>
Add an Edit button to each goal row that opens an inline modal containing the existing GoalForm pre-filled with the goal's data. On save, the modal closes and the goal list refreshes.

Purpose: Users can change a goal's deadline and target amount without deleting and recreating it.
Output: Modified goal-row.tsx with Edit button, modal state, and GoalForm integration.
</objective>

<execution_context>
@C:/Users/rinoa/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/rinoa/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/goals/goal-row.tsx
@src/components/goals/goal-form.tsx
@src/lib/db.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Edit button and modal to GoalRow</name>
  <files>src/components/goals/goal-row.tsx</files>
  <action>
In goal-row.tsx, add edit functionality:

1. Add `editing` boolean state (useState(false)) alongside the existing `deleting` state.

2. Add an "Edit" button in the button group (alongside the existing Delete button):
   ```tsx
   <button
     onClick={() => setEditing(true)}
     className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 border border-blue-600 rounded"
   >
     Edit
   </button>
   ```
   Place it BEFORE the Delete button so the order is Edit | Delete.

3. Import GoalForm at the top:
   ```tsx
   import { GoalForm } from './goal-form'
   ```

4. Render an inline modal when `editing` is true. Place it AFTER the main card div (as a sibling/overlay), using a fixed-position backdrop:
   ```tsx
   {editing && (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
       <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
         <div className="flex items-center justify-between mb-4">
           <h2 className="text-xl font-semibold">Edit Goal</h2>
           <button
             onClick={() => setEditing(false)}
             className="text-gray-500 hover:text-gray-700 text-xl font-bold"
             aria-label="Close"
           >
             ×
           </button>
         </div>
         <GoalForm
           goal={goal}
           onSuccess={() => {
             setEditing(false)
             onUpdate()
           }}
         />
       </div>
     </div>
   )}
   ```

5. Wrap the entire return in a React Fragment (`<>...</>`) so the modal can be a sibling to the card div without a wrapper element.

Note: GoalForm already handles `goal` prop for editing and calls `updateGoal` from db.ts. The `onUpdate` prop already exists on GoalRow — GoalList passes `() => window.location.reload()` which is sufficient for refresh. No changes needed to GoalList, GoalForm, db.ts, or the page.
  </action>
  <verify>
Run `npx tsc --noEmit` from the project root — zero type errors.
Navigate to /goals in the browser, click "Edit" on any goal, verify the modal opens with fields pre-filled, change target amount or deadline, click "Update Goal", confirm modal closes and list refreshes with new values.
  </verify>
  <done>
Edit button appears on every goal row. Clicking it opens a modal pre-filled with that goal's name, category, target amount, deadline, priority, and funding notes. Saving updates the goal in Supabase and the list refreshes to show the changed values.
  </done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with no errors
- Edit button visible on each goal card
- Modal opens with correct pre-filled data
- Updating deadline or target amount persists to Supabase (check by refreshing the page manually)
- Cancel (×) button closes modal without saving
</verification>

<success_criteria>
User can click Edit on any goal, change the deadline and/or target amount, save, and see the updated values reflected in the goal list without a full page reload aside from the triggered onUpdate.
</success_criteria>

<output>
After completion, create `.planning/quick/4-add-edit-functionality-to-goals-allow-ed/4-SUMMARY.md`
</output>
