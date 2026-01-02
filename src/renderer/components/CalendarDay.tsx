/**
 * CalendarDay Component
 *
 * Individual day cell in the calendar.
 * Minimal design - the number is the focus.
 */

import React, { useState } from 'react';
import { format } from 'date-fns';
import { useGoalStore } from '../stores/goalStore';
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
  const { goals, getDayStatus, toggleDay } = useGoalStore();
  const [isToggling, setIsToggling] = useState(false);

  const dateStr = format(date, 'yyyy-MM-dd');
  const dayNum = format(date, 'd');
  const status = getDayStatus(dateStr);

  const activeGoals = goals.filter((g) => g.isActive);
  const hasGoals = activeGoals.length > 0;

  const isInteractive = isCurrentMonth && !isFuture && hasGoals;

  const handleClick = async () => {
    if (!isInteractive || !currentUser || isToggling) return;

    setIsToggling(true);
    try {
      const primaryGoal = activeGoals[0];
      await toggleDay(currentUser.id, primaryGoal.id, dateStr);
    } catch (error) {
      console.error('Failed to toggle day:', error);
    } finally {
      setIsToggling(false);
    }
  };

  // Build class list based on state
  const getCellClasses = () => {
    const base = 'relative flex items-center justify-center rounded-2xl transition-all duration-150';

    // Non-current month - very subtle
    if (!isCurrentMonth) {
      return `${base} text-gray-300 dark:text-neutral-600`;
    }

    // Future dates - subtle but visible
    if (isFuture) {
      return `${base} text-gray-400 dark:text-neutral-500 cursor-default`;
    }

    // Completed state - soft green
    if (status.isFullyComplete) {
      return `${base} bg-emerald-500 text-white cursor-pointer hover:bg-emerald-600 active:scale-95`;
    }

    // Partial completion - subtle brand tint
    if (status.completedGoals.length > 0) {
      return `${base} bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400 cursor-pointer hover:bg-brand-200 dark:hover:bg-brand-500/30 active:scale-95`;
    }

    // Default actionable day - transparent with hover
    return `${base} text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-200/60 dark:hover:bg-neutral-700/60 active:scale-95`;
  };

  return (
    <button
      onClick={handleClick}
      disabled={!isInteractive || isToggling}
      className={`${getCellClasses()} ${isToggling ? 'opacity-60 scale-95' : ''}`}
      aria-label={`${format(date, 'MMMM d, yyyy')}${status.isFullyComplete ? ' - Complete' : ''}`}
    >
      {/* Today indicator - subtle circle behind number */}
      {isToday && !status.isFullyComplete && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-gray-900 dark:bg-gray-100" />
        </div>
      )}

      {/* Day number */}
      <span
        className={`
          relative z-10 text-[15px] font-medium tabular-nums
          ${isToday && !status.isFullyComplete ? 'text-white dark:text-gray-900 font-semibold' : ''}
          ${status.isFullyComplete ? 'font-semibold' : ''}
        `}
      >
        {dayNum}
      </span>

      {/* Completion dots for multiple goals */}
      {isCurrentMonth && !isFuture && activeGoals.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {activeGoals.map((goal) => {
            const isComplete = status.completedGoals.includes(goal.id);
            return (
              <div
                key={goal.id}
                className={`w-1 h-1 rounded-full ${
                  isComplete
                    ? status.isFullyComplete ? 'bg-white/70' : 'bg-brand-500'
                    : 'bg-gray-300 dark:bg-neutral-600'
                }`}
              />
            );
          })}
        </div>
      )}

      {/* Loading spinner */}
      {isToggling && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-50" />
        </div>
      )}
    </button>
  );
};
