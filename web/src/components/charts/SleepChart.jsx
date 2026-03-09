import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill }} className="font-mono">
          {p.name}: {p.value}h
        </p>
      ))}
    </div>
  );
};

export default function SleepChart({ data = [] }) {
  // data: [{ date: 'Mon', deep: 1.5, rem: 2, light: 3, awake: 0.5 }, ...]
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-600">
        No sleep data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barCategoryGap="25%">
        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={25} unit="h" />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }}
        />
        <Bar dataKey="deep" stackId="sleep" fill="#6366f1" name="Deep" radius={[0, 0, 0, 0]} />
        <Bar dataKey="rem" stackId="sleep" fill="#22d3ee" name="REM" radius={[0, 0, 0, 0]} />
        <Bar dataKey="light" stackId="sleep" fill="#34d399" name="Light" radius={[0, 0, 0, 0]} />
        <Bar dataKey="awake" stackId="sleep" fill="#4b5563" name="Awake" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
