import { useMemo } from 'react';
import { ComposedChart, Line, ReferenceArea, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { parseISO, format } from 'date-fns';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{d.label}</p>
      <p className="text-cyan-400 font-mono">{d.proteinPerLb.toFixed(2)} g/lb</p>
      <p className="text-gray-400 font-mono">{d.protein_g}g protein</p>
    </div>
  );
};

export default function ProteinPerLbChart({ data = [], bodyWeight = 185 }) {
  const chartData = useMemo(() =>
    data
      .filter((d) => d.protein_g != null)
      .map((d) => ({
        ...d,
        label: format(parseISO(d.date), 'MMM d'),
        proteinPerLb: d.protein_g / bodyWeight,
      })),
  [data, bodyWeight]);

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
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={40}
          domain={[0, 'auto']}
          tickFormatter={(v) => `${v.toFixed(1)}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceArea y1={0.8} y2={1.2} fill="#34d399" fillOpacity={0.1} />
        <Line
          type="monotone"
          dataKey="proteinPerLb"
          stroke="#22d3ee"
          strokeWidth={2}
          dot={{ fill: '#22d3ee', r: 2 }}
          activeDot={{ r: 4, fill: '#22d3ee' }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
