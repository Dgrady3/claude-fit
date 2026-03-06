import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

const LEVEL_CONFIG = {
  peak: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  good: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
  moderate: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
  low: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' },
};

export default function ReadinessBanner() {
  const { data, isLoading } = useQuery({
    queryKey: ['readinessToday'],
    queryFn: () => api.get('/readiness/today'),
    staleTime: 1000 * 60 * 30,
  });

  if (isLoading || !data?.available) return null;

  const config = LEVEL_CONFIG[data.level] || LEVEL_CONFIG.good;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${config.bg} ${config.border} border rounded-xl p-4 space-y-2`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${config.text}`}>{data.readiness_score}</span>
          <span className="text-xs text-gray-400">Readiness</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          {data.hrv && (
            <span className="text-gray-400">
              HRV {data.hrv}
              {data.hrv_delta_pct != null && (
                <span className={data.hrv_delta_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {' '}{data.hrv_delta_pct > 0 ? '+' : ''}{data.hrv_delta_pct}%
                </span>
              )}
            </span>
          )}
          {data.sleep_score && (
            <span className="text-gray-400">Sleep {data.sleep_score}</span>
          )}
        </div>
      </div>
      <p className={`text-sm ${config.text}`}>{data.recommendation}</p>
    </motion.div>
  );
}
