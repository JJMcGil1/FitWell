/**
 * DashboardPage
 *
 * Home page showing fitness overview with stats, recent activity, and quick actions.
 * Aggregates data from workouts, runs, weight, and goals.
 */

import React, { useEffect, useMemo } from 'react';
import { useUserStore } from '../stores/userStore';
import { useWeightStore } from '../stores/weightStore';
import { useWorkoutStore } from '../stores/workoutStore';
import { useRunStore } from '../stores/runStore';
import { useAchievementStore } from '../stores/achievementStore';
import { useNavigationStore } from '../stores/navigationStore';
import { format, startOfWeek, endOfWeek, isWithinInterval, subDays } from 'date-fns';

// ============================================
// Stat Card Component
// ============================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color, onClick }) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={`
      bg-white dark:bg-neutral-800 rounded-xl p-5 text-left
      shadow-sm border border-gray-100 dark:border-neutral-700
      transition-all duration-200 ease-out
      ${onClick ? 'hover:shadow-md hover:scale-[1.02] cursor-pointer' : 'cursor-default'}
    `}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-neutral-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">{subtitle}</p>
        )}
      </div>
      <div className={`p-2.5 rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
  </button>
);

// ============================================
// Quick Action Button
// ============================================

interface QuickActionProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ label, icon, onClick }) => (
  <button
    onClick={onClick}
    className="
      flex items-center gap-3 px-4 py-3 rounded-lg
      bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700
      hover:bg-gray-50 dark:hover:bg-neutral-700/50 hover:border-gray-200 dark:hover:border-neutral-600
      transition-all duration-200 text-sm font-medium text-gray-700 dark:text-neutral-200
    "
  >
    <span className="text-gray-400 dark:text-neutral-500">{icon}</span>
    {label}
  </button>
);

// ============================================
// Activity Item
// ============================================

interface ActivityItemProps {
  type: 'workout' | 'run' | 'weight' | 'achievement';
  title: string;
  subtitle: string;
  date: string;
  icon: React.ReactNode;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ title, subtitle, date, icon }) => (
  <div className="flex items-center gap-4 py-3">
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{title}</p>
      <p className="text-xs text-gray-500 dark:text-neutral-400">{subtitle}</p>
    </div>
    <span className="text-xs text-gray-400 dark:text-neutral-500">{date}</span>
  </div>
);

// ============================================
// Weekly Progress Bar
// ============================================

interface WeeklyProgressProps {
  completedDays: number;
  totalDays: number;
}

const WeeklyProgress: React.FC<WeeklyProgressProps> = ({ completedDays, totalDays }) => {
  const percentage = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-neutral-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-neutral-300">This Week</h3>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {completedDays}/{totalDays} days
        </span>
      </div>
      <div className="h-3 bg-gray-100 dark:bg-neutral-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between mt-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <span
            key={i}
            className={`text-xs font-medium ${
              i < completedDays ? 'text-orange-500' : 'text-gray-400 dark:text-neutral-500'
            }`}
          >
            {day}
          </span>
        ))}
      </div>
    </div>
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

  // Calculate current streak from workouts (consecutive days with workouts)
  const currentStreak = useMemo(() => {
    if (workouts.length === 0) return 0;

    const workoutDates = new Set(workouts.map(w => w.date));
    const today = new Date();
    let streak = 0;

    // Check from today backwards
    for (let i = 0; i < 365; i++) {
      const checkDate = format(subDays(today, i), 'yyyy-MM-dd');
      if (workoutDates.has(checkDate)) {
        streak++;
      } else if (i > 0) {
        // Allow today to be missing (streak continues from yesterday)
        break;
      }
    }

    return streak;
  }, [workouts]);

  const totalMiles = useMemo(() => {
    return runs.reduce((sum, run) => sum + run.distance, 0);
  }, [runs]);

  // Calculate weekly progress
  const weeklyProgress = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);

    const thisWeekWorkouts = workouts.filter((w) => {
      const date = new Date(w.date);
      return isWithinInterval(date, { start: weekStart, end: weekEnd });
    });

    const uniqueDays = new Set(thisWeekWorkouts.map((w) => w.date)).size;
    return { completedDays: uniqueDays, totalDays: 7 };
  }, [workouts]);

  // Build recent activity feed
  const recentActivity = useMemo(() => {
    const activities: Array<{
      type: 'workout' | 'run' | 'weight';
      title: string;
      subtitle: string;
      date: Date;
      dateStr: string;
    }> = [];

    // Add workouts
    workouts.slice(0, 5).forEach((w) => {
      activities.push({
        type: 'workout',
        title: w.name,
        subtitle: `${w.exercises.length} exercises${w.duration ? ` \u2022 ${w.duration}min` : ''}`,
        date: new Date(w.date),
        dateStr: format(new Date(w.date), 'MMM d'),
      });
    });

    // Add runs
    runs.slice(0, 5).forEach((r) => {
      activities.push({
        type: 'run',
        title: `${r.type.charAt(0).toUpperCase() + r.type.slice(1)} Run`,
        subtitle: `${r.distance.toFixed(1)} mi \u2022 ${r.duration}min`,
        date: new Date(r.date),
        dateStr: format(new Date(r.date), 'MMM d'),
      });
    });

    // Add weight entries
    weightEntries.slice(0, 3).forEach((w) => {
      activities.push({
        type: 'weight',
        title: `Logged ${w.weight} ${w.unit}`,
        subtitle: 'Weight entry',
        date: new Date(w.date),
        dateStr: format(new Date(w.date), 'MMM d'),
      });
    });

    // Sort by date and take top 5
    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  }, [workouts, runs, weightEntries]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'workout':
        return (
          <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        );
      case 'run':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84" />
          </svg>
        );
      case 'weight':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back{currentUser?.firstName ? `, ${currentUser.firstName}` : ''}!
        </h1>
        <p className="text-gray-500 dark:text-neutral-400 mt-1">
          Here's your fitness overview for today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Workouts"
          value={workoutStats.total}
          subtitle={`${workoutStats.thisMonth} this month`}
          icon={
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          }
          color="bg-orange-500"
          onClick={() => navigate('workouts')}
        />

        <StatCard
          title="Current Streak"
          value={`${currentStreak} days`}
          subtitle={currentStreak > 0 ? "Keep it up!" : "Start today!"}
          icon={
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
            </svg>
          }
          color="bg-red-500"
          onClick={() => navigate('calendar')}
        />

        <StatCard
          title="Miles Run"
          value={totalMiles.toFixed(1)}
          subtitle={`${runs.length} total runs`}
          icon={
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41" />
            </svg>
          }
          color="bg-blue-500"
          onClick={() => navigate('running')}
        />

        <StatCard
          title="Current Weight"
          value={latestWeight ? `${latestWeight.weight}` : '—'}
          subtitle={latestWeight ? `${latestWeight.unit}` : 'No entries yet'}
          icon={
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          }
          color="bg-green-500"
          onClick={() => navigate('weight')}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Activity & Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly Progress */}
          <WeeklyProgress
            completedDays={weeklyProgress.completedDays}
            totalDays={weeklyProgress.totalDays}
          />

          {/* Recent Activity */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-neutral-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-4">
              Recent Activity
            </h3>
            {recentActivity.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-neutral-700">
                {recentActivity.map((activity, idx) => (
                  <ActivityItem
                    key={idx}
                    type={activity.type}
                    title={activity.title}
                    subtitle={activity.subtitle}
                    date={activity.dateStr}
                    icon={getActivityIcon(activity.type)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-neutral-500 text-center py-8">
                No recent activity. Start by logging a workout!
              </p>
            )}
          </div>
        </div>

        {/* Right Column - Quick Actions & Achievements */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-neutral-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <QuickAction
                label="Log Workout"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                }
                onClick={() => navigate('workouts')}
              />
              <QuickAction
                label="Log Run"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                }
                onClick={() => navigate('running')}
              />
              <QuickAction
                label="Add Weight"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                }
                onClick={() => navigate('weight')}
              />
            </div>
          </div>

          {/* Achievements Summary */}
          <div
            className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-5 shadow-sm border border-amber-100 dark:border-amber-800/30 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('achievements')}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Achievements
              </h3>
              <div className="w-8 h-8 rounded-lg bg-amber-200 dark:bg-amber-700/50 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-700 dark:text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
              {getUnlockedCount()} / {getTotalCount()}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
              {getTotalCount() - getUnlockedCount()} more to unlock
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
