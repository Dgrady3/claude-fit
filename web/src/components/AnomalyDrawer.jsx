import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { format, parseISO } from 'date-fns';

const METRIC_COLORS = {
  sleep_score: 'text-indigo-400',
  hrv: 'text-cyan-400',
  resting_hr: 'text-red-400',
  steps: 'text-emerald-400',
  calories: 'text-amber-400',
  protein: 'text-cyan-400',
};

export default function AnomalyDrawer({ isOpen, onClose }) {
  const qc = useQueryClient();
  const { data: anomalies = [] } = useQuery({
    queryKey: ['anomalies'],
    queryFn: () => api.get('/anomalies'),
    staleTime: 1000 * 60 * 10,
  });

  const dismiss = useMutation({
    mutationFn: (id) => api.patch(`/anomalies/${id}/dismiss`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['anomalies'] }),
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] bg-dark-800 border-l border-dark-600/40 p-5 overflow-y-auto"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-gray-200">Anomalies</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-300 p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {anomalies.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-10">No anomalies detected. Looking good!</p>
            ) : (
              <div className="space-y-3">
                {anomalies.map((a) => (
                  <motion.div
                    key={a.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`rounded-xl p-3 space-y-1.5 border ${
                      a.severity === 'critical'
                        ? 'bg-red-500/10 border-red-500/20'
                        : 'bg-amber-500/10 border-amber-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium uppercase ${METRIC_COLORS[a.metric] || 'text-gray-400'}`}>
                        {a.metric.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-gray-500">{format(parseISO(a.date), 'MMM d')}</span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{a.message}</p>
                    {a.correlated_metric && (
                      <p className="text-[10px] text-gray-500">
                        Also anomalous: {a.correlated_metric.replace('_', ' ')}
                      </p>
                    )}
                    <button
                      onClick={() => dismiss.mutate(a.id)}
                      className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
                    >
                      Dismiss
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function useAnomalyCount() {
  const { data = [] } = useQuery({
    queryKey: ['anomalies'],
    queryFn: () => api.get('/anomalies'),
    staleTime: 1000 * 60 * 10,
  });
  return data.length;
}
