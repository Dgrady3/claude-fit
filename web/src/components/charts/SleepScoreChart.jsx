import { useMemo } from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { parseISO, format } from 'date-fns';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const hours = Math.floor(d.total_minutes / 60);
  const mins = Math.round(d.total_minutes % 60);
  return (
    <div className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{d.label}</p>
      <p className="text-cyan-400 font-mono">Score: {d.sleep_score}</p>
      <p className="text-gray-300 font-mono">{hours}h {mins}m</p>
    </div>
  );
};

export default function SleepScoreChart({ data = [] }) {
  const chartData = useMemo(() =>
    data.map((d) => ({
      ...d,
      label: format(parseISO(d.date), 'MMM d'),
      hours: d.total_minutes / 60,
    })),
  [data]);

  if (!chartData.length) {
    return <p className="text-gray-600 text-xs h-48 flex items-center justify-center">No data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="score"
          domain={[0, 100]}
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={30}
        />
        <YAxis
          yAxisId="hours"
          orientation="right"
          domain={[0, 'auto']}
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={30}
          tickFormatter={(v) => `${v.toFixed(0)}h`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          yAxisId="hours"
          dataKey="hours"
          fill="#22d3ee"
          fillOpacity={0.08}
          stroke="none"
          type="monotone"
        />
        <Line
          yAxisId="score"
          dataKey="sleep_score"
          stroke="#22d3ee"
          strokeWidth={2}
          dot={{ fill: '#22d3ee', r: 2 }}
          activeDot={{ r: 4, fill: '#22d3ee' }}
          type="monotone"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
