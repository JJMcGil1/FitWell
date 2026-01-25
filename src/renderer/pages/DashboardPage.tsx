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
import { useRunStore } from '../stores/runStore';
import { useAchievementStore } from '../stores/achievementStore';
import { useNavigationStore } from '../stores/navigationStore';
import { format, startOfWeek, endOfWeek, isWithinInterval, subDays, isSameDay, addDays } from 'date-fns';
import { HiOutlineTrophy, HiOutlineChevronRight, HiOutlineCheck, HiOutlineClock } from 'react-icons/hi2';
import { PiFireFill } from 'react-icons/pi';
import { FaPersonRunning } from 'react-icons/fa6';
import { MdScale } from 'react-icons/md';
import { GiWeightLiftingUp } from 'react-icons/gi';

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

const StreakHero: React.FC<StreakHeroProps> = ({ streak, onClick }) => (
  <button
    onClick={onClick}
    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-500 to-amber-500 p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/20 active:scale-[0.98]"
  >
    {/* Animated background glow */}
    <div className="absolute inset-0 bg-gradient-to-t from-orange-600/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

    {/* Decorative fire elements */}
    <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
    <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-amber-400/20 blur-3xl" />

    <div className="relative flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-white/80">Current Streak</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-5xl font-bold tracking-tight text-white">{streak}</span>
          <span className="text-2xl font-semibold text-white/90">days</span>
        </div>
        <p className="mt-2 text-sm text-white/70">
          {streak === 0 ? "Start your journey today!" : streak === 1 ? "Great start! Keep going!" : "You're building something great"}
        </p>
      </div>

      {/* Animated fire icon */}
      <div className="relative">
        <div className="absolute inset-0 animate-pulse rounded-full bg-white/20 blur-xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <PiFireFill className="h-10 w-10 text-white drop-shadow-lg" />
        </div>
      </div>
    </div>
  </button>
);

// ============================================
// Stat Card Component (Refined)
// ============================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor: string;
  iconBg: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, accentColor, iconBg, onClick }) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={`
      group relative overflow-hidden rounded-xl bg-white p-5 text-left
      shadow-sm border border-gray-100
      transition-all duration-200 ease-out
      dark:bg-neutral-800 dark:border-neutral-700/50
      ${onClick ? 'hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20 hover:border-gray-200 dark:hover:border-neutral-600 cursor-pointer' : 'cursor-default'}
    `}
  >
    {/* Subtle accent line */}
    <div className={`absolute left-0 top-0 h-full w-1 ${accentColor} opacity-0 transition-opacity duration-200 group-hover:opacity-100`} />

    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-[13px] font-medium text-gray-500 dark:text-neutral-400">{title}</p>
        <p className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{value}</p>
        {subtitle && (
          <p className="text-[12px] text-gray-400 dark:text-neutral-500">{subtitle}</p>
        )}
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg} transition-transform duration-200 group-hover:scale-110`}>
        {icon}
      </div>
    </div>
  </button>
);

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

  return (
    <button
      onClick={onDayClick}
      className="group w-full rounded-xl bg-white p-5 shadow-sm border border-gray-100 dark:bg-neutral-800 dark:border-neutral-700/50 text-left transition-all duration-200 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">This Week</h3>
          <p className="text-[12px] text-gray-500 dark:text-neutral-400 mt-0.5">
            {completedDays} of {totalPossibleDays} days active
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 dark:text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
          View calendar
          <HiOutlineChevronRight className="w-4 h-4" />
        </div>
      </div>

      <div className="flex justify-between gap-2">
        {weekData.map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <span className={`text-[11px] font-medium ${day.isToday ? 'text-orange-500' : 'text-gray-400 dark:text-neutral-500'}`}>
              {day.dayLabel}
            </span>
            <div
              className={`
                relative w-full aspect-square max-w-[40px] rounded-lg flex items-center justify-center
                transition-all duration-200
                ${day.isFuture
                  ? 'bg-gray-50 dark:bg-neutral-700/30'
                  : day.hasActivity
                    ? 'bg-gradient-to-br from-orange-400 to-orange-500 shadow-sm shadow-orange-500/30'
                    : 'bg-gray-100 dark:bg-neutral-700'
                }
                ${day.isToday && !day.hasActivity ? 'ring-2 ring-orange-400 ring-offset-2 dark:ring-offset-neutral-800' : ''}
              `}
            >
              {day.hasActivity && !day.isFuture && (
                <HiOutlineCheck className="w-4 h-4 text-white" strokeWidth={3} />
              )}
              {day.isFuture && (
                <span className="text-[10px] text-gray-300 dark:text-neutral-600">{format(day.date, 'd')}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </button>
  );
};

// ============================================
// Quick Action Button (Elevated)
// ============================================

interface QuickActionProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ label, description, icon, color, onClick }) => (
  <button
    onClick={onClick}
    className="group flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700/50 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-neutral-600 transition-all duration-200 text-left w-full"
  >
    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} transition-transform duration-200 group-hover:scale-110`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[14px] font-semibold text-gray-900 dark:text-white">{label}</p>
      <p className="text-[12px] text-gray-500 dark:text-neutral-400 mt-0.5">{description}</p>
    </div>
    <HiOutlineChevronRight className="w-5 h-5 text-gray-300 dark:text-neutral-600 group-hover:text-gray-400 dark:group-hover:text-neutral-500 transition-colors" />
  </button>
);

// ============================================
// Activity Item (Refined)
// ============================================

interface ActivityItemProps {
  type: 'workout' | 'run' | 'weight';
  title: string;
  subtitle: string;
  date: string;
  isNew?: boolean;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ type, title, subtitle, date, isNew }) => {
  const getIcon = () => {
    switch (type) {
      case 'workout':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-500/20">
            <GiWeightLiftingUp className="w-5 h-5 text-orange-500" />
          </div>
        );
      case 'run':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-500/20">
            <FaPersonRunning className="w-5 h-5 text-blue-500" />
          </div>
        );
      case 'weight':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
            <MdScale className="w-5 h-5 text-emerald-500" />
          </div>
        );
    }
  };

  return (
    <div className="flex items-center gap-4 py-3 group">
      {getIcon()}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[14px] font-medium text-gray-900 dark:text-white truncate">{title}</p>
          {isNew && (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-600 bg-orange-100 dark:bg-orange-500/20 dark:text-orange-400 rounded">
              New
            </span>
          )}
        </div>
        <p className="text-[12px] text-gray-500 dark:text-neutral-400">{subtitle}</p>
      </div>
      <span className="text-[12px] text-gray-400 dark:text-neutral-500 tabular-nums">{date}</span>
    </div>
  );
};

// ============================================
// Achievements Preview
// ============================================

interface AchievementsPreviewProps {
  unlocked: number;
  total: number;
  onClick: () => void;
}

const AchievementsPreview: React.FC<AchievementsPreviewProps> = ({ unlocked, total, onClick }) => {
  const progress = (unlocked / total) * 100;

  return (
    <button
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:from-amber-900/30 dark:via-orange-900/20 dark:to-amber-900/30 p-5 text-left border border-amber-200/50 dark:border-amber-700/30 transition-all duration-200 hover:shadow-lg hover:shadow-amber-200/30 dark:hover:shadow-amber-900/20"
    >
      {/* Decorative trophy glow */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-200/50 dark:bg-amber-500/10 blur-2xl" />

      <div className="relative flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[13px] font-semibold text-amber-900 dark:text-amber-200">Achievements</h3>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-amber-900 dark:text-amber-100">{unlocked}</span>
            <span className="text-lg text-amber-700 dark:text-amber-300">/ {total}</span>
          </div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 shadow-lg shadow-amber-400/30">
          <HiOutlineTrophy className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-amber-200/50 dark:bg-amber-800/30 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
        {total - unlocked} more to unlock
      </p>
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
  const { fetchStats, fetchAchievements, getUnlockedCount, getTotalCount } = useAchievementStore();
  const { navigate } = useNavigationStore();

  // Fetch data on mount
  useEffect(() => {
    if (currentUser) {
      fetchEntries(currentUser.id);
      fetchWorkouts(currentUser.id);
      fetchRuns(currentUser.id);
      fetchStats(currentUser.id);
      fetchAchievements(currentUser.id);
    }
  }, [currentUser?.id]);

  // Calculate stats
  const workoutStats = useMemo(() => getWorkoutStats(), [workouts]);
  const latestWeight = useMemo(() => getLatestWeight(), [weightEntries]);

  // Calculate current streak
  const currentStreak = useMemo(() => {
    if (workouts.length === 0) return 0;
    const workoutDates = new Set(workouts.map(w => w.date));
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const checkDate = format(subDays(today, i), 'yyyy-MM-dd');
      if (workoutDates.has(checkDate)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }, [workouts]);

  // Check if user has workout today
  const hasWorkoutToday = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return workouts.some(w => w.date === today);
  }, [workouts]);

  const totalMiles = useMemo(() => {
    return runs.reduce((sum, run) => sum + run.distance, 0);
  }, [runs]);

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

  // Build recent activity feed
  const recentActivity = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const activities: Array<{
      type: 'workout' | 'run' | 'weight';
      title: string;
      subtitle: string;
      date: Date;
      dateStr: string;
      isNew: boolean;
    }> = [];

    workouts.slice(0, 5).forEach((w) => {
      activities.push({
        type: 'workout',
        title: w.name,
        subtitle: `${w.exercises.length} exercises${w.duration ? ` • ${w.duration}min` : ''}`,
        date: new Date(w.date),
        dateStr: format(new Date(w.date), 'MMM d'),
        isNew: w.date === today,
      });
    });

    runs.slice(0, 5).forEach((r) => {
      activities.push({
        type: 'run',
        title: `${r.type.charAt(0).toUpperCase() + r.type.slice(1)} Run`,
        subtitle: `${r.distance.toFixed(1)} mi • ${r.duration}min`,
        date: new Date(r.date),
        dateStr: format(new Date(r.date), 'MMM d'),
        isNew: r.date === today,
      });
    });

    weightEntries.slice(0, 3).forEach((w) => {
      activities.push({
        type: 'weight',
        title: `Logged ${w.weight} ${w.unit}`,
        subtitle: 'Weight entry',
        date: new Date(w.date),
        dateStr: format(new Date(w.date), 'MMM d'),
        isNew: w.date === today,
      });
    });

    return activities.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
  }, [workouts, runs, weightEntries]);

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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2">
            <StreakHero streak={currentStreak} onClick={() => navigate('calendar')} />
          </div>
          <div className="lg:col-span-3">
            <WeeklyActivity weekData={weekData} onDayClick={() => navigate('calendar')} />
          </div>
        </div>

        {/* ===== Stats Grid ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Total Workouts"
            value={workoutStats.total}
            subtitle={`${workoutStats.thisMonth} this month`}
            icon={<GiWeightLiftingUp className="w-5 h-5 text-orange-500" />}
            accentColor="bg-orange-500"
            iconBg="bg-orange-100 dark:bg-orange-500/20"
            onClick={() => navigate('workouts')}
          />

          <StatCard
            title="Miles of Cardio"
            value={totalMiles.toFixed(1)}
            subtitle={`${runs.length} total entries`}
            icon={<FaPersonRunning className="w-5 h-5 text-blue-500" />}
            accentColor="bg-blue-500"
            iconBg="bg-blue-100 dark:bg-blue-500/20"
            onClick={() => navigate('running')}
          />

          <StatCard
            title="Current Weight"
            value={latestWeight ? `${latestWeight.weight}` : '—'}
            subtitle={latestWeight ? latestWeight.unit : 'No entries yet'}
            icon={<MdScale className="w-5 h-5 text-emerald-500" />}
            accentColor="bg-emerald-500"
            iconBg="bg-emerald-100 dark:bg-emerald-500/20"
            onClick={() => navigate('weight')}
          />
        </div>

        {/* ===== Two Column Layout ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column - Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Activity */}
            <div className="rounded-xl bg-white dark:bg-neutral-800 p-5 shadow-sm border border-gray-100 dark:border-neutral-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
                <button className="text-[13px] font-medium text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors">
                  View all
                </button>
              </div>

              {recentActivity.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-neutral-700/50">
                  {recentActivity.map((activity, idx) => (
                    <ActivityItem
                      key={idx}
                      type={activity.type}
                      title={activity.title}
                      subtitle={activity.subtitle}
                      date={activity.dateStr}
                      isNew={activity.isNew}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-700 mb-3">
                    <HiOutlineClock className="w-6 h-6 text-gray-400 dark:text-neutral-500" />
                  </div>
                  <p className="text-[14px] text-gray-500 dark:text-neutral-400">No activity yet</p>
                  <p className="text-[12px] text-gray-400 dark:text-neutral-500 mt-1">Start by logging your first workout!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Actions & Achievements */}
          <div className="space-y-5">
            {/* Quick Actions */}
            <div className="space-y-3">
              <h3 className="text-[13px] font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide px-1">
                Quick Actions
              </h3>
              <QuickAction
                label="Log Workout"
                description="Record your exercises"
                icon={<GiWeightLiftingUp className="w-6 h-6 text-white" />}
                color="bg-gradient-to-br from-orange-400 to-orange-500"
                onClick={() => navigate('workouts')}
              />
              <QuickAction
                label="Log Run"
                description="Track your cardio"
                icon={<FaPersonRunning className="w-6 h-6 text-white" />}
                color="bg-gradient-to-br from-blue-400 to-blue-500"
                onClick={() => navigate('running')}
              />
              <QuickAction
                label="Log Weight"
                description="Update your progress"
                icon={<MdScale className="w-6 h-6 text-white" />}
                color="bg-gradient-to-br from-emerald-400 to-emerald-500"
                onClick={() => navigate('weight')}
              />
            </div>

            {/* Achievements */}
            <AchievementsPreview
              unlocked={getUnlockedCount()}
              total={getTotalCount()}
              onClick={() => navigate('achievements')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
