import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useWorkoutSession,
  useCreateSet,
  useUpdateSet,
  useDeleteSet,
  useCompleteWorkout,
} from '../api/hooks';
import Card from '../components/Card';
import toast from 'react-hot-toast';

// ─── Helpers ────────────────────────────────────────────────

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.15, 0.3].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.value = 0.3;
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.1);
    });
  } catch {
    // Web Audio not supported
  }
}

function triggerHaptic() {
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
}

const MUSCLE_GROUP_COLORS = {
  chest: 'bg-red-400/15 text-red-400 border-red-400/20',
  back: 'bg-blue-400/15 text-blue-400 border-blue-400/20',
  shoulders: 'bg-amber-400/15 text-amber-400 border-amber-400/20',
  legs: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20',
  arms: 'bg-purple-400/15 text-purple-400 border-purple-400/20',
  core: 'bg-orange-400/15 text-orange-400 border-orange-400/20',
  cardio: 'bg-pink-400/15 text-pink-400 border-pink-400/20',
};

// ─── Rest Timer Banner (non-blocking) ──────────────────────

function RestTimerBanner({ seconds, exerciseName, onComplete, onSkip }) {
  const [duration] = useState(seconds);
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          playBeep();
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [onComplete]);

  const handleSkip = () => {
    clearInterval(intervalRef.current);
    onSkip?.();
  };

  const handleAdd30 = () => {
    setRemaining((r) => r + 30);
  };

  const pct = duration > 0 ? remaining / duration : 0;

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -60, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="sticky top-[57px] z-30 bg-dark-700 border-b border-dark-600/50"
    >
      {/* Progress bar background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-cyan-500/10"
          initial={{ width: '100%' }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>

      <div className="relative flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl font-mono font-bold text-cyan-400 tabular-nums">
            {formatCountdown(remaining)}
          </span>
          <span className="text-sm text-gray-400 truncate">{exerciseName}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAdd30}
            className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-dark-600 rounded-lg
                       active:bg-dark-500 transition-colors min-h-[36px]"
          >
            +30s
          </button>
          <button
            onClick={handleSkip}
            className="px-3 py-1.5 text-xs font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20
                       rounded-lg active:bg-cyan-500/20 transition-colors min-h-[36px]"
          >
            Skip
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Set Row ───────────────────────────────────────────────

function SetRow({
  setNumber,
  previousSet,
  weight,
  reps,
  completed,
  isPersisting,
  onWeightChange,
  onRepsChange,
  onComplete,
}) {
  return (
    <div
      className={`grid grid-cols-[40px_1fr_1fr_1fr_48px] gap-1 items-center px-2 py-1.5 rounded-lg transition-colors ${
        completed ? 'bg-cyan-500/8' : ''
      }`}
    >
      {/* SET number */}
      <span className="text-sm font-mono text-gray-500 text-center">{setNumber}</span>

      {/* PREVIOUS */}
      <span className="text-sm font-mono text-gray-600 text-center truncate">
        {previousSet ? `${previousSet.weight} x ${previousSet.reps}` : '--'}
      </span>

      {/* WEIGHT input with +/- buttons */}
      <div className="flex items-center justify-center gap-0.5">
        <button
          onClick={() => onWeightChange(Math.max(0, (parseFloat(weight) || 0) - 5))}
          disabled={completed}
          className="w-7 h-10 flex items-center justify-center text-xs font-bold text-gray-400
                     active:text-cyan-400 disabled:opacity-30 transition-colors"
          aria-label="Decrease weight by 5"
        >
          -
        </button>
        <input
          type="number"
          inputMode="decimal"
          value={weight}
          onChange={(e) => onWeightChange(e.target.value)}
          disabled={completed}
          className="w-14 text-center text-base font-mono font-bold bg-dark-700 border border-dark-500
                     rounded-md py-1.5 text-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50
                     disabled:opacity-50 disabled:bg-dark-800 min-h-[40px]
                     [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          onClick={() => onWeightChange((parseFloat(weight) || 0) + 5)}
          disabled={completed}
          className="w-7 h-10 flex items-center justify-center text-xs font-bold text-gray-400
                     active:text-cyan-400 disabled:opacity-30 transition-colors"
          aria-label="Increase weight by 5"
        >
          +
        </button>
      </div>

      {/* REPS input */}
      <div className="flex items-center justify-center">
        <input
          type="number"
          inputMode="numeric"
          value={reps}
          onChange={(e) => onRepsChange(e.target.value)}
          disabled={completed}
          className="w-14 text-center text-base font-mono font-bold bg-dark-700 border border-dark-500
                     rounded-md py-1.5 text-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50
                     disabled:opacity-50 disabled:bg-dark-800 min-h-[40px]
                     [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </div>

      {/* CHECK button */}
      <div className="flex items-center justify-center">
        <button
          onClick={onComplete}
          disabled={completed || isPersisting}
          className={`w-11 h-11 rounded-lg flex items-center justify-center transition-all
            ${
              completed
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'bg-dark-700 border border-dark-500 text-gray-500 active:bg-cyan-500/10 active:text-cyan-400 active:border-cyan-500/30'
            }
            disabled:cursor-not-allowed
          `}
          aria-label={completed ? 'Set completed' : 'Complete set'}
        >
          {isPersisting ? (
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Exercise Card ─────────────────────────────────────────

function ExerciseCard({
  programExercise,
  allSessionSets,
  sessionId,
  createSetMutation,
  onSetCompleted,
  onStartRest,
  refetch,
}) {
  const exercise = programExercise.exercise || programExercise;
  const exerciseId = programExercise.exercise_id || exercise?.id;
  const targetSets = programExercise.target_sets || 3;
  const targetReps = programExercise.target_reps || 10;
  const restSeconds = programExercise.rest_seconds || 90;
  const previousSets = programExercise.previous_sets || [];
  const mgColor = MUSCLE_GROUP_COLORS[exercise?.muscle_group] || 'bg-gray-400/15 text-gray-400 border-gray-400/20';

  // Get persisted sets for this exercise
  const persistedSets = useMemo(
    () => allSessionSets.filter((s) => s.exercise_id === exerciseId),
    [allSessionSets, exerciseId]
  );

  // Local set state: each row has { weight, reps, completed, persistedId, isPersisting }
  const [localSets, setLocalSets] = useState(() => {
    const rows = [];
    for (let i = 0; i < targetSets; i++) {
      const persisted = persistedSets[i];
      const previous = previousSets[i];
      rows.push({
        weight: persisted?.weight ?? previous?.weight ?? '',
        reps: persisted?.reps ?? targetReps,
        completed: !!persisted,
        persistedId: persisted?.id || null,
        isPersisting: false,
      });
    }
    return rows;
  });

  // Sync persisted sets back into local state when API data changes
  useEffect(() => {
    setLocalSets((prev) => {
      const next = [...prev];
      for (let i = 0; i < next.length; i++) {
        const persisted = persistedSets[i];
        if (persisted && !next[i].persistedId) {
          next[i] = {
            ...next[i],
            completed: true,
            persistedId: persisted.id,
            isPersisting: false,
          };
        }
      }
      return next;
    });
  }, [persistedSets]);

  const handleWeightChange = (idx, value) => {
    setLocalSets((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], weight: value };
      return next;
    });
  };

  const handleRepsChange = (idx, value) => {
    setLocalSets((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], reps: value };
      return next;
    });
  };

  const handleCompleteSet = async (idx) => {
    const set = localSets[idx];
    if (set.completed || set.isPersisting) return;

    triggerHaptic();

    // Mark as persisting
    setLocalSets((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], isPersisting: true };
      return next;
    });

    try {
      await createSetMutation.mutateAsync({
        sessionId,
        exercise_id: exerciseId,
        weight_lbs: parseFloat(set.weight) || 0,
        reps: parseInt(set.reps) || 0,
        set_number: idx + 1,
      });
      await refetch();

      setLocalSets((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], completed: true, isPersisting: false };
        return next;
      });

      // Fire callback to start rest timer
      onSetCompleted(exercise?.name, restSeconds);
    } catch (err) {
      toast.error(err.message || 'Failed to log set');
      setLocalSets((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], isPersisting: false };
        return next;
      });
    }
  };

  const handleAddSet = () => {
    const previous = previousSets[localSets.length];
    setLocalSets((prev) => [
      ...prev,
      {
        weight: previous?.weight ?? (prev.length > 0 ? prev[prev.length - 1].weight : ''),
        reps: previous?.reps ?? targetReps,
        completed: false,
        persistedId: null,
        isPersisting: false,
      },
    ]);
  };

  const completedCount = localSets.filter((s) => s.completed).length;
  const allDone = completedCount === localSets.length;

  return (
    <Card
      animate={false}
      className={`space-y-3 ${allDone ? 'border-emerald-500/20' : ''}`}
    >
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
        <span className="text-xs text-gray-500 font-mono shrink-0 ml-2">{restSeconds}s rest</span>
      </div>

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

      {/* Set table */}
      <div>
        {/* Column headers */}
        <div className="grid grid-cols-[40px_1fr_1fr_1fr_48px] gap-1 px-2 pb-1">
          <span className="text-[10px] font-semibold text-gray-500 uppercase text-center">Set</span>
          <span className="text-[10px] font-semibold text-gray-500 uppercase text-center">Previous</span>
          <span className="text-[10px] font-semibold text-gray-500 uppercase text-center">Lbs</span>
          <span className="text-[10px] font-semibold text-gray-500 uppercase text-center">Reps</span>
          <span className="text-[10px] font-semibold text-gray-500 uppercase text-center flex justify-center">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </span>
        </div>

        {/* Set rows */}
        <div className="space-y-1">
          {localSets.map((set, idx) => (
            <SetRow
              key={idx}
              setNumber={idx + 1}
              previousSet={previousSets[idx] || null}
              weight={set.weight}
              reps={set.reps}
              completed={set.completed}
              isPersisting={set.isPersisting}
              onWeightChange={(val) => handleWeightChange(idx, val)}
              onRepsChange={(val) => handleRepsChange(idx, val)}
              onComplete={() => handleCompleteSet(idx)}
            />
          ))}
        </div>
      </div>

      {/* Add set */}
      <button
        onClick={handleAddSet}
        className="w-full py-2 text-sm font-medium text-cyan-400 hover:text-cyan-300
                   active:bg-cyan-500/5 rounded-lg transition-colors min-h-[44px]"
      >
        + Add Set
      </button>

      {/* Completion indicator */}
      {allDone && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs font-medium text-emerald-400">All sets complete</span>
        </div>
      )}
    </Card>
  );
}

// ─── Post-Workout Summary ──────────────────────────────────

function WorkoutSummary({ session, exercises, allSets, elapsed, onSave, isSaving }) {
  const totalVolume = allSets.reduce((sum, s) => sum + ((s.weight_lbs || s.weight || 0) * (s.reps || 0)), 0);
  const durationMin = Math.floor(elapsed / 60);
  const exercisesDone = new Set(allSets.map((s) => s.exercise_id)).size;

  // Detect personal records: any set where weight > previous max weight for same exercise and reps
  const personalRecords = useMemo(() => {
    const prs = [];
    exercises.forEach((pe) => {
      const ex = pe.exercise || pe;
      const exId = pe.exercise_id || ex?.id;
      const previousSets = pe.previous_sets || [];
      const currentSets = allSets.filter((s) => s.exercise_id === exId);

      currentSets.forEach((cs) => {
        const prevMax = previousSets
          .filter((ps) => ps.reps >= (cs.reps || 0))
          .reduce((max, ps) => Math.max(max, ps.weight || 0), 0);
        const currentWeight = cs.weight_lbs || cs.weight || 0;
        if (prevMax > 0 && currentWeight > prevMax) {
          prs.push({
            exercise: ex?.name,
            weight: currentWeight,
            reps: cs.reps,
            prevWeight: prevMax,
          });
        }
      });
    });
    return prs;
  }, [exercises, allSets]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-dark-900/95 backdrop-blur-sm overflow-y-auto"
    >
      <div className="min-h-full flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', damping: 20 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Success icon */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', damping: 15 }}
              className="w-20 h-20 rounded-full bg-emerald-400/20 flex items-center justify-center mx-auto mb-4"
            >
              <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-100">Workout Complete</h1>
            <p className="text-sm text-gray-500 mt-1">
              {session?.workout_program?.name || session?.program_name || 'Great session'}
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-dark-800 border border-dark-600/50 rounded-xl p-4 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Duration</p>
              <p className="text-2xl font-mono font-bold text-gray-100 mt-1">{durationMin}<span className="text-sm text-gray-500 ml-1">min</span></p>
            </div>
            <div className="bg-dark-800 border border-dark-600/50 rounded-xl p-4 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Volume</p>
              <p className="text-2xl font-mono font-bold text-gray-100 mt-1">{totalVolume.toLocaleString()}<span className="text-sm text-gray-500 ml-1">lbs</span></p>
            </div>
            <div className="bg-dark-800 border border-dark-600/50 rounded-xl p-4 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Sets</p>
              <p className="text-2xl font-mono font-bold text-gray-100 mt-1">{allSets.length}</p>
            </div>
            <div className="bg-dark-800 border border-dark-600/50 rounded-xl p-4 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Exercises</p>
              <p className="text-2xl font-mono font-bold text-gray-100 mt-1">{exercisesDone}</p>
            </div>
          </div>

          {/* Personal Records */}
          {personalRecords.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-4 space-y-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-lg">&#9733;</span>
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wide">Personal Records</h3>
              </div>
              {personalRecords.map((pr, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{pr.exercise}</span>
                  <span className="font-mono text-amber-400">
                    {pr.weight} lbs x {pr.reps}
                    <span className="text-gray-500 ml-1">(was {pr.prevWeight})</span>
                  </span>
                </div>
              ))}
            </motion.div>
          )}

          {/* Exercise breakdown */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Breakdown</h3>
            {exercises.map((pe) => {
              const ex = pe.exercise || pe;
              const exId = pe.exercise_id || ex?.id;
              const exSets = allSets.filter((s) => s.exercise_id === exId);
              const vol = exSets.reduce((sum, s) => sum + ((s.weight_lbs || s.weight || 0) * (s.reps || 0)), 0);
              return (
                <div
                  key={pe.id || ex?.id}
                  className="flex items-center justify-between bg-dark-800 border border-dark-600/50 rounded-lg px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-200">{ex?.name}</p>
                    <p className="text-xs text-gray-500">{exSets.length} sets</p>
                  </div>
                  <p className="text-sm font-mono text-gray-400">{vol.toLocaleString()} lbs</p>
                </div>
              );
            })}
          </div>

          {/* Save button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onSave}
            disabled={isSaving}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-dark-900 font-bold text-lg
                       rounded-xl py-4 min-h-[56px] transition-colors disabled:opacity-50
                       flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              'Save Workout'
            )}
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────

export default function WorkoutLogger() {
  const { programId } = useParams(); // actually the session ID
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useWorkoutSession(programId);
  const createSet = useCreateSet();
  const completeWorkout = useCompleteWorkout();

  const [elapsed, setElapsed] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [restTimer, setRestTimer] = useState(null); // { exerciseName, seconds }
  const [notesExpanded, setNotesExpanded] = useState(false);

  const session = data?.workout_session || data;
  const exercises = session?.program_exercises || session?.exercises || [];
  const allSets = session?.workout_sets || session?.sets || [];

  // Count completed exercises for progress indicator
  const completedExerciseCount = useMemo(() => {
    let count = 0;
    exercises.forEach((pe) => {
      const exId = pe.exercise_id || pe.exercise?.id || pe.id;
      const targetSets = pe.target_sets || 3;
      const done = allSets.filter((s) => s.exercise_id === exId).length;
      if (done >= targetSets) count++;
    });
    return count;
  }, [exercises, allSets]);

  // Elapsed timer
  useEffect(() => {
    const start = session?.started_at ? new Date(session.started_at) : new Date();
    const tick = () => setElapsed(Math.floor((Date.now() - start.getTime()) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session?.started_at]);

  // Callback when a set is completed in any exercise card
  const handleSetCompleted = useCallback((exerciseName, restSeconds) => {
    setRestTimer({ exerciseName, seconds: restSeconds });
  }, []);

  const handleRestComplete = useCallback(() => {
    setRestTimer(null);
  }, []);

  const handleFinish = async () => {
    try {
      await completeWorkout.mutateAsync(programId);
      setShowSummary(true);
    } catch (err) {
      toast.error(err.message || 'Failed to complete workout');
    }
  };

  const handleSaveAndExit = () => {
    navigate('/');
    toast.success('Workout saved');
  };

  // ─── Loading state ───────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) {
    return <div className="text-center py-20 text-gray-500">Session not found</div>;
  }

  // ─── Summary overlay ────────────────────────────────────

  if (showSummary) {
    return (
      <WorkoutSummary
        session={session}
        exercises={exercises}
        allSets={allSets}
        elapsed={elapsed}
        onSave={handleSaveAndExit}
        isSaving={false}
      />
    );
  }

  // ─── Active workout ──────────────────────────────────────

  return (
    <div className="pb-28">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-dark-900/95 backdrop-blur-sm border-b border-dark-600/50 -mx-4 px-4">
        <div className="flex items-center justify-between py-3">
          <h1 className="text-base font-bold text-gray-100">Workout</h1>
          <span className="text-lg font-mono font-bold text-cyan-400 tabular-nums">
            {formatElapsed(elapsed)}
          </span>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleFinish}
            disabled={completeWorkout.isPending}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-dark-900 font-bold text-sm
                       rounded-lg min-h-[40px] transition-colors disabled:opacity-50
                       flex items-center gap-1.5"
          >
            {completeWorkout.isPending ? (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : null}
            Finish
          </motion.button>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 pb-2">
          <div className="flex-1 h-1 bg-dark-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: exercises.length > 0 ? `${(completedExerciseCount / exercises.length) * 100}%` : '0%' }}
            />
          </div>
          <span className="text-[11px] text-gray-500 font-mono whitespace-nowrap">
            {completedExerciseCount} of {exercises.length}
          </span>
        </div>
      </div>

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

      {/* Rest timer banner (non-blocking) */}
      <AnimatePresence>
        {restTimer && (
          <RestTimerBanner
            key="rest-timer"
            seconds={restTimer.seconds}
            exerciseName={restTimer.exerciseName}
            onComplete={handleRestComplete}
            onSkip={handleRestComplete}
          />
        )}
      </AnimatePresence>

      {/* Exercise cards — stacked vertically */}
      <div className="space-y-4 mt-4 -mx-4 px-4">
        {exercises.map((pe, idx) => (
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
        ))}
      </div>
    </div>
  );
}
