import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill }} className="font-mono">
          {p.name}: {p.value}g
        </p>
      ))}
    </div>
  );
};

export default function MacroChart({ data = [], proteinTarget, carbTarget, fatTarget }) {
  // data: [{ name: 'Protein', value: 150, target: 180 }, ...]
  // or [{ date: 'Mon', protein: 150, carbs: 200, fat: 60 }]

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-600">
        No macro data
      </div>
    );
  }

  // If simple bar chart format
  if (data[0]?.name) {
    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barCategoryGap="30%">
          <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" fill="#22d3ee" radius={[4, 4, 0, 0]} />
          <Bar dataKey="target" fill="#1a1a25" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Daily macro chart
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barCategoryGap="20%">
        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="protein" fill="#22d3ee" name="Protein" radius={[2, 2, 0, 0]} />
        <Bar dataKey="carbs" fill="#fbbf24" name="Carbs" radius={[2, 2, 0, 0]} />
        <Bar dataKey="fat" fill="#34d399" name="Fat" radius={[2, 2, 0, 0]} />
        {proteinTarget && <ReferenceLine y={proteinTarget} stroke="#22d3ee" strokeDasharray="3 3" />}
      </BarChart>
    </ResponsiveContainer>
  );
}
