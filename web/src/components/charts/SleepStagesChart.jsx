import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { parseISO, format } from 'date-fns';

const STAGES = [
  { key: 'deep_minutes', color: '#6366f1', label: 'Deep' },
  { key: 'rem_minutes', color: '#a855f7', label: 'REM' },
  { key: 'light_minutes', color: '#64748b', label: 'Light' },
  { key: 'awake_minutes', color: '#f87171', label: 'Awake' },
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{d.label}</p>
      {STAGES.map(({ key, color, label }) => (
        <p key={key} style={{ color }} className="font-mono">
          {label}: {Math.round((d[key] || 0) / 60 * 10) / 10}h
        </p>
      ))}
    </div>
  );
};

export default function SleepStagesChart({ data = [] }) {
  const chartData = useMemo(() =>
    data.map((d) => ({
      ...d,
      label: format(parseISO(d.date), 'MMM d'),
    })),
  [data]);

  if (!chartData.length) {
    return <p className="text-gray-600 text-xs h-48 flex items-center justify-center">No data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
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
          width={30}
          tickFormatter={(v) => `${Math.round(v / 60)}h`}
        />
        <Tooltip content={<CustomTooltip />} />
        {STAGES.map(({ key, color }) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId="1"
            stroke={color}
            fill={color}
            fillOpacity={0.6}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
