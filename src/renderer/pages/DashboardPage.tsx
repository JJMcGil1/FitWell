/**
 * DashboardPage
 *
 * The heart of FitWell — a beautifully crafted home screen that motivates,
 * informs, and delights. Designed with Apple-level attention to detail.
 */

import React, { useEffect, useMemo } from 'react';
import { useUserStore } from '../stores/userStore';
import { useWeightStore } from '../stores/weightStore';
import { useWorkoutStore } from '../stores/workoutStore';
import { useRunStore, toMiles } from '../stores/runStore';
import { useNavigationStore } from '../stores/navigationStore';
import { format, startOfWeek, subDays, isSameDay, addDays, differenceInDays, parseISO } from 'date-fns';
import { HiOutlineChevronRight, HiOutlineCheck, HiOutlineTrophy } from 'react-icons/hi2';
import { PiFireFill, PiChartLineUpBold, PiBarbellBold } from 'react-icons/pi';
import { FaPersonRunning } from 'react-icons/fa6';
import { MdScale } from 'react-icons/md';
import { GiWeightLiftingUp, GiPodiumWinner } from 'react-icons/gi';

// ============================================
// Time-Aware Greeting
// ============================================

const getTimeGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const getMotivationalSubtext = (streak: number, hasWorkoutToday: boolean): string => {
  if (hasWorkoutToday) return "You've already crushed it today";
  if (streak >= 7) return "You're on fire! Keep the momentum going";
  if (streak >= 3) return "Great streak! Ready to extend it?";
  if (streak > 0) return "Your streak awaits — let's go!";
  return "Today's a perfect day to start fresh";
};

// ============================================
// Streak Hero Component
// ============================================

interface StreakHeroProps {
  streak: number;
  onClick: () => void;
}

// Streak achievement definitions (matching achievementStore)
const STREAK_ACHIEVEMENTS = [
  { days: 3, name: 'Three-peat', icon: 'flame' },
  { days: 7, name: 'Week Warrior', icon: 'calendar' },
  { days: 14, name: 'Two Week Titan', icon: 'bolt' },
  { days: 30, name: 'Monthly Master', icon: 'moon' },
  { days: 60, name: 'Two Month Champion', icon: 'diamond' },
  { days: 100, name: 'Century Streak', icon: 'trophy' },
  { days: 365, name: 'Year of Dedication', icon: 'crown' },
];

const StreakHero: React.FC<StreakHeroProps> = ({ streak, onClick }) => {
  // Find next achievement
  const nextAchievement = STREAK_ACHIEVEMENTS.find(a => a.days > streak);
  const prevAchievement = [...STREAK_ACHIEVEMENTS].reverse().find(a => a.days <= streak);

  const progress = nextAchievement
    ? Math.round((streak / nextAchievement.days) * 100)
    : 100;
  const daysToGo = nextAchievement ? nextAchievement.days - streak : 0;

  return (
    <button
      onClick={onClick}
      className="group relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 p-5 text-left transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/25 active:scale-[0.98]"
    >
      {/* Layered depth effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />

      {/* Ambient glow */}
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/15 blur-3xl" />

      <div className="relative flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PiFireFill className="h-5 w-5 text-white/90" />
            <p className="text-[13px] font-semibold uppercase tracking-wide text-white/80">Current Streak</p>
          </div>
          <HiOutlineChevronRight className="w-5 h-5 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Hero streak number - left aligned */}
        <div className="flex-1 flex items-center">
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-bold tracking-tighter text-white">{streak}</span>
            <span className="text-xl font-medium text-white/80">days</span>
          </div>
        </div>

        {/* Achievement sub-card */}
        {nextAchievement && (
          <div className="mt-auto rounded-xl bg-white/15 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <PiFireFill className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white">{nextAchievement.name}</p>
                <p className="text-[11px] text-white/70">{daysToGo} {daysToGo === 1 ? 'day' : 'days'} away</p>
              </div>
            </div>
            <span className="text-[15px] font-bold text-white">{progress}%</span>
          </div>
        )}

        {!nextAchievement && prevAchievement && (
          <div className="mt-auto rounded-xl bg-white/15 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <HiOutlineCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white">{prevAchievement.name}</p>
                <p className="text-[11px] text-white/70">All achievements unlocked!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </button>
  );
};

// ============================================
// Stat Card Component (Refined)
// ============================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor: 'orange' | 'blue' | 'emerald' | 'violet' | 'amber' | 'rose';
  onClick?: () => void;
}

const accentStyles = {
  orange: {
    cardBg: 'bg-gradient-to-br from-orange-50 via-amber-50/80 to-orange-50/50 dark:from-orange-950/50 dark:via-amber-950/30 dark:to-neutral-800/80',
    border: 'border-orange-200/60 dark:border-orange-800/40',
    iconBg: 'bg-gradient-to-br from-orange-400 to-orange-600',
    glow: 'shadow-orange-500/30',
    title: 'text-orange-600 dark:text-orange-400',
  },
  blue: {
    cardBg: 'bg-gradient-to-br from-blue-50 via-sky-50/80 to-blue-50/50 dark:from-blue-950/50 dark:via-sky-950/30 dark:to-neutral-800/80',
    border: 'border-blue-200/60 dark:border-blue-800/40',
    iconBg: 'bg-gradient-to-br from-blue-400 to-blue-600',
    glow: 'shadow-blue-500/30',
    title: 'text-blue-600 dark:text-blue-400',
  },
  emerald: {
    cardBg: 'bg-gradient-to-br from-emerald-50 via-teal-50/80 to-emerald-50/50 dark:from-emerald-950/50 dark:via-teal-950/30 dark:to-neutral-800/80',
    border: 'border-emerald-200/60 dark:border-emerald-800/40',
    iconBg: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    glow: 'shadow-emerald-500/30',
    title: 'text-emerald-600 dark:text-emerald-400',
  },
  violet: {
    cardBg: 'bg-gradient-to-br from-violet-50 via-purple-50/80 to-violet-50/50 dark:from-violet-950/50 dark:via-purple-950/30 dark:to-neutral-800/80',
    border: 'border-violet-200/60 dark:border-violet-800/40',
    iconBg: 'bg-gradient-to-br from-violet-400 to-violet-600',
    glow: 'shadow-violet-500/30',
    title: 'text-violet-600 dark:text-violet-400',
  },
  amber: {
    cardBg: 'bg-gradient-to-br from-amber-50 via-yellow-50/80 to-amber-50/50 dark:from-amber-950/50 dark:via-yellow-950/30 dark:to-neutral-800/80',
    border: 'border-amber-200/60 dark:border-amber-800/40',
    iconBg: 'bg-gradient-to-br from-amber-400 to-amber-600',
    glow: 'shadow-amber-500/30',
    title: 'text-amber-600 dark:text-amber-400',
  },
  rose: {
    cardBg: 'bg-gradient-to-br from-rose-50 via-pink-50/80 to-rose-50/50 dark:from-rose-950/50 dark:via-pink-950/30 dark:to-neutral-800/80',
    border: 'border-rose-200/60 dark:border-rose-800/40',
    iconBg: 'bg-gradient-to-br from-rose-400 to-rose-600',
    glow: 'shadow-rose-500/30',
    title: 'text-rose-600 dark:text-rose-400',
  },
};

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, accentColor, onClick }) => {
  const accent = accentStyles[accentColor];

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`
        group relative overflow-hidden rounded-2xl p-5 text-left
        flex-1 min-w-[200px]
        ${accent.cardBg}
        ${accent.border}
        shadow-sm
        transition-all duration-300 ease-out
        ${onClick ? 'hover:shadow-xl hover:-translate-y-0.5 cursor-pointer' : 'cursor-default'}
      `}
    >
      {/* Shine overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent dark:from-white/5" />

      {/* Content */}
      <div className="relative flex items-start justify-between">
        {/* Left side - metrics */}
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] font-semibold uppercase tracking-wide ${accent.title} mb-2`}>{title}</p>
          <p className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-[13px] text-gray-500 dark:text-neutral-400 mt-2">{subtitle}</p>
          )}
        </div>

        {/* Right side - icon badge with glow */}
        <div className={`
          w-12 h-12 rounded-2xl flex items-center justify-center
          ${accent.iconBg}
          shadow-lg ${accent.glow}
          transition-transform duration-300
          group-hover:scale-110
        `}>
          <div className="text-white">
            {icon}
          </div>
        </div>
      </div>
    </button>
  );
};

// ============================================
// Weekly Activity Visualization
// ============================================

interface WeekDayData {
  date: Date;
  dayLabel: string;
  hasActivity: boolean;
  isToday: boolean;
  isFuture: boolean;
}

interface WeeklyActivityProps {
  weekData: WeekDayData[];
  onDayClick: () => void;
}

const WeeklyActivity: React.FC<WeeklyActivityProps> = ({ weekData, onDayClick }) => {
  const completedDays = weekData.filter(d => d.hasActivity && !d.isFuture).length;
  const totalPossibleDays = weekData.filter(d => !d.isFuture).length;
  const progressPercent = totalPossibleDays > 0 ? (completedDays / 7) * 100 : 0;

  return (
    <button
      onClick={onDayClick}
      className="group relative h-full w-full overflow-hidden rounded-2xl bg-white p-6 text-left border border-gray-100/80 dark:bg-neutral-800 dark:border-neutral-700/50 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/20"
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-transparent to-transparent dark:from-neutral-700/20" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-orange-400" />
              <h3 className="text-[13px] font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-400">This Week</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {completedDays}<span className="text-lg font-medium text-gray-400 dark:text-neutral-500">/{totalPossibleDays}</span>
              <span className="text-sm font-medium text-gray-400 dark:text-neutral-500 ml-1.5">days</span>
            </p>
          </div>
          <div className="flex items-center gap-1 text-[12px] font-medium text-gray-400 dark:text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">
            View
            <HiOutlineChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Days grid */}
        <div className="flex justify-between gap-1 mb-4">
          {weekData.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              {/* Day label with strikethrough for completed */}
              <span
                className={`
                  relative text-[11px] font-semibold tracking-wide
                  ${day.hasActivity && !day.isFuture
                    ? 'text-orange-500'
                    : day.isToday
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-400 dark:text-neutral-500'
                  }
                `}
              >
                {day.dayLabel}
                {/* Strikethrough line for completed days */}
                {day.hasActivity && !day.isFuture && (
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 w-full h-[1.5px] bg-orange-400/60 rounded-full" />
                )}
              </span>

              {/* Day indicator */}
              <div
                className={`
                  relative w-9 h-9 rounded-full flex items-center justify-center
                  transition-all duration-300
                  ${day.isFuture
                    ? 'bg-gray-100/60 dark:bg-neutral-700/30'
                    : day.hasActivity
                      ? 'bg-gradient-to-br from-orange-400 to-orange-500 shadow-md shadow-orange-500/25'
                      : day.isToday
                        ? 'bg-gray-100 dark:bg-neutral-700 ring-2 ring-orange-400 ring-offset-2 ring-offset-white dark:ring-offset-neutral-800'
                        : 'bg-gray-100 dark:bg-neutral-700'
                  }
                `}
              >
                {day.hasActivity && !day.isFuture ? (
                  <HiOutlineCheck className="w-4 h-4 text-white" strokeWidth={2.5} />
                ) : (
                  <span className={`text-[11px] font-medium ${day.isFuture ? 'text-gray-300 dark:text-neutral-600' : day.isToday ? 'text-gray-600 dark:text-neutral-300' : 'text-gray-400 dark:text-neutral-500'}`}>
                    {format(day.date, 'd')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="relative h-1.5 bg-gray-100 dark:bg-neutral-700 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </button>
  );
};


// ============================================
// Main Dashboard Page
// ============================================

export const DashboardPage: React.FC = () => {
  const { currentUser } = useUserStore();
  const { entries: weightEntries, fetchEntries, getLatestWeight } = useWeightStore();
  const { workouts, fetchWorkouts, getWorkoutStats } = useWorkoutStore();
  const { runs, fetchRuns } = useRunStore();
  const { navigate } = useNavigationStore();

  // Fetch data on mount
  useEffect(() => {
    if (currentUser) {
      fetchEntries(currentUser.id);
      fetchWorkouts(currentUser.id);
      fetchRuns(currentUser.id);
    }
  }, [currentUser?.id]);

  // Calculate stats
  const workoutStats = useMemo(() => getWorkoutStats(), [workouts]);
  const latestWeight = useMemo(() => getLatestWeight(), [weightEntries]);

  // Calculate combined activity stats (workouts + cardio = unique active days)
  const activityStats = useMemo(() => {
    const now = new Date();
    const startOfMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);

    const allActivityDates = [
      ...workouts.map(w => w.date),
      ...runs.map(r => r.date),
    ];

    const uniqueTotal = new Set(allActivityDates).size;
    const uniqueThisMonth = new Set(
      allActivityDates.filter(d => new Date(d) >= startOfMonthDate)
    ).size;

    return { total: uniqueTotal, thisMonth: uniqueThisMonth };
  }, [workouts, runs]);

  // Calculate current streak (workouts + cardio sessions)
  const currentStreak = useMemo(() => {
    if (workouts.length === 0 && runs.length === 0) return 0;
    const activityDates = new Set([
      ...workouts.map(w => w.date),
      ...runs.map(r => r.date),
    ]);
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const checkDate = format(subDays(today, i), 'yyyy-MM-dd');
      if (activityDates.has(checkDate)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }, [workouts, runs]);

  // Check if user has activity today (workout or cardio)
  const hasWorkoutToday = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return workouts.some(w => w.date === today) || runs.some(r => r.date === today);
  }, [workouts, runs]);

  const totalMiles = useMemo(() => {
    return runs.reduce((sum, run) => sum + toMiles(run.distance, run.distanceUnit || 'miles'), 0);
  }, [runs]);

  // Calculate activity percentage since first activity (workouts + cardio)
  const workoutPercentage = useMemo(() => {
    if (workouts.length === 0 && runs.length === 0) return { percentage: 0, totalDays: 0, workoutDays: 0 };

    // Get unique activity dates (workouts + runs)
    const uniqueDates = new Set([
      ...workouts.map(w => w.date),
      ...runs.map(r => r.date),
    ]);
    const workoutDays = uniqueDates.size;

    // Find the earliest activity date
    const sortedDates = [...uniqueDates].sort();
    const firstWorkoutDate = parseISO(sortedDates[0]);
    const today = new Date();

    // Calculate total days since first activity (inclusive)
    const totalDays = differenceInDays(today, firstWorkoutDate) + 1;

    // Calculate percentage
    const percentage = Math.round((workoutDays / totalDays) * 100);

    return { percentage, totalDays, workoutDays };
  }, [workouts, runs]);

  // Calculate total volume lifted (reps × weight across all sets)
  const totalVolume = useMemo(() => {
    let volume = 0;
    let totalSets = 0;

    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        if (exercise.sets) {
          for (const set of exercise.sets) {
            if (set.completed && set.reps && set.weight) {
              volume += set.reps * set.weight;
              totalSets++;
            }
          }
        }
      }
    }

    // Format the volume nicely (e.g., 142.5k for 142,500)
    const formatVolume = (v: number): string => {
      if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
      if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
      return v.toString();
    };

    return { raw: volume, formatted: formatVolume(volume), totalSets };
  }, [workouts]);

  // Calculate best (longest) streak ever (workouts + cardio)
  const bestStreak = useMemo(() => {
    if (workouts.length === 0 && runs.length === 0) return 0;

    const activityDates = [...new Set([
      ...workouts.map(w => w.date),
      ...runs.map(r => r.date),
    ])].sort();

    if (activityDates.length === 0) return 0;

    let longest = 1;
    let current = 1;

    for (let i = 1; i < activityDates.length; i++) {
      const prevDate = parseISO(activityDates[i - 1]);
      const currDate = parseISO(activityDates[i]);
      const daysDiff = differenceInDays(currDate, prevDate);

      if (daysDiff === 1) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 1;
      }
    }

    return longest;
  }, [workouts, runs]);

  // Build weekly data for visualization
  const weekData = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today);
    const workoutDates = new Set(workouts.map(w => w.date));
    const runDates = new Set(runs.map(r => r.date));

    const days: WeekDayData[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      days.push({
        date,
        dayLabel: format(date, 'EEE').charAt(0),
        hasActivity: workoutDates.has(dateStr) || runDates.has(dateStr),
        isToday: isSameDay(date, today),
        isFuture: date > today,
      });
    }
    return days;
  }, [workouts, runs]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* ===== Header Section ===== */}
        <header className="space-y-1">
          <h1 className="text-[28px] font-bold tracking-tight text-gray-900 dark:text-white">
            {getTimeGreeting()}{currentUser?.firstName ? `, ${currentUser.firstName}` : ''}
          </h1>
          <p className="text-[15px] text-gray-500 dark:text-neutral-400">
            {getMotivationalSubtext(currentStreak, hasWorkoutToday)}
          </p>
        </header>

        {/* ===== Hero Row: Streak + Weekly Activity ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 auto-rows-fr">
          <div className="lg:col-span-2 h-full">
            <StreakHero streak={currentStreak} onClick={() => navigate('calendar')} />
          </div>
          <div className="lg:col-span-3 h-full">
            <WeeklyActivity weekData={weekData} onDayClick={() => navigate('calendar')} />
          </div>
        </div>

        {/* ===== Stats Grid ===== */}
        <div className="flex flex-wrap gap-4">
          <StatCard
            title="Workouts"
            value={activityStats.total}
            subtitle={`${activityStats.thisMonth} this month`}
            icon={<GiWeightLiftingUp className="w-6 h-6" />}
            accentColor="orange"
            onClick={() => navigate('calendar')}
          />

          <StatCard
            title="Cardio"
            value={`${totalMiles.toFixed(2)} mi`}
            subtitle={`${runs.length} total entries`}
            icon={<FaPersonRunning className="w-6 h-6" />}
            accentColor="blue"
            onClick={() => navigate('running')}
          />

          <StatCard
            title="Weight"
            value={latestWeight ? `${latestWeight.weight}` : '—'}
            subtitle={latestWeight ? latestWeight.unit : 'No entries yet'}
            icon={<MdScale className="w-6 h-6" />}
            accentColor="emerald"
            onClick={() => navigate('weight')}
          />

          <StatCard
            title="Consistency"
            value={`${workoutPercentage.percentage}%`}
            subtitle={`${workoutPercentage.workoutDays} of ${workoutPercentage.totalDays} days`}
            icon={<PiChartLineUpBold className="w-6 h-6" />}
            accentColor="violet"
            onClick={() => navigate('calendar')}
          />
        </div>

      </div>
    </div>
  );
};
