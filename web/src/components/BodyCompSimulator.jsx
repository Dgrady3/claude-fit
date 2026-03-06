import { useState, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import Card from './Card';

function Slider({ label, value, onChange, min, max, step = 1, unit = '' }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-200 font-mono">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-dark-600 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400
          [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-cyan-400/30"
      />
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-300 font-medium mb-1">Week {label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value.toFixed(1)} lbs</p>
      ))}
    </div>
  );
}

export default function BodyCompSimulator({ currentWeight = 185, bodyFatPct = 20 }) {
  const [deficit, setDeficit] = useState(300);
  const [protein, setProtein] = useState(160);
  const [weeks, setWeeks] = useState(12);
  const [trainingDays, setTrainingDays] = useState(4);

  const projections = useMemo(() => {
    const data = [];
    let weight = currentWeight;
    let fatMass = weight * (bodyFatPct / 100);
    let leanMass = weight - fatMass;

    const bmr = 10 * (weight * 0.453592) + 6.25 * 175 - 5 * 30 + 5;
    const activityMultiplier = 1.2 + (trainingDays * 0.05);
    const tdee = bmr * activityMultiplier;

    const proteinPerLb = protein / weight;
    const muscleRetention = Math.min(1, proteinPerLb / 1.0);

    for (let w = 0; w <= weeks; w++) {
      data.push({
        week: w,
        weight: Math.round(weight * 10) / 10,
        fatMass: Math.round(fatMass * 10) / 10,
        leanMass: Math.round(leanMass * 10) / 10,
        bodyFat: Math.round((fatMass / weight) * 1000) / 10,
      });

      const weeklyDeficit = deficit * 7;
      const fatLossLbs = (weeklyDeficit * 0.85) / 3500;
      const muscleLossLbs = (weeklyDeficit * 0.15) / 3500;

      const muscleGainFromTraining = trainingDays >= 3 ? 0.05 * muscleRetention : 0;
      const adjustedMuscleLoss = Math.max(0, muscleLossLbs - muscleGainFromTraining) * (1 - muscleRetention * 0.5);

      fatMass = Math.max(fatMass - fatLossLbs, weight * 0.05);
      leanMass = leanMass - adjustedMuscleLoss + muscleGainFromTraining;
      weight = fatMass + leanMass;
    }

    return data;
  }, [currentWeight, bodyFatPct, deficit, protein, weeks, trainingDays]);

  const finalBF = projections[projections.length - 1]?.bodyFat;
  const weightLost = currentWeight - (projections[projections.length - 1]?.weight || currentWeight);

  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Body Comp Simulator</h3>
        <span className="text-xs text-gray-600 font-mono">
          {finalBF?.toFixed(1)}% BF in {weeks}w &bull; {weightLost > 0 ? '-' : '+'}{Math.abs(weightLost).toFixed(1)} lbs
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        <Slider label="Daily Deficit" value={deficit} onChange={setDeficit} min={0} max={1000} step={50} unit=" cal" />
        <Slider label="Daily Protein" value={protein} onChange={setProtein} min={80} max={250} step={5} unit="g" />
        <Slider label="Weeks" value={weeks} onChange={setWeeks} min={4} max={24} step={1} unit="w" />
        <Slider label="Training Days/wk" value={trainingDays} onChange={setTrainingDays} min={0} max={6} step={1} unit="d" />
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={projections} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#f87171" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="leanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={(w) => `W${w}`} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
          <Area type="monotone" dataKey="leanMass" name="Lean Mass" stroke="#22d3ee" fill="url(#leanGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="fatMass" name="Fat Mass" stroke="#f87171" fill="url(#fatGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>

      <p className="text-[10px] text-gray-600 text-center">
        Estimates based on Mifflin-St Jeor equation. Actual results vary with genetics, adherence, and training intensity.
      </p>
    </Card>
  );
}
