/**
 * CalendarDay Component
 *
 * Individual day cell in the calendar.
 * Shows completion status and handles click to toggle.
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

  // Determine visual state
  const getStateClasses = () => {
    if (!isCurrentMonth) {
      return 'bg-gray-50/50 text-gray-300';
    }
    if (isFuture) {
      return 'bg-gray-50 text-gray-300 cursor-not-allowed';
    }
    if (status.isFullyComplete) {
      return 'bg-success-500 text-white hover:bg-success-600';
    }
    if (status.completedGoals.length > 0) {
      return 'bg-brand-100 text-brand-700 hover:bg-brand-200';
    }
    return 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-100';
  };

  const handleClick = async () => {
    if (isFuture || !isCurrentMonth || !currentUser || !hasGoals || isToggling) {
      return;
    }

    setIsToggling(true);

    try {
      // Toggle the first active goal for simplicity
      // In a more complex app, this could open a modal to select which goal
      const primaryGoal = activeGoals[0];
      await toggleDay(currentUser.id, primaryGoal.id, dateStr);
    } catch (error) {
      console.error('Failed to toggle day:', error);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isFuture || !isCurrentMonth || isToggling}
      className={`
        relative aspect-square rounded-lg flex flex-col items-center justify-center
        transition-all duration-150 ease-out
        ${getStateClasses()}
        ${isToday ? 'ring-2 ring-brand-500 ring-offset-2' : ''}
        ${isToggling ? 'scale-95 opacity-70' : ''}
        ${!isFuture && isCurrentMonth && hasGoals ? 'cursor-pointer' : ''}
      `}
      aria-label={`${format(date, 'MMMM d, yyyy')}${
        status.isFullyComplete ? ' - Complete' : ''
      }`}
    >
      {/* Day number */}
      <span
        className={`text-sm font-medium ${
          status.isFullyComplete ? 'font-semibold' : ''
        }`}
      >
        {dayNum}
      </span>

      {/* Completion indicator dots (for multiple goals) */}
      {isCurrentMonth && !isFuture && activeGoals.length > 1 && (
        <div className="flex gap-0.5 mt-1">
          {activeGoals.map((goal) => {
            const isComplete = status.completedGoals.includes(goal.id);
            return (
              <div
                key={goal.id}
                className={`w-1 h-1 rounded-full ${
                  isComplete
                    ? status.isFullyComplete
                      ? 'bg-white/80'
                      : 'bg-brand-500'
                    : 'bg-gray-300'
                }`}
              />
            );
          })}
        </div>
      )}

      {/* Check mark for complete days */}
      {status.isFullyComplete && activeGoals.length === 1 && (
        <svg
          className="absolute w-3 h-3 bottom-1.5 right-1.5 text-white/90"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}

      {/* Loading state */}
      {isToggling && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-lg">
          <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </button>
  );
};
