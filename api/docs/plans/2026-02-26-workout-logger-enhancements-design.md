# Workout Logger UI Enhancements Design

**Goal:** Add three enhancements to the existing WorkoutLogger: program title/notes display, manual rest timer trigger per exercise, and exercise swap with persist-to-program via a three-dot menu.

**Approved mockup:** `/web/mockup-workout-enhancements.html`

---

## Architecture

All three features build on existing infrastructure. The WorkoutProgram model already has `name` and `description` fields. ProgramExercise already has `rest_seconds`. The existing API endpoints for updating program exercises (`PATCH /api/v1/workout_programs/:id/program_exercises/:id`) support swapping exercise_id. No new API endpoints or database migrations are needed.

**Frontend-only changes** in `/web/src/pages/WorkoutLogger.jsx` plus one new API hook for exercise search/swap.

---

## Enhancement 1: Program Title + Collapsible Notes

**Data source:** `useWorkoutSession(id)` already returns `workout_program` data including `name` and `description`.

**Component:** New `ProgramHeader` section rendered between the sticky header and exercise cards.

**Behavior:**
- Display program name as a large heading
- Show program description/notes with a 3-line collapse (CSS `max-height` + gradient fade)
- "See more" / "See less" toggle button
- If no program (ad-hoc workout), don't render this section

---

## Enhancement 2: Manual Rest Timer Trigger

**Data source:** ProgramExercise `rest_seconds` is already available per exercise in the session data.

**Component:** New `RestTrigger` row inside each `ExerciseCard`, between the header and set table.

**Behavior:**
- Shows "Rest between each set" with the configured rest duration (e.g., "90s")
- Tapping starts the existing `RestTimerBanner` with that exercise's rest_seconds
- Uses the same rest timer state (`restSeconds`, `restExercise`) already in WorkoutLogger
- This is a manual trigger — the auto-trigger on set completion continues to work as before

---

## Enhancement 3: Exercise Swap + Three-Dot Menu

**Component:** Three-dot menu button (`...`) in each `ExerciseCard` header, with a dropdown containing:
- **Swap Exercise** — opens exercise search modal, replaces exercise in current session AND updates the program template
- **Remove Exercise** — removes exercise from current session (with confirmation)

**Swap flow:**
1. User taps "Swap Exercise" → modal with exercise search (using existing `useExercises(search, muscleGroup)` hook)
2. User selects new exercise
3. Frontend calls existing `PATCH /api/v1/workout_programs/:id/program_exercises/:pe_id` with new `exercise_id` to persist to program
4. Frontend updates local session state to replace the exercise across all sets for that exercise
5. Toast confirmation: "Swapped to [New Exercise Name]"

**Remove flow:**
1. User taps "Remove Exercise" → confirmation dialog
2. Removes exercise card from current session view (deletes associated session_sets)
3. Does NOT remove from program template (only swap persists to program)

---

## Files to Modify

- `/web/src/pages/WorkoutLogger.jsx` — All three features (ProgramHeader section, RestTrigger row, MenuDropdown + SwapModal)
- `/web/src/api/hooks.js` — Add `useUpdateProgramExercise` hook if not already present
- No backend changes needed

---

## Key Decisions

- **Swap persists to program, remove does not** — Swap changes the program template so future sessions use the new exercise. Remove only affects the current session.
- **Rest timer trigger is manual** — It supplements the existing auto-trigger (which fires on set completion), giving users a way to start rest before/between exercises.
- **No new API endpoints** — Everything uses existing CRUD endpoints for program_exercises and session_sets.
