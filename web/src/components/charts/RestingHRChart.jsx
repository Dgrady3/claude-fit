import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { parseISO, format } from 'date-fns';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{d.label}</p>
      <p className="text-cyan-400 font-mono">{d.resting_heart_rate} bpm</p>
    </div>
  );
};

export default function RestingHRChart({ data = [] }) {
  const { chartData, trendColor } = useMemo(() => {
    const filtered = data
      .filter((d) => d.resting_heart_rate != null)
      .map((d) => ({
        ...d,
        label: format(parseISO(d.date), 'MMM d'),
      }));

    const color =
      filtered.length >= 2 && filtered[filtered.length - 1].resting_heart_rate <= filtered[0].resting_heart_rate
        ? '#34d399'
        : '#f87171';

    return { chartData: filtered, trendColor: color };
  }, [data]);

  if (!chartData.length) {
    return <p className="text-gray-600 text-xs h-48 flex items-center justify-center">No data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
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
          domain={['auto', 'auto']}
          unit=" bpm"
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="resting_heart_rate"
          stroke={trendColor}
          strokeWidth={2}
          dot={{ fill: trendColor, r: 2 }}
          activeDot={{ r: 4, fill: trendColor }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
