import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-cyan-400 font-mono">{payload[0].value} kcal</p>
    </div>
  );
};

export default function CalorieTrend({ data = [], target }) {
  // data: [{ date: 'Mon', calories: 2400 }, ...]
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-600">
        No calorie data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
        <Tooltip content={<CustomTooltip />} />
        {target && <ReferenceLine y={target} stroke="#fbbf24" strokeDasharray="4 4" label="" />}
        <Line
          type="monotone"
          dataKey="calories"
          stroke="#22d3ee"
          strokeWidth={2}
          dot={{ fill: '#22d3ee', r: 3 }}
          activeDot={{ r: 5, fill: '#22d3ee' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
