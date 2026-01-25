/**
 * CalendarDay Component
 *
 * Shows workout/run activity for each day.
 * Days with any workout or run are marked as complete.
 * Click to quick-log a workout or remove it.
 */

import React, { useState } from 'react';
import { format } from 'date-fns';
import { useWorkoutStore } from '../stores/workoutStore';
import { useRunStore } from '../stores/runStore';
import { useUserStore } from '../stores/userStore';

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export const CalendarDay: React.FC<CalendarDayProps> = ({
  date,
  isCurrentMonth,
  isToday,
  isFuture,
}) => {
  const { currentUser } = useUserStore();
  const { getWorkoutsByDate, createWorkout, deleteWorkout } = useWorkoutStore();
  const { getRunsByDate } = useRunStore();
  const [isPending, setIsPending] = useState(false);

  const dateStr = format(date, 'yyyy-MM-dd');
  const dayNum = format(date, 'd');

  // Get workouts and runs for this day
  const workouts = getWorkoutsByDate(dateStr);
  const runs = getRunsByDate(dateStr);

  const hasWorkouts = workouts.length > 0;
  const hasRuns = runs.length > 0;
  const hasActivity = hasWorkouts || hasRuns;

  const canInteract = isCurrentMonth && !isFuture;

  // Simple toggle: click to check off, click again to uncheck
  const handleClick = async () => {
    if (!canInteract || !currentUser || isPending) return;

    setIsPending(true);
    try {
      if (hasWorkouts) {
        // Uncheck - delete all workouts for this day
        for (const workout of workouts) {
          await deleteWorkout(workout.id);
        }
      } else {
        // Check off - create a workout entry
        await createWorkout({
          userId: currentUser.id,
          date: dateStr,
          type: 'other',
          name: 'Workout',
          exercises: [],
        });
      }
    } catch (error) {
      console.error('Failed to toggle workout:', error);
    } finally {
      setIsPending(false);
    }
  };

  const getVisualState = () => {
    if (!isCurrentMonth) return 'outside';
    if (isFuture) return 'future';
    if (hasActivity) return 'complete';
    return 'default';
  };

  const visualState = getVisualState();

  return (
    <button
      onClick={handleClick}
      disabled={!canInteract}
      className={`
        calendar-day group
        relative flex items-center justify-center rounded-xl
        bg-transparent
        transition-transform duration-200 ease-out will-change-transform
        ${canInteract ? 'cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]' : 'cursor-default'}
      `}
      aria-label={`${format(date, 'MMMM d, yyyy')}${hasActivity ? ' - Has activity' : ''}`}
    >
      {/* Hover background */}
      {canInteract && !hasActivity && (
        <div className="
          absolute inset-[3px] rounded-lg
          bg-transparent group-hover:bg-gray-100 dark:group-hover:bg-neutral-800
          transition-colors duration-200
        " />
      )}

      {/* Activity background */}
      <div
        className={`
          absolute inset-[3px] rounded-lg
          border-2 transition-all duration-200 ease-out
          ${hasActivity
            ? 'bg-emerald-400/40 dark:bg-emerald-400/30 border-emerald-500 dark:border-emerald-400 opacity-100 scale-100'
            : 'bg-transparent border-transparent opacity-0 scale-95'
          }
        `}
      />

      {/* Day number */}
      <span
        className={`
          relative z-10
          text-[15px] tabular-nums select-none
          transition-all duration-200 ease-out
          ${hasActivity ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}
          ${isToday && !hasActivity
            ? 'min-w-[32px] h-8 px-2 flex items-center justify-center rounded-full bg-brand-500 text-white font-semibold'
            : getTextClasses(visualState, isToday)
          }
        `}
      >
        {dayNum}
      </span>

      {/* Centered checkmark */}
      <div
        className={`
          absolute inset-0 flex items-center justify-center
          transition-all duration-200 ease-out
          ${hasActivity ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
        `}
      >
        <svg
          className="w-6 h-6 text-white drop-shadow-sm"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </button>
  );
};

function getTextClasses(state: string, isToday: boolean): string {
  switch (state) {
    case 'outside':
      return 'text-gray-300 dark:text-neutral-700 font-normal';
    case 'future':
      return 'text-gray-400 dark:text-neutral-500 font-normal';
    case 'partial':
      return 'text-emerald-600 dark:text-emerald-400 font-medium';
    default:
      if (isToday) {
        return 'text-brand-600 dark:text-brand-400 font-semibold';
      }
      return 'text-gray-700 dark:text-gray-300 font-medium';
  }
}
