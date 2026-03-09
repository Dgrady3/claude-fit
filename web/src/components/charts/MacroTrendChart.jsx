import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { parseISO, format } from 'date-fns';

const MACROS = [
  { key: 'protein_g', color: '#22d3ee', label: 'Protein' },
  { key: 'carbs_g', color: '#fbbf24', label: 'Carbs' },
  { key: 'fat_g', color: '#34d399', label: 'Fat' },
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{d.label}</p>
      {MACROS.map(({ key, color, label }) => (
        <p key={key} style={{ color }} className="font-mono">
          {label}: {d[key]}g
        </p>
      ))}
    </div>
  );
};

export default function MacroTrendChart({ data = [] }) {
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
          width={35}
          tickFormatter={(v) => `${v}g`}
        />
        <Tooltip content={<CustomTooltip />} />
        {MACROS.map(({ key, color }) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId="1"
            stroke={color}
            fill={color}
            fillOpacity={0.5}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
