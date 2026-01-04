/**
 * CalendarDay Component
 *
 * Uses optimistic updates - UI updates instantly, no flicker.
 * Premium check animation with centered alignment.
 * Streak connectors for consecutive completed days.
 */

import React, { useState, useEffect } from 'react';
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

  const [optimisticComplete, setOptimisticComplete] = useState<boolean | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [animateCheck, setAnimateCheck] = useState(false);

  const dateStr = format(date, 'yyyy-MM-dd');
  const dayNum = format(date, 'd');
  const status = getDayStatus(dateStr);

  const activeGoals = goals.filter((g) => g.isActive);
  const hasGoals = activeGoals.length > 0;

  const isComplete = optimisticComplete !== null ? optimisticComplete : status.isFullyComplete;
  const canInteract = hasGoals && isCurrentMonth && !isFuture;

  // Reset animation state when completion changes
  useEffect(() => {
    if (!isComplete) {
      setAnimateCheck(false);
    }
  }, [isComplete]);

  const handleClick = async () => {
    if (!canInteract || !currentUser || isPending) return;

    const newValue = !isComplete;
    setOptimisticComplete(newValue);
    setIsPending(true);

    // Trigger animation only when completing
    if (newValue) {
      setAnimateCheck(true);
    }

    try {
      const primaryGoal = activeGoals[0];
      await toggleDay(currentUser.id, primaryGoal.id, dateStr);
      setOptimisticComplete(null);
    } catch (error) {
      console.error('Failed to toggle day:', error);
      setOptimisticComplete(null);
      setAnimateCheck(false);
    } finally {
      setIsPending(false);
    }
  };

  const getVisualState = () => {
    if (!isCurrentMonth) return 'outside';
    if (isFuture) return 'future';
    if (isComplete) return 'complete';
    if (status.completedGoals.length > 0) return 'partial';
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
      aria-label={`${format(date, 'MMMM d, yyyy')}${isComplete ? ' - Complete' : ''}`}
    >
      {/* Hover background */}
      {canInteract && !isComplete && (
        <div className="
          absolute inset-[3px] rounded-lg
          bg-transparent group-hover:bg-gray-100 dark:group-hover:bg-neutral-800
          transition-colors duration-200
        " />
      )}

      {/* Completion background */}
      <div
        className={`
          absolute inset-[3px] rounded-lg
          border-2 transition-all duration-200 ease-out
          ${isComplete
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
          ${isComplete ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}
          ${isToday && !isComplete
            ? 'min-w-[32px] h-8 px-2 flex items-center justify-center rounded-full bg-brand-500 text-white font-semibold'
            : getTextClasses(visualState, isToday)
          }
        `}
      >
        {dayNum}
      </span>

      {/* Centered checkmark with today underline */}
      <div
        className={`
          absolute inset-0 flex flex-col items-center justify-center gap-1
          transition-all duration-200 ease-out
          ${isComplete ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
        `}
      >
        <svg
          className={`w-6 h-6 text-white drop-shadow-sm ${animateCheck ? 'check-animate' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            className={animateCheck ? 'check-path' : ''}
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {/* Today indicator - subtle underline */}
        {isToday && (
          <div className="w-5 h-[3px] rounded-full bg-white/80" />
        )}
      </div>

      {/* Multiple goals dots */}
      {isCurrentMonth && !isFuture && activeGoals.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5 z-10">
          {activeGoals.map((goal) => {
            const goalComplete = status.completedGoals.includes(goal.id);
            return (
              <div
                key={goal.id}
                className={`
                  w-1 h-1 rounded-full
                  ${goalComplete
                    ? isComplete ? 'bg-white/70' : 'bg-emerald-500'
                    : 'bg-gray-300 dark:bg-neutral-600'
                  }
                `}
              />
            );
          })}
        </div>
      )}
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
