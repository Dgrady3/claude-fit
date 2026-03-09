import { useMemo } from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { parseISO, format } from 'date-fns';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{d.label}</p>
      <p className="text-cyan-400 font-mono">HRV: {d.hrv_average} ms</p>
      {d.rollingAvg != null && (
        <p className="text-gray-400 font-mono">7d avg: {d.rollingAvg.toFixed(0)} ms</p>
      )}
    </div>
  );
};

export default function HRVTrendChart({ data = [] }) {
  const chartData = useMemo(() => {
    const sorted = data
      .filter((d) => d.hrv_average != null)
      .map((d) => ({
        ...d,
        label: format(parseISO(d.date), 'MMM d'),
      }));

    // Compute mean and std deviation
    const values = sorted.map((d) => d.hrv_average);
    const mean = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const variance = values.length
      ? values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
      : 0;
    const stdDev = Math.sqrt(variance);

    // Add rolling average and bands
    return sorted.map((d, i) => {
      const window = sorted.slice(Math.max(0, i - 6), i + 1);
      const rollingAvg = window.reduce((s, w) => s + w.hrv_average, 0) / window.length;
      return {
        ...d,
        rollingAvg,
        upperBand: mean + stdDev,
        lowerBand: mean - stdDev,
      };
    });
  }, [data]);

  if (!chartData.length) {
    return <p className="text-gray-600 text-xs h-48 flex items-center justify-center">No data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
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
          width={35}
          domain={['auto', 'auto']}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          dataKey="upperBand"
          stroke="none"
          fill="#6b7280"
          fillOpacity={0.1}
          type="monotone"
        />
        <Area
          dataKey="lowerBand"
          stroke="none"
          fill="#1f2937"
          fillOpacity={1}
          type="monotone"
        />
        <Line
          dataKey="rollingAvg"
          stroke="#6b7280"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
          type="monotone"
        />
        <Line
          dataKey="hrv_average"
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
