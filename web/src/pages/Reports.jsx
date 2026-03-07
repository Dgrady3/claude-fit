import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useDailyReports, useGenerateReport } from '../api/hooks';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import QueryError from '../components/QueryError';
import toast from 'react-hot-toast';

function scoreColor(score) {
  if (score >= 8) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
  if (score >= 6) return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
  if (score >= 4) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
  return 'text-red-400 bg-red-400/10 border-red-400/20';
}

export default function Reports() {
  const { demoMode } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useDailyReports();
  const generateReport = useGenerateReport();

  const reports = Array.isArray(data) ? data : [];

  const handleGenerate = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const result = await generateReport.mutateAsync(today);
      toast.success('Report generated');
      const reportId = result.id || result.daily_report?.id;
      if (reportId) navigate(`/reports/${reportId}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-100">Reports</h1>
        {!demoMode && (
          <Button
            onClick={handleGenerate}
            loading={generateReport.isPending}
            size="sm"
          >
            Generate Report
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
        </div>
      ) : error ? (
        <QueryError error={error} onRetry={refetch} message="Failed to load reports" />
      ) : reports.length === 0 ? (
        <EmptyState
          title="No reports yet"
          description="Generate your first AI health report to get personalized insights."
          actionLabel="Generate Report"
          onAction={handleGenerate}
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
          className="space-y-3"
        >
          {reports.map((r) => {
            const sc = scoreColor(r.overall_score);
            return (
              <motion.div
                key={r.id}
                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
              >
                <Card
                  className="flex items-center gap-4 cursor-pointer hover:border-cyan-500/30 transition-colors"
                  onClick={() => navigate(`/reports/${r.id}`)}
                >
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-mono font-bold text-lg ${sc}`}>
                    {r.overall_score ?? '--'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-200">
                        {format(new Date(r.date), 'EEEE, MMMM d')}
                      </p>
                      <span className={`text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                        r.report_type === 'weekly'
                          ? 'bg-indigo-500/20 text-indigo-400'
                          : 'bg-dark-600 text-gray-500'
                      }`}>
                        {r.report_type === 'weekly' ? 'Weekly' : 'Daily'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                      {r.summary || 'Tap to view full report'}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
