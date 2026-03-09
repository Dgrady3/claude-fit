import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import toast from 'react-hot-toast';

export default function AthleteCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['athleteCard'],
    queryFn: () => api.get('/athlete_card'),
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 py-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-dark-800 to-dark-900 border border-dark-600/40 rounded-2xl p-6 space-y-6 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <span className="text-cyan-400 font-bold text-xl">CF</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-100">{data?.name}</h1>
            <p className="text-xs text-gray-500">Member since {data?.member_since}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <StatBlock label="Sessions" value={data?.total_sessions || 0} />
          <StatBlock label="Volume" value={`${((data?.total_volume || 0) / 1000).toFixed(0)}k`} unit="lbs" />
          <StatBlock label="Streak" value={data?.streak_weeks || 0} unit="weeks" />
        </div>

        {/* Best Lifts */}
        {data?.best_lifts?.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Best Lifts</h3>
            <div className="space-y-1.5">
              {data.best_lifts.map((lift, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-300">{lift.exercise}</span>
                  <span className="text-sm font-mono text-cyan-400">{lift.weight} lbs</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recovery */}
        <div className="flex gap-4">
          {data?.avg_sleep_score && (
            <div className="flex-1 bg-dark-700/50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-indigo-400">{data.avg_sleep_score}</p>
              <p className="text-[10px] text-gray-500 uppercase">Avg Sleep</p>
            </div>
          )}
          {data?.avg_steps && (
            <div className="flex-1 bg-dark-700/50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-emerald-400">{data.avg_steps.toLocaleString()}</p>
              <p className="text-[10px] text-gray-500 uppercase">Avg Steps</p>
            </div>
          )}
        </div>

        {/* Branding */}
        <div className="text-center pt-2 border-t border-dark-600/40">
          <span className="text-[10px] text-gray-600">Powered by Claude-Fit</span>
        </div>
      </motion.div>

      <button
        onClick={handleCopy}
        className="w-full py-3 rounded-xl bg-dark-800 border border-dark-600/40 text-sm text-gray-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
      >
        Copy Share Link
      </button>
    </div>
  );
}

function StatBlock({ label, value, unit }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold text-gray-100 font-mono">
        {value}
        {unit && <span className="text-xs text-gray-500 ml-0.5">{unit}</span>}
      </p>
      <p className="text-[10px] text-gray-500 uppercase mt-0.5">{label}</p>
    </div>
  );
}
