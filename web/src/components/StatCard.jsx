import Card from './Card';

export default function StatCard({ label, value, unit, trend, trendLabel, className = '' }) {
  const trendColor = trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-gray-500';
  const trendArrow = trend > 0 ? '\u2191' : trend < 0 ? '\u2193' : '';

  return (
    <Card className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold font-mono text-gray-100">{value}</span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
      {(trend !== undefined && trend !== null) && (
        <span className={`text-xs font-medium ${trendColor}`}>
          {trendArrow} {Math.abs(trend)}% {trendLabel || ''}
        </span>
      )}
    </Card>
  );
}
