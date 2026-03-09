import { useState } from 'react';
import { useExercises, useCreateExercise } from '../api/hooks';
import { api } from '../api/client';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';
import toast from 'react-hot-toast';

const MUSCLE_GROUPS = [
  'all',
  'chest',
  'back',
  'shoulders',
  'legs',
  'arms',
  'core',
  'cardio',
];

export default function ExercisePicker({ isOpen, onClose, programId, onAdded }) {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: '', muscle_group: 'chest' });
  const [adding, setAdding] = useState(null);

  const group = selectedGroup === 'all' ? undefined : selectedGroup;
  const { data, isLoading } = useExercises(search || undefined, group);
  const createExercise = useCreateExercise();

  const exercises = Array.isArray(data) ? data : [];

  const handleSelect = async (exerciseId) => {
    setAdding(exerciseId);
    try {
      await api.post(`/workout_programs/${programId}/program_exercises`, {
        program_exercise: {
          exercise_id: exerciseId,
          target_sets: 3,
          target_reps: 10,
          rest_seconds: 90,
        },
      });
      onAdded?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdding(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const result = await createExercise.mutateAsync(newExercise);
      const exerciseId = result.id || result.exercise?.id;
      await handleSelect(exerciseId);
      setShowCreate(false);
      setNewExercise({ name: '', muscle_group: 'chest' });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Exercise" size="lg">
      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Muscle group tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3 -mx-1 px-1 scrollbar-hide">
        {MUSCLE_GROUPS.map((mg) => (
          <button
            key={mg}
            onClick={() => setSelectedGroup(mg)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedGroup === mg
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'bg-dark-700 text-gray-500 hover:text-gray-300'
            }`}
          >
            {mg.charAt(0).toUpperCase() + mg.slice(1)}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="max-h-64 overflow-y-auto space-y-1 mb-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full" />
          </div>
        ) : exercises.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-8">
            No exercises found. Create a custom one below.
          </p>
        ) : (
          exercises.map((ex) => (
            <button
              key={ex.id}
              onClick={() => handleSelect(ex.id)}
              disabled={adding === ex.id}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-dark-700 transition-colors text-left group"
            >
              <div>
                <p className="text-sm font-medium text-gray-200">{ex.name}</p>
                <p className="text-xs text-gray-500">{ex.muscle_group}</p>
              </div>
              {adding === ex.id ? (
                <div className="animate-spin w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full" />
              ) : (
                <svg
                  className="w-5 h-5 text-gray-600 group-hover:text-cyan-400 transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
            </button>
          ))
        )}
      </div>

      {/* Create Custom */}
      {showCreate ? (
        <form onSubmit={handleCreate} className="border-t border-dark-600/50 pt-4 space-y-3">
          <Input
            label="Exercise Name"
            value={newExercise.name}
            onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
            placeholder="e.g. Incline DB Press"
            required
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">Muscle Group</label>
            <select
              value={newExercise.muscle_group}
              onChange={(e) => setNewExercise({ ...newExercise, muscle_group: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg bg-dark-700 border border-dark-500 text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 min-h-[44px]"
            >
              {MUSCLE_GROUPS.filter((mg) => mg !== 'all').map((mg) => (
                <option key={mg} value={mg}>
                  {mg.charAt(0).toUpperCase() + mg.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" loading={createExercise.isPending} className="flex-1">
              Create & Add
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full py-3 border border-dashed border-dark-500 rounded-lg text-sm text-gray-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors"
        >
          + Create Custom Exercise
        </button>
      )}
    </Modal>
  );
}
