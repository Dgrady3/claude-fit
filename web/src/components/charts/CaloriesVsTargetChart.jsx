import { useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { parseISO, format } from 'date-fns';

function getBarColor(calories, target) {
  if (!target) return '#22d3ee';
  const diff = calories - target;
  if (Math.abs(diff) <= 100) return '#34d399';
  if (Math.abs(diff) <= 300) return '#22d3ee';
  if (diff < -300) return '#fbbf24';
  return '#f87171';
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{d.label}</p>
      <p className="text-cyan-400 font-mono">{d.calories.toLocaleString()} kcal</p>
    </div>
  );
};

export default function CaloriesVsTargetChart({ data = [], target }) {
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
        />
        <Tooltip content={<CustomTooltip />} />
        {target && <ReferenceLine y={target} stroke="#fbbf24" strokeDasharray="4 4" />}
        <Bar dataKey="calories" radius={[3, 3, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={getBarColor(entry.calories, target)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
