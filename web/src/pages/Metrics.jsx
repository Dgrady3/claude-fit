import { useState } from 'react';
import { useMetrics } from '../api/hooks';
import Card from '../components/Card';
import QueryError from '../components/QueryError';
import LiftProgressionChart from '../components/charts/LiftProgressionChart';
import VolumeTrendChart from '../components/charts/VolumeTrendChart';
import WorkoutFrequencyDots from '../components/charts/WorkoutFrequencyDots';
import SleepScoreChart from '../components/charts/SleepScoreChart';
import SleepStagesChart from '../components/charts/SleepStagesChart';
import HRVTrendChart from '../components/charts/HRVTrendChart';
import RestingHRChart from '../components/charts/RestingHRChart';
import CaloriesVsTargetChart from '../components/charts/CaloriesVsTargetChart';
import MacroTrendChart from '../components/charts/MacroTrendChart';
import ProteinPerLbChart from '../components/charts/ProteinPerLbChart';
import StepsChart from '../components/charts/StepsChart';
import ActiveCaloriesChart from '../components/charts/ActiveCaloriesChart';
import BodyCompSimulator from '../components/BodyCompSimulator';

const RANGES = [
  { key: '7d', label: 'Week' },
  { key: '30d', label: 'Month' },
  { key: '90d', label: 'Quarter' },
];

function SectionHeader({ title }) {
  return (
    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-3 first:mt-0">
      {title}
    </h2>
  );
}

function ChartCard({ title, children }) {
  return (
    <Card className="space-y-3">
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
      {children}
    </Card>
  );
}

export default function Metrics() {
  const [range, setRange] = useState('30d');
  const { data, isLoading, error, refetch } = useMetrics(range);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return <QueryError error={error} onRetry={refetch} message="Failed to load metrics" />;
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Header + Time Tabs */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-100">Metrics</h1>
        <div className="flex gap-1 bg-dark-800 rounded-lg p-1">
          {RANGES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                range === key
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Training Section */}
      <SectionHeader title="Training" />
      <ChartCard title="Lift Progression">
        <LiftProgressionChart
          exerciseHistory={data?.training?.exercise_history}
          exercises={data?.training?.exercises}
        />
      </ChartCard>
      <ChartCard title="Volume Trend">
        <VolumeTrendChart sessions={data?.training?.sessions} />
      </ChartCard>
      <ChartCard title="Workout Frequency">
        <WorkoutFrequencyDots sessions={data?.training?.sessions} range={range} />
      </ChartCard>

      {/* Recovery Section */}
      <SectionHeader title="Recovery" />
      <ChartCard title="Sleep Score & Duration">
        <SleepScoreChart data={data?.recovery?.sleep} />
      </ChartCard>
      <ChartCard title="Sleep Stages">
        <SleepStagesChart data={data?.recovery?.sleep} />
      </ChartCard>
      <ChartCard title="HRV Trend">
        <HRVTrendChart data={data?.recovery?.readiness} />
      </ChartCard>
      <ChartCard title="Resting Heart Rate">
        <RestingHRChart data={data?.recovery?.readiness} />
      </ChartCard>

      {/* Nutrition Section */}
      <SectionHeader title="Nutrition" />
      <ChartCard title="Calories vs Target">
        <CaloriesVsTargetChart
          data={data?.nutrition?.daily}
          target={data?.nutrition?.targets?.calories}
        />
      </ChartCard>
      <ChartCard title="Macro Breakdown">
        <MacroTrendChart data={data?.nutrition?.daily} />
      </ChartCard>
      <ChartCard title="Protein per lb Bodyweight">
        <ProteinPerLbChart
          data={data?.nutrition?.daily}
          bodyWeight={data?.user?.body_weight_lbs}
        />
      </ChartCard>

      {/* Activity Section */}
      <SectionHeader title="Activity" />
      <ChartCard title="Daily Steps">
        <StepsChart data={data?.activity?.daily} />
      </ChartCard>
      <ChartCard title="Active Calories">
        <ActiveCaloriesChart data={data?.activity?.daily} />
      </ChartCard>

      {/* Projections Section */}
      <SectionHeader title="Projections" />
      <BodyCompSimulator
        currentWeight={data?.user?.body_weight_lbs || 185}
        bodyFatPct={20}
      />
    </div>
  );
}
