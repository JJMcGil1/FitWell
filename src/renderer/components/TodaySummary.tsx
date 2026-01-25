/**
 * TodaySummary Component
 *
 * Prominent "Today" card showing:
 * - Today's workouts and runs
 * - Activity summary
 * - Motivational message
 */

import React from 'react';
import { format } from 'date-fns';
import { HiOutlineSun, HiOutlineBolt, HiOutlineCheck, HiOutlineBars4, HiOutlineCheckCircle } from 'react-icons/hi2';
import { useWorkoutStore } from '../stores/workoutStore';
import { useRunStore, formatDuration, formatPace } from '../stores/runStore';

export const TodaySummary: React.FC = () => {
  const { getWorkoutsByDate } = useWorkoutStore();
  const { getRunsByDate } = useRunStore();

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const todayWorkouts = getWorkoutsByDate(todayStr);
  const todayRuns = getRunsByDate(todayStr);

  const hasActivity = todayWorkouts.length > 0 || todayRuns.length > 0;
  const totalActivities = todayWorkouts.length + todayRuns.length;

  // Get motivational message based on activity
  const getMotivationalMessage = (): string => {
    if (hasActivity) {
      if (totalActivities >= 2) return "Great job! Multiple activities today!";
      return "Nice work today!";
    }
    return "Ready to start your day?";
  };

  // If no activity today, show encouraging message
  if (!hasActivity) {
    return (
      <div className="card p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
            <HiOutlineSun className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Today</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{format(today, 'EEEE, MMMM d')}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-brand-50 dark:bg-brand-900/20">
          <HiOutlineBolt className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
            Log a workout or run to get started!
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <HiOutlineCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Today</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {format(today, 'EEEE, MMMM d')}
            </p>
          </div>
        </div>

        {/* Activity count badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
          <HiOutlineCheck className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{totalActivities}</span>
          <span className="text-xs text-emerald-500 dark:text-emerald-400">activit{totalActivities !== 1 ? 'ies' : 'y'}</span>
        </div>
      </div>

      {/* Activities list */}
      <div className="space-y-2 mb-4">
        {/* Workouts */}
        {todayWorkouts.map((workout) => (
          <div
            key={workout.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20"
          >
            {/* Icon */}
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <HiOutlineBars4 className="w-4 h-4 text-white" />
            </div>

            {/* Workout info */}
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {workout.name}
              </span>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="capitalize">{workout.type}</span>
                {workout.duration && (
                  <>
                    <span>•</span>
                    <span>{workout.duration} min</span>
                  </>
                )}
              </div>
            </div>

            {/* Checkmark */}
            <HiOutlineCheck className="w-5 h-5 text-emerald-500" />
          </div>
        ))}

        {/* Runs */}
        {todayRuns.map((run) => (
          <div
            key={run.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20"
          >
            {/* Icon */}
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <HiOutlineBolt className="w-4 h-4 text-white" />
            </div>

            {/* Run info */}
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {run.distance.toFixed(2)} mi run
              </span>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="capitalize">{run.type}</span>
                <span>•</span>
                <span>{formatDuration(run.duration)}</span>
                {run.pace && (
                  <>
                    <span>•</span>
                    <span>{formatPace(run.pace)}/mi</span>
                  </>
                )}
              </div>
            </div>

            {/* Checkmark */}
            <HiOutlineCheck className="w-5 h-5 text-orange-500" />
          </div>
        ))}
      </div>

      {/* Motivational message */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
        <HiOutlineCheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
          {getMotivationalMessage()}
        </span>
      </div>
    </div>
  );
};
