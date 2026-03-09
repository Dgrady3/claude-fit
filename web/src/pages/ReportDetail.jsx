import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useDailyReport } from '../api/hooks';
import Card from '../components/Card';

function ScoreRing({ score, size = 120, strokeWidth = 8, label }) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - (score || 0) / 10);
  const color =
    score >= 8 ? '#34d399' : score >= 6 ? '#22d3ee' : score >= 4 ? '#fbbf24' : '#f87171';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1a1a25" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold font-mono" style={{ color }}>
            {score ?? '--'}
          </span>
        </div>
      </div>
      {label && <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>}
    </div>
  );
}

function DomainScoreBar({ label, score }) {
  const color =
    score >= 8 ? 'bg-emerald-400' : score >= 6 ? 'bg-cyan-400' : score >= 4 ? 'bg-amber-400' : 'bg-red-400';
  const textColor =
    score >= 8 ? 'text-emerald-400' : score >= 6 ? 'text-cyan-400' : score >= 4 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-400 w-24">{label}</span>
      <div className="flex-1 h-3 bg-dark-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${(score / 10) * 100}%` }}
        />
      </div>
      <span className={`text-sm font-mono font-bold w-8 text-right ${textColor}`}>
        {score}
      </span>
    </div>
  );
}

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useDailyReport(id);

  const report = data?.daily_report || data;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!report) {
    return <div className="text-center py-20 text-gray-500">Report not found</div>;
  }

  const domainScores = report.domain_scores || {};
  const recommendations = report.recommendations || [];
  const alerts = report.alerts || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Back + date */}
      <div>
        <button
          onClick={() => navigate('/reports')}
          className="text-sm text-gray-500 hover:text-gray-300 mb-2 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Reports
        </button>
        <h1 className="text-2xl font-bold text-gray-100">
          {format(new Date(report.date), 'EEEE, MMMM d, yyyy')}
        </h1>
      </div>

      {/* Overall Score */}
      <Card className="flex flex-col items-center py-6">
        <ScoreRing score={report.overall_score} label="Overall Score" />
      </Card>

      {/* Domain Scores */}
      <Card className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Domain Scores</h3>
        <DomainScoreBar label="Nutrition" score={domainScores.nutrition ?? 0} />
        <DomainScoreBar label="Recovery" score={domainScores.recovery ?? 0} />
        <DomainScoreBar label="Training" score={domainScores.training ?? 0} />
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-red-400/20 space-y-2">
          <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wide flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Alerts
          </h3>
          {alerts.map((alert, i) => (
            <p key={i} className="text-sm text-red-300 bg-red-400/5 rounded-lg px-3 py-2">
              {alert}
            </p>
          ))}
        </Card>
      )}

      {/* Analysis */}
      {report.analysis && (
        <Card className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Analysis</h3>
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {report.analysis}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Recommendations
          </h3>
          <ol className="space-y-2">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span className="text-gray-300 pt-0.5">{rec}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* Summary */}
      {report.summary && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Summary</h3>
          <p className="text-sm text-gray-300 leading-relaxed">{report.summary}</p>
        </Card>
      )}
    </motion.div>
  );
}
