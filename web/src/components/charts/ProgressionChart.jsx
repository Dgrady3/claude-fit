import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-cyan-400 font-mono">{payload[0].value} lbs</p>
    </div>
  );
};

export default function ProgressionChart({ data = {}, exercises = [] }) {
  // data: { 'Bench Press': [{ date: 'Jan 1', weight: 185 }, ...], ... }
  // exercises: ['Bench Press', 'Squat', ...]
  const [selected, setSelected] = useState(exercises[0] || '');

  const chartData = data[selected] || [];

  return (
    <div className="space-y-3">
      {exercises.length > 1 && (
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-dark-700 border border-dark-500 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        >
          {exercises.map((ex) => (
            <option key={ex} value={ex}>
              {ex}
            </option>
          ))}
        </select>
      )}

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-sm text-gray-600">
          No progression data
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={40} unit=" lbs" />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={{ fill: '#22d3ee', r: 3 }}
              activeDot={{ r: 5, fill: '#22d3ee' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
