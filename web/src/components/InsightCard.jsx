import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

const SEVERITY_CONFIG = {
  warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', accent: 'text-amber-400', icon: '\u26A0' },
  info: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', accent: 'text-cyan-400', icon: '\uD83D\uDCA1' },
  positive: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', accent: 'text-emerald-400', icon: '\u2713' },
};

export default function InsightCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['rootCause'],
    queryFn: () => api.get('/insights/root_cause'),
    staleTime: 1000 * 60 * 60,
    retry: false,
  });

  if (isLoading || !data?.title) return null;

  const config = SEVERITY_CONFIG[data.severity] || SEVERITY_CONFIG.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`${config.bg} ${config.border} border rounded-xl p-4 space-y-1.5`}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">{config.icon}</span>
        <h3 className={`text-sm font-semibold ${config.accent}`}>{data.title}</h3>
      </div>
      <p className="text-xs text-gray-300 leading-relaxed">{data.insight}</p>
    </motion.div>
  );
}
