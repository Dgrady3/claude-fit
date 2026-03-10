import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subDays, isSameDay, parseISO, formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  useDailyReports,
  useWorkoutSessions,
  useNutritionEntries,
  useWorkoutPrograms,
} from '../api/hooks';
import Card from '../components/Card';
import ReadinessBanner from '../components/ReadinessBanner';
import InsightCard from '../components/InsightCard';

// ─── Animation Variants ─────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

// ─── Greeting Helper ────────────────────────────────────────
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ═════════════════════════════════════════════════════════════
// Dashboard — Trainerize-style "Today" View
// ═════════════════════════════════════════════════════════════
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // ─── Data Fetching ────────────────────────────────────────
  const { data: reports } = useDailyReports();
  const { data: sessions } = useWorkoutSessions(1);
  const { data: nutrition } = useNutritionEntries(todayStr, todayStr);
  const { data: programs } = useWorkoutPrograms();

  // ─── Normalize Arrays ─────────────────────────────────────
  const allSessions = Array.isArray(sessions) ? sessions : [];
  const todayNutrition = Array.isArray(nutrition) ? nutrition : [];
  const allReports = Array.isArray(reports) ? reports : [];
  const allPrograms = Array.isArray(programs) ? programs : [];

  // ─── Today's Report ───────────────────────────────────────
  const todayReport = allReports.find((r) => r.date === todayStr);
  const recoveryScore =
    todayReport?.domain_scores?.recovery ?? todayReport?.overall_score ?? null;

  // ─── Today's Sessions ─────────────────────────────────────
  const todaySessions = useMemo(
    () =>
      allSessions.filter((s) => {
        const d = s.started_at || s.created_at;
        return d && isSameDay(parseISO(d), today);
      }),
    [allSessions, todayStr]
  );
  const todayCompleted = todaySessions.some((s) => s.completed_at);
  const todayVolume = todaySessions.reduce(
    (sum, s) => sum + (Number(s.total_volume) || 0),
    0
  );

  // ─── Active Program ───────────────────────────────────────
  const activeProgram = allPrograms[0] || null;

  // ─── Macro Totals ─────────────────────────────────────────
  const macros = useMemo(() => {
    return todayNutrition.reduce(
      (acc, e) => ({
        calories: acc.calories + (Number(e.calories) || 0),
        protein: acc.protein + (Number(e.protein_g) || 0),
        carbs: acc.carbs + (Number(e.carbs_g) || 0),
        fat: acc.fat + (Number(e.fat_g) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [todayNutrition]);

  const calorieTarget = user?.daily_calorie_target || 2400;
  const caloriePct = calorieTarget > 0 ? Math.min((macros.calories / calorieTarget) * 100, 100) : 0;

  // ─── Weekly Dots (past 7 days) ────────────────────────────
  const weekDots = useMemo(() => {
    const dots = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dayLabel = format(date, 'EEEEE'); // single letter
      const trained = allSessions.some((s) => {
        const d = s.started_at || s.created_at;
        return d && isSameDay(parseISO(d), date);
      });
      dots.push({ dayLabel, trained, isToday: i === 0 });
    }
    return dots;
  }, [allSessions, todayStr]);

  // ─── Recent Workouts (max 3) ──────────────────────────────
  const recentSessions = allSessions.slice(0, 3);
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* ─── Section 1: Greeting ───────────────────────────────── */}
      <motion.div variants={item} className="pt-1">
        <h1 className="text-2xl font-bold text-gray-100">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{format(today, 'EEEE, MMMM d')}</p>
      </motion.div>

      {/* ─── Readiness Banner ─────────────────────────────────── */}
      <motion.div variants={item}>
        <ReadinessBanner />
      </motion.div>

      {/* ─── Root Cause Insight ─────────────────────────────────── */}
      <motion.div variants={item}>
        <InsightCard />
      </motion.div>

      {/* ─── Section 2: Today's Plan ───────────────────────────── */}

      {/* Workout Card */}
      <motion.div variants={item}>
        <Card
          animate={false}
          className="cursor-pointer hover:border-cyan-500/30 transition-colors"
          onClick={() => navigate('/programs')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                {todayCompleted ? (
                  <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 12h4l1-3h8l1 3h4M7 12V8a1 1 0 011-1h8a1 1 0 011 1v4"
                    />
                    <circle cx="6" cy="12" r="2" strokeWidth={1.5} />
                    <circle cx="18" cy="12" r="2" strokeWidth={1.5} />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">
                  Today's Workout
                </p>
                {todayCompleted ? (
                  <p className="text-sm font-medium text-emerald-400">
                    Completed{todayVolume > 0 ? ` \u2014 ${todayVolume.toLocaleString()} lbs` : ''}
                  </p>
                ) : (
                  <p className="text-sm font-medium text-gray-100">
                    {activeProgram ? activeProgram.name : 'Choose a program'}
                  </p>
                )}
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Card>
      </motion.div>

      {/* Nutrition Card */}
      <motion.div variants={item}>
        <Card
          animate={false}
          className="cursor-pointer hover:border-cyan-500/30 transition-colors"
          onClick={() => navigate('/nutrition')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 3c-1.5 0-3 1.5-3 4 0 2 1 3.5 3 4.5 2-1 3-2.5 3-4.5 0-2.5-1.5-4-3-4zM9 16h6M10 20h4M12 11.5V20"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Nutrition</p>
                {todayNutrition.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-100">
                        {Math.round(macros.calories).toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500">
                        / {calorieTarget.toLocaleString()} kcal
                      </span>
                    </div>
                    {/* Calorie progress bar */}
                    <div className="w-full h-1.5 bg-dark-700 rounded-full overflow-hidden mb-2">
                      <motion.div
                        className="h-full rounded-full bg-cyan-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${caloriePct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                      />
                    </div>
                    {/* Macro pills */}
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{Math.round(macros.protein)}g P</span>
                      <span className="text-gray-600">&middot;</span>
                      <span>{Math.round(macros.carbs)}g C</span>
                      <span className="text-gray-600">&middot;</span>
                      <span>{Math.round(macros.fat)}g F</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">No meals logged yet</p>
                )}
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-500 shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Card>
      </motion.div>

      {/* Recovery Card */}
      <motion.div variants={item}>
        <Card
          animate={false}
          className="cursor-pointer hover:border-cyan-500/30 transition-colors"
          onClick={() => navigate('/reports')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Recovery</p>
                {recoveryScore != null ? (
                  <p className="text-sm font-medium text-gray-100">
                    Score:{' '}
                    <span
                      className={
                        recoveryScore >= 7
                          ? 'text-emerald-400'
                          : recoveryScore >= 4
                          ? 'text-amber-400'
                          : 'text-red-400'
                      }
                    >
                      {recoveryScore}/10
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Connect Oura to track recovery</p>
                )}
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Card>
      </motion.div>

      {/* ─── Section 3: Weekly Overview ────────────────────────── */}
      <motion.div variants={item}>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          This Week
        </h2>
        <div className="flex items-center justify-between px-2">
          {weekDots.map((dot, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  dot.trained
                    ? 'bg-cyan-400'
                    : dot.isToday
                    ? 'bg-dark-700 ring-1 ring-gray-500'
                    : 'bg-dark-700'
                }`}
              >
                {dot.trained && (
                  <svg className="w-4 h-4 text-dark-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span
                className={`text-[11px] font-medium ${
                  dot.isToday ? 'text-cyan-400' : dot.trained ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                {dot.dayLabel}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ─── Section 4: Recent Activity ────────────────────────── */}
      <motion.div variants={item}>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Recent
        </h2>
        {recentSessions.length > 0 ? (
          <div className="space-y-2">
            {recentSessions.map((s) => {
              const startDate = s.started_at || s.created_at;
              const programName = s.workout_program?.name || s.program_name || 'Workout';
              const timeAgo = startDate
                ? formatDistanceToNow(parseISO(startDate), { addSuffix: true })
                : '';

              return (
                <Card
                  key={s.id}
                  animate={false}
                  padding="px-5 py-4"
                  className="flex items-center justify-between cursor-pointer hover:border-cyan-500/30 transition-colors"
                  onClick={() => navigate('/workout/history')}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{programName}</p>
                    <p className="text-xs text-gray-500">{timeAgo}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    {s.highlights?.length > 0 ? (
                      <div className="space-y-0.5">
                        {s.highlights.slice(0, 2).map((h, i) => (
                          <p key={i} className="text-xs text-gray-400">
                            <span className="text-gray-300 font-medium">{h.exercise}</span>{' '}
                            <span className="font-mono text-cyan-400">{h.weight}×{h.reps}</span>
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm font-mono text-gray-500">--</p>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card animate={false} className="text-center">
            <p className="text-sm text-gray-500">No workouts yet</p>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
}
