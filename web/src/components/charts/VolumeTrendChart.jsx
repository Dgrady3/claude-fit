import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { parseISO, format } from 'date-fns';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{d.label}</p>
      <p className="text-cyan-400 font-mono">{d.volume.toLocaleString()} lbs</p>
      {d.duration_minutes != null && (
        <p className="text-gray-400">{d.duration_minutes} min</p>
      )}
    </div>
  );
};

export default function VolumeTrendChart({ sessions = [] }) {
  const { chartData, avgVolume } = useMemo(() => {
    const mapped = sessions.map((s) => ({
      ...s,
      label: format(parseISO(s.date), 'MMM d'),
    }));
    const avg = mapped.length
      ? Math.round(mapped.reduce((sum, s) => sum + (s.volume || 0), 0) / mapped.length)
      : 0;
    return { chartData: mapped, avgVolume: avg };
  }, [sessions]);

  if (!chartData.length) {
    return <p className="text-gray-600 text-xs h-48 flex items-center justify-center">No data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={40}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={avgVolume} stroke="#fbbf24" strokeDasharray="4 4" />
        <Bar dataKey="volume" fill="#22d3ee" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
