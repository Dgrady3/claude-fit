import { useState, useMemo } from 'react';
import { format, addDays, subDays, isToday as isTodayFn } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useNutritionEntries, useDeleteNutritionEntry } from '../api/hooks';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import AddFood from './AddFood';
import ImportCSV from './ImportCSV';
import toast from 'react-hot-toast';

const MEAL_ORDER = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

const MEAL_ICONS = {
  Breakfast: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  ),
  Lunch: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.126-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265z" />
    </svg>
  ),
  Dinner: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
    </svg>
  ),
  Snacks: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  ),
};

// ---------- Calorie Ring (SVG arc) ----------
function CalorieRing({ consumed, target }) {
  const radius = 72;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const pct = target > 0 ? Math.min(1, consumed / target) : 0;
  const remaining = Math.max(0, target - consumed);
  const isOver = consumed > target;
  const isClose = pct > 0.9 && !isOver;

  const ringColor = isOver
    ? 'var(--color-red-400)'
    : isClose
      ? 'var(--color-amber-400)'
      : 'var(--color-cyan-400)';

  const textColor = isOver
    ? 'text-red-400'
    : isClose
      ? 'text-amber-400'
      : 'text-cyan-400';

  const displayNumber = isOver ? consumed - target : remaining;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={(radius + stroke) * 2}
        height={(radius + stroke) * 2}
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          fill="none"
          stroke="var(--color-dark-600)"
          strokeWidth={stroke}
        />
        {/* Progress arc */}
        <motion.circle
          cx={radius + stroke}
          cy={radius + stroke}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            filter: `drop-shadow(0 0 6px ${ringColor}40)`,
          }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={displayNumber}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`text-4xl font-mono font-bold ${textColor}`}
        >
          {isOver ? '+' : ''}{Math.round(displayNumber)}
        </motion.span>
        <span className="text-xs text-gray-500 mt-0.5">
          {isOver ? 'over' : 'remaining'}
        </span>
      </div>
    </div>
  );
}

// ---------- Macro Progress Bar ----------
function MacroBar({ label, icon, current, target, color, glowColor }) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      {/* Label + icon */}
      <div className="flex items-center gap-1.5 w-20 shrink-0">
        <span className={color.replace('bg-', 'text-')}>{icon}</span>
        <span className="text-xs text-gray-400 font-medium">{label}</span>
      </div>

      {/* Bar track */}
      <div className="flex-1 h-2.5 bg-dark-600 rounded-full overflow-hidden relative">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            boxShadow: `0 0 8px ${glowColor}30`,
          }}
        />
      </div>

      {/* Values */}
      <span className="text-xs font-mono text-gray-300 w-24 text-right shrink-0">
        {Math.round(current)}g
        <span className="text-gray-600"> / {target}g</span>
      </span>
    </div>
  );
}

// ---------- Food Entry Row ----------
function FoodRow({ entry, onDelete, isDeleting, demoMode }) {
  const cals = entry.calories || 0;
  const protein = entry.protein_g ?? entry.protein_grams ?? 0;
  const carbs = entry.carbs_g ?? entry.carb_grams ?? 0;
  const fat = entry.fat_g ?? entry.fat_grams ?? 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className="group flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-dark-700/50 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-200 truncate">{entry.food_name}</p>
        <p className="text-xs text-gray-600 font-mono mt-0.5">
          {Math.round(protein)}p &middot; {Math.round(carbs)}c &middot; {Math.round(fat)}f
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-3">
        <span className="text-sm font-mono text-gray-300">{Math.round(cals)}</span>

        {!demoMode && (
          <button
            onClick={() => onDelete(entry.id)}
            disabled={isDeleting}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded hover:bg-red-400/10 text-gray-600 hover:text-red-400 transition-all"
            aria-label={`Delete ${entry.food_name}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ---------- Main Component ----------
export default function Nutrition() {
  const { user, demoMode } = useAuth();
  const [date, setDate] = useState(new Date());
  const [showAddFood, setShowAddFood] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const dateStr = format(date, 'yyyy-MM-dd');
  const { data, isLoading } = useNutritionEntries(dateStr, dateStr);
  const deleteEntry = useDeleteNutritionEntry();

  const entries = Array.isArray(data) ? data : [];

  const isToday = isTodayFn(date);

  // User goals with defaults
  const targetCalories = user?.daily_calories || user?.daily_calorie_target || 2400;
  const targetProtein = user?.daily_protein_g || user?.daily_protein_target || 180;
  // Estimate carb/fat targets from remaining calories if not set
  const proteinCals = targetProtein * 4;
  const targetFat = user?.daily_fat_g || Math.round((targetCalories * 0.3) / 9);
  const fatCals = targetFat * 9;
  const targetCarbs = user?.daily_carbs_g || Math.round((targetCalories - proteinCals - fatCals) / 4);

  // Totals
  const totals = useMemo(() => {
    return entries.reduce(
      (acc, e) => ({
        calories: acc.calories + (e.calories || 0),
        protein: acc.protein + (e.protein_g ?? e.protein_grams ?? 0),
        carbs: acc.carbs + (e.carbs_g ?? e.carb_grams ?? 0),
        fat: acc.fat + (e.fat_g ?? e.fat_grams ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [entries]);

  // Group by meal
  const mealGroups = useMemo(() => {
    const groups = {};
    entries.forEach((e) => {
      const meal = e.meal_name || 'Snacks';
      if (!groups[meal]) groups[meal] = [];
      groups[meal].push(e);
    });
    return groups;
  }, [entries]);

  const handleDelete = async (id) => {
    try {
      await deleteEntry.mutateAsync(id);
      toast.success('Entry removed');
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-5 pb-24">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-100">Nutrition</h1>
        {!demoMode && (
          <Button variant="ghost" size="sm" onClick={() => setShowImport(true)}>
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Import CSV
          </Button>
        )}
      </div>

      {/* ── Date Navigator ── */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setDate((d) => subDays(d, 1))}
          className="p-2 rounded-lg hover:bg-dark-700 active:bg-dark-600 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={() => setDate(new Date())}
          className="text-sm font-medium text-gray-200 hover:text-cyan-400 transition-colors px-4 py-1.5 rounded-lg hover:bg-dark-700"
        >
          {isToday ? `Today, ${format(date, 'MMM d')}` : format(date, 'EEEE, MMM d')}
        </button>

        <button
          onClick={() => setDate((d) => addDays(d, 1))}
          className="p-2 rounded-lg hover:bg-dark-700 active:bg-dark-600 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* ── Calorie Hero (Carbon-style ring) ── */}
      <Card className="flex flex-col items-center py-6">
        <CalorieRing consumed={totals.calories} target={targetCalories} />
        <p className="text-sm text-gray-500 mt-3 font-mono">
          <span className="text-gray-300">{Math.round(totals.calories)}</span>
          {' consumed of '}
          <span className="text-gray-300">{targetCalories}</span>
        </p>
      </Card>

      {/* ── Macro Progress Bars (Cronometer-style) ── */}
      <Card className="space-y-3">
        <MacroBar
          label="Protein"
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          }
          current={totals.protein}
          target={targetProtein}
          color="bg-cyan-400"
          glowColor="#22d3ee"
        />
        <MacroBar
          label="Carbs"
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
            </svg>
          }
          current={totals.carbs}
          target={targetCarbs}
          color="bg-amber-400"
          glowColor="#fbbf24"
        />
        <MacroBar
          label="Fat"
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          }
          current={totals.fat}
          target={targetFat}
          color="bg-emerald-400"
          glowColor="#34d399"
        />
      </Card>

      {/* ── Food Log ── */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full" />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          title="No meals logged"
          description={demoMode ? "No meals have been logged for this day." : "Log your first meal to start tracking your macros."}
          actionLabel={demoMode ? undefined : "Log your first meal"}
          onAction={demoMode ? undefined : () => setShowAddFood(true)}
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          }
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          className="space-y-3"
        >
          {MEAL_ORDER.map((meal) => {
            const items = mealGroups[meal];
            if (!items?.length) return null;
            const mealCals = items.reduce((sum, e) => sum + (e.calories || 0), 0);

            return (
              <motion.div
                key={meal}
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
              >
                <Card animate={false} className="!p-0 overflow-hidden">
                  {/* Meal header */}
                  <div className="flex items-center justify-between px-4 pt-3 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">{MEAL_ICONS[meal]}</span>
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {meal}
                      </h3>
                    </div>
                    <span className="text-xs text-gray-500 font-mono">
                      {Math.round(mealCals)} cal
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-dark-600/50 mx-3" />

                  {/* Food items */}
                  <div className="px-1 py-1">
                    <AnimatePresence mode="popLayout">
                      {items.map((entry) => (
                        <FoodRow
                          key={entry.id}
                          entry={entry}
                          onDelete={handleDelete}
                          isDeleting={deleteEntry.isPending}
                          demoMode={demoMode}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ── Add Food FAB ── */}
      {!demoMode && (
        <motion.button
          onClick={() => setShowAddFood(true)}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 w-14 h-14 rounded-full bg-cyan-500 hover:bg-cyan-400 text-dark-900 shadow-lg shadow-cyan-500/25 flex items-center justify-center transition-colors z-30"
        >
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </motion.button>
      )}

      {/* ── Modals ── */}
      <AddFood
        isOpen={showAddFood}
        onClose={() => setShowAddFood(false)}
        date={dateStr}
      />

      <ImportCSV
        isOpen={showImport}
        onClose={() => setShowImport(false)}
      />
    </div>
  );
}
