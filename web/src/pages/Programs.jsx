import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWorkoutPrograms, useCreateProgram, useStartWorkout } from '../api/hooks';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';

export default function Programs() {
  const { demoMode } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useWorkoutPrograms();
  const createProgram = useCreateProgram();
  const startWorkout = useStartWorkout();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const programs = Array.isArray(data) ? data : [];

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const result = await createProgram.mutateAsync({ name, description });
      setShowCreate(false);
      setName('');
      setDescription('');
      toast.success('Program created');
      navigate(`/programs/${result.id || result.workout_program?.id}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleStart = async (programId) => {
    try {
      const result = await startWorkout.mutateAsync(programId);
      const sessionId = result.id || result.workout_session?.id;
      navigate(`/workout/${sessionId}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-100">Programs</h1>
        <Button onClick={() => navigate('/workout/history')} variant="ghost" size="sm">
          History
        </Button>
      </div>

      {programs.length === 0 ? (
        <EmptyState
          title="No programs yet"
          description="Create a workout program to get started."
          actionLabel="Create Program"
          onAction={() => setShowCreate(true)}
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
          className="grid gap-3 sm:grid-cols-2"
        >
          {programs.map((p) => (
            <motion.div
              key={p.id}
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            >
              <Card className="flex flex-col gap-3">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => navigate(`/programs/${p.id}`)}
                >
                  <h3 className="font-semibold text-gray-200">{p.name}</h3>
                  {p.description && (
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{p.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {p.exercises_count ?? p.program_exercises?.length ?? 0} exercises
                  </p>
                </div>
                {!demoMode && (
                <Button
                  onClick={() => handleStart(p.id)}
                  loading={startWorkout.isPending}
                  size="lg"
                  className="w-full"
                >
                  Start Workout
                </Button>
              )}
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* FAB */}
      {!demoMode && (
        <button
          onClick={() => setShowCreate(true)}
          className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 w-14 h-14 rounded-full bg-cyan-500 hover:bg-cyan-400 text-dark-900 shadow-lg shadow-cyan-500/25 flex items-center justify-center transition-colors z-30"
        >
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Program">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Program Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Push Day, Upper Body"
            required
          />
          <Input
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description"
          />
          <Button type="submit" loading={createProgram.isPending} size="lg" className="w-full">
            Create Program
          </Button>
        </form>
      </Modal>
    </div>
  );
}
