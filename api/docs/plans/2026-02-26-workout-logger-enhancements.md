# Workout Logger UI Enhancements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add program title/notes display, manual rest timer trigger, and exercise swap/remove three-dot menu to the WorkoutLogger.

**Architecture:** All changes are frontend-only. The existing Rails API already supports everything we need — `WorkoutProgram` has `name`/`description`, `ProgramExercise` has `rest_seconds` and accepts `exercise_id` updates via PATCH. We add one new React Query hook (`useUpdateProgramExercise`) and modify `WorkoutLogger.jsx` to add three new UI sections.

**Tech Stack:** React 19, Tailwind CSS v4, Framer Motion, React Query (TanStack Query)

**Reference mockup:** `/web/mockup-workout-enhancements.html`

---

### Task 1: Add `useUpdateProgramExercise` hook

**Files:**
- Modify: `web/src/api/hooks.js:78-87` (after `useReorderExercises`)

**Step 1: Add the hook**

Add this after `useReorderExercises` (line 87) in `web/src/api/hooks.js`:

```javascript
export function useUpdateProgramExercise(programId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ programExerciseId, ...data }) =>
      api.patch(`/workout_programs/${programId}/program_exercises/${programExerciseId}`, {
        program_exercise: data,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workoutProgram', programId] });
      qc.invalidateQueries({ queryKey: ['workoutSessions'] });
    },
  });
}
```

**Step 2: Verify no syntax errors**

Run: `cd /Users/joegrady/Development/projects/grokfit/web && npx vite build --mode development 2>&1 | head -20`
Expected: No errors (or only warnings)

**Step 3: Commit**

```bash
git add web/src/api/hooks.js
git commit -m "feat: add useUpdateProgramExercise hook for exercise swap"
```

---

### Task 2: Add Program Header with collapsible notes

**Files:**
- Modify: `web/src/pages/WorkoutLogger.jsx:711-750` (render section, between sticky header and exercise cards)

**Step 1: Add ProgramHeader section**

In `WorkoutLogger.jsx`, add a `notesExpanded` state near the other useState hooks (around line 630):

```javascript
const [notesExpanded, setNotesExpanded] = useState(false);
```

Then in the render section, after the sticky header closing `</div>` (line 750) and before the exercise cards `<div className="space-y-4 mt-4">` (line 766), add:

```jsx
{/* Program title + notes */}
{session?.workout_program && (
  <div className="mt-4 -mx-4 px-4">
    <h2 className="text-xl font-extrabold text-gray-50 leading-tight mb-2">
      {session.workout_program.name}
    </h2>
    {session.workout_program.description && (
      <>
        <div
          className={`text-sm leading-relaxed text-gray-400 relative ${
            !notesExpanded ? 'max-h-[4.8em] overflow-hidden' : ''
          }`}
        >
          {session.workout_program.description}
          {!notesExpanded && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-dark-900 to-transparent" />
          )}
        </div>
        <button
          onClick={() => setNotesExpanded((prev) => !prev)}
          className="text-sm font-medium text-cyan-400 mt-1"
        >
          {notesExpanded ? 'See less' : 'See more'}
        </button>
      </>
    )}
  </div>
)}
```

**Step 2: Verify build**

Run: `cd /Users/joegrady/Development/projects/grokfit/web && npx vite build --mode development 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add web/src/pages/WorkoutLogger.jsx
git commit -m "feat: add program title and collapsible notes to workout logger"
```

---

### Task 3: Add manual rest timer trigger to ExerciseCard

**Files:**
- Modify: `web/src/pages/WorkoutLogger.jsx` — `ExerciseCard` component (lines 253-457)

**Step 1: Add `onStartRest` prop to ExerciseCard**

Update the `ExerciseCard` function signature (line 253) to accept `onStartRest`:

```javascript
function ExerciseCard({
  programExercise,
  allSessionSets,
  sessionId,
  createSetMutation,
  onSetCompleted,
  onStartRest,
  refetch,
}) {
```

**Step 2: Add rest trigger UI**

In the ExerciseCard render, after the exercise header `</div>` (line 401) and before the set table `<div>` (line 404), add:

```jsx
{/* Manual rest timer trigger */}
<button
  onClick={() => onStartRest(exercise?.name, restSeconds)}
  className="w-full flex items-center justify-between px-3 py-2 mb-1
             bg-cyan-500/[0.04] border border-cyan-500/10 rounded-[10px]
             active:bg-cyan-500/[0.08] active:border-cyan-500/20 transition-colors"
>
  <div className="flex items-center gap-2 text-cyan-400 text-[13px] font-medium">
    <svg className="w-5 h-5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    Rest between each set
  </div>
  <span className="flex items-center gap-1.5 font-mono text-[13px] font-semibold text-cyan-400
                    bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/15">
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
    {restSeconds}s
  </span>
</button>
```

**Step 3: Pass `onStartRest` from WorkoutLogger to ExerciseCard**

In the main WorkoutLogger component's render where `ExerciseCard` is rendered (around line 768), add the prop:

```jsx
<ExerciseCard
  key={pe.id || idx}
  programExercise={pe}
  allSessionSets={allSets}
  sessionId={programId}
  createSetMutation={createSet}
  onSetCompleted={handleSetCompleted}
  onStartRest={handleSetCompleted}
  refetch={refetch}
/>
```

Note: `onStartRest` reuses `handleSetCompleted` which already calls `setRestTimer({ exerciseName, seconds: restSeconds })` — same signature, same behavior.

**Step 4: Verify build**

Run: `cd /Users/joegrady/Development/projects/grokfit/web && npx vite build --mode development 2>&1 | head -20`
Expected: No errors

**Step 5: Commit**

```bash
git add web/src/pages/WorkoutLogger.jsx
git commit -m "feat: add manual rest timer trigger button to exercise cards"
```

---

### Task 4: Add three-dot menu with Swap Exercise and Remove Exercise

This is the most complex task. It adds:
- A three-dot `...` menu button to each exercise card header
- A dropdown with "Swap Exercise" and "Remove Exercise" options
- An exercise search modal for swap
- Swap persists to the workout program template

**Files:**
- Modify: `web/src/pages/WorkoutLogger.jsx` — ExerciseCard header + new modal + WorkoutLogger state
- Modify: `web/src/api/hooks.js` (import the new hook in WorkoutLogger)

**Step 1: Add imports and state to WorkoutLogger**

At the top of `WorkoutLogger.jsx`, update the hooks import (line 4-10):

```javascript
import {
  useWorkoutSession,
  useCreateSet,
  useUpdateSet,
  useDeleteSet,
  useCompleteWorkout,
  useUpdateProgramExercise,
  useExercises,
} from '../api/hooks';
```

**Step 2: Add `ExerciseMenu` dropdown component**

Add this new component after the `SetRow` component (after line 249) and before the `ExerciseCard` component:

```jsx
// ─── Exercise Menu (three-dot dropdown) ──────────────────

function ExerciseMenu({ onSwap, onRemove }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-400
                   hover:bg-dark-700 rounded-lg transition-colors shrink-0"
        aria-label="Exercise options"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1 bg-dark-700 border border-dark-500
                       rounded-xl p-1 min-w-[180px] shadow-xl shadow-black/40 z-50"
          >
            <button
              onClick={() => { setOpen(false); onSwap(); }}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-gray-300
                         hover:bg-dark-600 rounded-lg text-left transition-colors"
            >
              <svg className="w-[18px] h-[18px] opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Swap Exercise
            </button>
            <button
              onClick={() => { setOpen(false); onRemove(); }}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-red-400
                         hover:bg-dark-600 rounded-lg text-left transition-colors"
            >
              <svg className="w-[18px] h-[18px] opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Remove Exercise
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Step 3: Add `ExerciseSwapModal` component**

Add this after the `ExerciseMenu` component:

```jsx
// ─── Exercise Swap Modal ─────────────────────────────────

function ExerciseSwapModal({ currentExercise, muscleGroup, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const { data: exercises, isLoading } = useExercises(search, '');
  const exerciseList = Array.isArray(exercises) ? exercises : exercises?.exercises || [];

  // Filter out current exercise
  const filtered = exerciseList.filter((e) => e.id !== currentExercise?.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-dark-800 border border-dark-600/50 rounded-t-2xl sm:rounded-2xl w-full max-w-md
                   max-h-[70vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-600/50">
          <h3 className="text-base font-bold text-gray-100">Swap Exercise</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300 rounded-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises..."
            autoFocus
            className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2.5 text-sm text-gray-100
                       placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
        </div>

        {/* Exercise list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No exercises found</p>
          ) : (
            filtered.map((ex) => {
              const mgColor = MUSCLE_GROUP_COLORS[ex.muscle_group] || 'bg-gray-400/15 text-gray-400 border-gray-400/20';
              return (
                <button
                  key={ex.id}
                  onClick={() => onSelect(ex)}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-lg
                             hover:bg-dark-700 active:bg-dark-600 transition-colors text-left"
                >
                  <span className="text-sm font-medium text-gray-200">{ex.name}</span>
                  {ex.muscle_group && (
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${mgColor} shrink-0 ml-2`}>
                      {ex.muscle_group}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
```

**Step 4: Add swap/remove props and menu to ExerciseCard**

Update `ExerciseCard` signature to accept new props:

```javascript
function ExerciseCard({
  programExercise,
  allSessionSets,
  sessionId,
  createSetMutation,
  onSetCompleted,
  onStartRest,
  onSwapExercise,
  onRemoveExercise,
  refetch,
}) {
```

Replace the exercise header div (around line 391-401) with:

```jsx
{/* Exercise header */}
<div className="flex items-center justify-between">
  <div className="flex items-center gap-2 min-w-0">
    <h3 className="text-base font-bold text-gray-100 truncate">{exercise?.name}</h3>
    {exercise?.muscle_group && (
      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${mgColor} shrink-0`}>
        {exercise.muscle_group}
      </span>
    )}
  </div>
  <ExerciseMenu
    onSwap={() => onSwapExercise(programExercise)}
    onRemove={() => onRemoveExercise(programExercise)}
  />
</div>
```

This replaces the old `<span className="text-xs text-gray-500 font-mono shrink-0 ml-2">{restSeconds}s rest</span>` — rest time is now shown in the rest trigger row instead.

**Step 5: Add swap/remove state and handlers to WorkoutLogger**

In the main `WorkoutLogger` component, add state and handlers. After the `restTimer` state (around line 630):

```javascript
const [swapTarget, setSwapTarget] = useState(null); // programExercise being swapped
const programId_num = session?.workout_program?.id;
const updateProgramExercise = useUpdateProgramExercise(programId_num);
```

Add handler functions after `handleSaveAndExit` (around line 678):

```javascript
const handleSwapExercise = useCallback((programExercise) => {
  setSwapTarget(programExercise);
}, []);

const handleSwapSelect = useCallback(async (newExercise) => {
  if (!swapTarget) return;
  try {
    // Persist swap to program template
    if (programId_num && swapTarget.id) {
      await updateProgramExercise.mutateAsync({
        programExerciseId: swapTarget.id,
        exercise_id: newExercise.id,
      });
    }
    // Delete existing session sets for the old exercise, then refetch
    // The next session load will show the new exercise
    await refetch();
    toast.success(`Swapped to ${newExercise.name}`);
  } catch (err) {
    toast.error(err.message || 'Failed to swap exercise');
  }
  setSwapTarget(null);
}, [swapTarget, programId_num, updateProgramExercise, refetch]);

const handleRemoveExercise = useCallback((programExercise) => {
  const exercise = programExercise.exercise || programExercise;
  if (!window.confirm(`Remove ${exercise?.name} from this workout?`)) return;

  // Delete all session sets for this exercise
  const exerciseId = programExercise.exercise_id || exercise?.id;
  const setsToDelete = allSets.filter((s) => s.exercise_id === exerciseId);
  Promise.all(
    setsToDelete.map((s) =>
      api.delete(`/workout_sessions/${programId}/session_sets/${s.id}`)
    )
  ).then(() => {
    refetch();
    toast.success(`Removed ${exercise?.name}`);
  }).catch(() => {
    toast.error('Failed to remove exercise');
  });
}, [allSets, programId, refetch]);
```

Note: You'll need to import `api` from the client:

```javascript
import { api } from '../api/client';
```

**Step 6: Pass new props to ExerciseCard in render**

Update the ExerciseCard render (around line 768) to pass the new props:

```jsx
<ExerciseCard
  key={pe.id || idx}
  programExercise={pe}
  allSessionSets={allSets}
  sessionId={programId}
  createSetMutation={createSet}
  onSetCompleted={handleSetCompleted}
  onStartRest={handleSetCompleted}
  onSwapExercise={handleSwapExercise}
  onRemoveExercise={handleRemoveExercise}
  refetch={refetch}
/>
```

**Step 7: Add swap modal to render**

After the `AnimatePresence` block for the rest timer (around line 763) and before the exercise cards, add:

```jsx
{/* Swap exercise modal */}
<AnimatePresence>
  {swapTarget && (
    <ExerciseSwapModal
      key="swap-modal"
      currentExercise={swapTarget.exercise || swapTarget}
      muscleGroup={swapTarget.exercise?.muscle_group}
      onSelect={handleSwapSelect}
      onClose={() => setSwapTarget(null)}
    />
  )}
</AnimatePresence>
```

**Step 8: Verify build**

Run: `cd /Users/joegrady/Development/projects/grokfit/web && npx vite build --mode development 2>&1 | head -20`
Expected: No errors

**Step 9: Commit**

```bash
git add web/src/pages/WorkoutLogger.jsx
git commit -m "feat: add three-dot menu with exercise swap and remove"
```

---

### Task 5: Manual testing and polish

**Step 1: Start the dev servers**

```bash
# Terminal 1 - API
cd /Users/joegrady/Development/projects/grokfit/api && bin/rails server

# Terminal 2 - Frontend
cd /Users/joegrady/Development/projects/grokfit/web && npm run dev
```

**Step 2: Test each feature**

1. Start a workout from a program → verify program title and description appear
2. Click "See more" / "See less" → verify notes expand/collapse with gradient
3. Click the rest timer trigger on an exercise card → verify rest timer banner appears
4. Click the three-dot menu → verify dropdown appears and closes on outside click
5. Click "Swap Exercise" → verify modal appears with exercise search
6. Search for an exercise → verify results appear
7. Select an exercise → verify toast confirmation and exercise updates
8. Click "Remove Exercise" → verify confirmation dialog and exercise removed

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: polish workout logger enhancements"
```
