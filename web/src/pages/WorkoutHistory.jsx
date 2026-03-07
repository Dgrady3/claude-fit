import { useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWorkoutSessions, useWorkoutSession } from '../api/hooks';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import QueryError from '../components/QueryError';

function SessionDetail({ sessionId, onClose }) {
  const { data, isLoading } = useWorkoutSession(sessionId);
  const session = data?.workout_session || data;
  const sets = session?.workout_sets || session?.sets || [];
  const exercises = session?.program_exercises || session?.exercises || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) return null;

  // Group sets by exercise
  const grouped = {};
  sets.forEach((s) => {
    const key = s.exercise_id;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">
            {format(new Date(session.started_at || session.created_at), 'EEEE, MMMM d')}
          </p>
          <p className="text-sm text-gray-400 mt-0.5">
            {session.duration_minutes ? `${session.duration_minutes} min` : ''}
            {session.total_volume ? ` / ${session.total_volume.toLocaleString()} lbs total` : ''}
          </p>
        </div>
      </div>

      {Object.entries(grouped).map(([exId, exSets]) => {
        const exercise = exercises.find(
          (e) => (e.exercise_id || e.exercise?.id || e.id) === parseInt(exId)
        );
        const exName = exercise?.exercise?.name || exercise?.name || `Exercise ${exId}`;

        return (
          <div key={exId}>
            <h4 className="text-sm font-medium text-gray-300 mb-2">{exName}</h4>
            <div className="space-y-1">
              <div className="grid grid-cols-4 gap-2 text-xs text-gray-500 px-1">
                <span>Set</span>
                <span>Weight</span>
                <span>Reps</span>
                <span>RPE</span>
              </div>
              {exSets.map((s, i) => (
                <div
                  key={s.id}
                  className="grid grid-cols-4 gap-2 text-sm font-mono text-gray-300 bg-dark-700/50 rounded px-2 py-1.5"
                >
                  <span className="text-gray-500">{i + 1}</span>
                  <span>{s.weight} lbs</span>
                  <span>{s.reps}</span>
                  <span className="text-gray-500">{s.rpe || '--'}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function WorkoutHistory() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const { data, isLoading, error, refetch } = useWorkoutSessions(page);

  const sessions = Array.isArray(data) ? data : [];
  const totalPages = data?.meta?.total_pages || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/programs')}
            className="text-sm text-gray-500 hover:text-gray-300 mb-1 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Programs
          </button>
          <h1 className="text-2xl font-bold text-gray-100">Workout History</h1>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
        </div>
      ) : error ? (
        <QueryError error={error} onRetry={refetch} message="Failed to load workout history" />
      ) : sessions.length === 0 ? (
        <EmptyState
          title="No workouts recorded"
          description="Complete your first workout to see it here."
          actionLabel="Start Workout"
          onAction={() => navigate('/programs')}
        />
      ) : (
        <>
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.03 } } }}
            className="space-y-2"
          >
            {sessions.map((s) => (
              <motion.div
                key={s.id}
                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
              >
                <Card
                  className="cursor-pointer hover:border-cyan-500/30 transition-colors"
                  onClick={() => setSelectedId(s.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-200">
                        {s.workout_program?.name || s.program_name || 'Workout'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {format(new Date(s.started_at || s.created_at), 'MMM d, yyyy - h:mm a')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-gray-300">
                        {s.total_volume ? `${s.total_volume.toLocaleString()} lbs` : '--'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {s.duration_minutes ? `${s.duration_minutes} min` : ''}
                        {s.sets_count ? ` / ${s.sets_count} sets` : ''}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-500 font-mono">
                {page} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedId}
        onClose={() => setSelectedId(null)}
        title="Workout Detail"
        size="lg"
      >
        {selectedId && (
          <SessionDetail sessionId={selectedId} onClose={() => setSelectedId(null)} />
        )}
      </Modal>
    </div>
  );
}
