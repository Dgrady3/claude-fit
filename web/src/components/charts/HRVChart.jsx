import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.stroke }} className="font-mono">
          {p.name}: {p.value} {p.name === 'HRV' ? 'ms' : 'bpm'}
        </p>
      ))}
    </div>
  );
};

export default function HRVChart({ data = [] }) {
  // data: [{ date: 'Mon', hrv: 45, resting_hr: 52 }, ...]
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-600">
        No HRV data. Connect your Oura Ring in Settings.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="left" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
        <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="hrv"
          stroke="#22d3ee"
          strokeWidth={2}
          name="HRV"
          dot={{ fill: '#22d3ee', r: 2 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="resting_hr"
          stroke="#f87171"
          strokeWidth={2}
          name="Resting HR"
          dot={{ fill: '#f87171', r: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
