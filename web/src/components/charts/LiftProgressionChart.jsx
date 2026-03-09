import { useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { parseISO, format } from 'date-fns';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{d.label}</p>
      <p className="text-cyan-400 font-mono">{d.max_weight} x {d.max_reps}</p>
      {d.estimated_1rm && (
        <p className="text-gray-400">Est 1RM: <span className="text-gray-200 font-mono">{d.estimated_1rm} lbs</span></p>
      )}
    </div>
  );
};

export default function LiftProgressionChart({ exerciseHistory = {}, exercises = [] }) {
  const [selected, setSelected] = useState(exercises[0] || '');

  const { chartData, prPoint } = useMemo(() => {
    const raw = exerciseHistory[selected] || [];
    const mapped = raw.map((s) => {
      const parsed = parseISO(s.date);
      return {
        ...s,
        timestamp: parsed.getTime(),
        label: format(parsed, 'MMM d'),
      };
    });

    let pr = null;
    for (const point of mapped) {
      if (!pr || point.max_weight > pr.max_weight) {
        pr = point;
      }
    }

    return { chartData: mapped, prPoint: pr };
  }, [exerciseHistory, selected]);

  if (!exercises.length) {
    return <p className="text-gray-600 text-xs h-48 flex items-center justify-center">No data</p>;
  }

  return (
    <div className="space-y-3">
      {exercises.length > 1 && (
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        >
          {exercises.map((ex) => (
            <option key={ex} value={ex}>{ex}</option>
          ))}
        </select>
      )}

      {chartData.length === 0 ? (
        <p className="text-gray-600 text-xs h-48 flex items-center justify-center">No data</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(t) => format(new Date(t), 'MMM d')}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              dataKey="max_weight"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={40}
              unit=" lbs"
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter
              data={chartData}
              fill="#22d3ee"
              r={4}
            />
            {prPoint && (
              <ReferenceDot
                x={prPoint.timestamp}
                y={prPoint.max_weight}
                r={7}
                fill="#fbbf24"
                stroke="#fbbf24"
                strokeWidth={2}
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
