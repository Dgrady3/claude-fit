import { useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { parseISO, format } from 'date-fns';

function getBarColor(steps) {
  if (steps >= 10000) return '#34d399';
  if (steps >= 8000) return '#22d3ee';
  return '#6b7280';
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{d.label}</p>
      <p className="text-cyan-400 font-mono">{d.steps.toLocaleString()} steps</p>
    </div>
  );
};

export default function StepsChart({ data = [] }) {
  const chartData = useMemo(() =>
    data
      .filter((d) => d.steps != null)
      .map((d) => ({
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
          width={35}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={8000} stroke="#6b7280" strokeDasharray="3 3" />
        <ReferenceLine y={10000} stroke="#34d399" strokeDasharray="3 3" />
        <Bar dataKey="steps" radius={[3, 3, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={getBarColor(entry.steps)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
