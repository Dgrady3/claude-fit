import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  useWorkoutProgram,
  useUpdateProgram,
  useDeleteProgram,
  useReorderExercises,
  useStartWorkout,
} from '../api/hooks';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import ReadinessBanner from '../components/ReadinessBanner';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import ExercisePicker from './ExercisePicker';
import toast from 'react-hot-toast';

const MUSCLE_GROUP_COLORS = {
  chest: 'bg-red-400/20 text-red-400',
  back: 'bg-blue-400/20 text-blue-400',
  shoulders: 'bg-amber-400/20 text-amber-400',
  legs: 'bg-emerald-400/20 text-emerald-400',
  arms: 'bg-purple-400/20 text-purple-400',
  core: 'bg-orange-400/20 text-orange-400',
  cardio: 'bg-pink-400/20 text-pink-400',
};

export default function ProgramDetail() {
  const { demoMode } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useWorkoutProgram(id);
  const updateProgram = useUpdateProgram();
  const deleteProgram = useDeleteProgram();
  const reorderExercises = useReorderExercises(id);
  const startWorkout = useStartWorkout();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const program = data?.workout_program || data;
  const exercises = program?.program_exercises || [];

  const handleSaveName = async () => {
    try {
      await updateProgram.mutateAsync({ id, name: editName, description: editDesc });
      setEditing(false);
      toast.success('Program updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProgram.mutateAsync(id);
      toast.success('Program deleted');
      navigate('/programs');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleMoveUp = async (index) => {
    if (index === 0) return;
    const ids = exercises.map((e) => e.id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    await reorderExercises.mutateAsync(ids);
  };

  const handleMoveDown = async (index) => {
    if (index >= exercises.length - 1) return;
    const ids = exercises.map((e) => e.id);
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    await reorderExercises.mutateAsync(ids);
  };

  const handleRemoveExercise = async (exerciseId) => {
    try {
      await updateProgram.mutateAsync({ id, remove_exercise_id: exerciseId });
      toast.success('Exercise removed');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleStartWorkout = async () => {
    try {
      const result = await startWorkout.mutateAsync(id);
      const sessionId = result.id || result.workout_session?.id;
      navigate(`/workout/${sessionId}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleExerciseAdded = () => {
    setShowPicker(false);
    toast.success('Exercise added');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!program) {
    return <div className="text-center py-20 text-gray-500">Program not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <button
            onClick={() => navigate('/programs')}
            className="text-sm text-gray-500 hover:text-gray-300 mb-2 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Programs
          </button>

          {editing ? (
            <div className="space-y-2">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Program name"
              />
              <Input
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Description"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveName} loading={updateProgram.isPending}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-gray-100">{program.name}</h1>
              {program.description && (
                <p className="text-sm text-gray-500 mt-0.5">{program.description}</p>
              )}
              {!demoMode && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      setEditName(program.name);
                      setEditDesc(program.description || '');
                      setEditing(true);
                    }}
                    className="text-xs text-gray-500 hover:text-cyan-400"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-xs text-gray-500 hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Readiness Banner */}
      <ReadinessBanner />

      {/* Start Workout */}
      {!demoMode && (
        <Button onClick={handleStartWorkout} size="xl" className="w-full" loading={startWorkout.isPending}>
          Start Workout
        </Button>
      )}

      {/* Exercise List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-200">
            Exercises ({exercises.length})
          </h2>
          {!demoMode && (
            <Button size="sm" variant="secondary" onClick={() => setShowPicker(true)}>
              + Add
            </Button>
          )}
        </div>

        {exercises.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-gray-500 text-sm">No exercises yet. Add some to get started.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {exercises.map((pe, idx) => {
              const ex = pe.exercise || pe;
              const mg = ex.muscle_group || 'other';
              const colorClass = MUSCLE_GROUP_COLORS[mg] || 'bg-gray-400/20 text-gray-400';

              return (
                <motion.div
                  key={pe.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <Card className="flex items-center gap-3">
                    {/* Reorder buttons */}
                    {!demoMode && (
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => handleMoveUp(idx)}
                          disabled={idx === 0}
                          className="p-1 rounded text-gray-500 hover:text-gray-300 disabled:opacity-20"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleMoveDown(idx)}
                          disabled={idx >= exercises.length - 1}
                          className="p-1 rounded text-gray-500 hover:text-gray-300 disabled:opacity-20"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* Exercise info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-200 text-sm">{ex.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${colorClass}`}>
                          {mg}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {pe.target_sets || 3}x{pe.target_reps || 10}
                        </span>
                        {pe.rest_seconds && (
                          <span className="text-xs text-gray-500">
                            {pe.rest_seconds}s rest
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Remove */}
                    {!demoMode && (
                      <button
                        onClick={() => handleRemoveExercise(pe.id)}
                        className="p-2 rounded-lg hover:bg-dark-700 text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Exercise Picker Modal */}
      <ExercisePicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        programId={id}
        onAdded={handleExerciseAdded}
      />

      {/* Delete Confirmation */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Program">
        <p className="text-gray-400 text-sm mb-4">
          Are you sure you want to delete &quot;{program.name}&quot;? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="danger" onClick={handleDelete} loading={deleteProgram.isPending} className="flex-1">
            Delete
          </Button>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
