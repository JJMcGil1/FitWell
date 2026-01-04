/**
 * Calendar Component
 *
 * The main UI element - a month view showing workout completion status.
 * Inspired by GitHub contribution graph meets Apple Health.
 */

import React, { useMemo, useState, useRef } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isAfter,
  addMonths,
  subMonths,
} from 'date-fns';
import { useGoalStore } from '../stores/goalStore';
import { useUserStore } from '../stores/userStore';
import { CalendarDay } from './CalendarDay';

type SlideDirection = 'left' | 'right' | null;

export const Calendar: React.FC = () => {
  const { currentUser } = useUserStore();
  const { selectedMonth, setSelectedMonth, fetchLogsForMonth } = useGoalStore();
  const [slideDirection, setSlideDirection] = useState<SlideDirection>(null);
  const animationKey = useRef(0);

  const today = new Date();

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [selectedMonth]);

  // Navigation handlers with directional animation
  const goToPreviousMonth = async () => {
    setSlideDirection('right'); // Content slides right (coming from left)
    animationKey.current += 1;
    const newMonth = subMonths(selectedMonth, 1);
    setSelectedMonth(newMonth);
    if (currentUser) {
      await fetchLogsForMonth(currentUser.id, newMonth);
    }
  };

  const goToNextMonth = async () => {
    setSlideDirection('left'); // Content slides left (coming from right)
    animationKey.current += 1;
    const newMonth = addMonths(selectedMonth, 1);
    setSelectedMonth(newMonth);
    if (currentUser) {
      await fetchLogsForMonth(currentUser.id, newMonth);
    }
  };

  const goToToday = async () => {
    // Determine direction based on whether today is before or after current month
    const isGoingBack = isAfter(selectedMonth, today);
    setSlideDirection(isGoingBack ? 'right' : 'left');
    animationKey.current += 1;
    setSelectedMonth(today);
    if (currentUser) {
      await fetchLogsForMonth(currentUser.id, today);
    }
  };

  const canGoNext = !isAfter(startOfMonth(selectedMonth), startOfMonth(today));

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="h-full flex flex-col">
      {/* Header - centered title with flanking navigation */}
      <div className="flex items-center justify-between px-2 mb-8">
        {/* Left arrow */}
        <button
          onClick={goToPreviousMonth}
          className="p-2 -ml-2 rounded-full hover:bg-gray-300/50 dark:hover:bg-neutral-700/50 transition-colors"
          aria-label="Previous month"
        >
          <svg
            className="w-5 h-5 text-gray-500 dark:text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Centered title */}
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
            {format(selectedMonth, 'MMMM yyyy')}
          </h1>

          {/* Today button - only show if not in current month */}
          {!isSameMonth(selectedMonth, today) && (
            <button
              onClick={goToToday}
              className="
                flex items-center gap-1.5 px-2.5 py-1
                bg-gray-900 dark:bg-white
                text-white dark:text-gray-900
                text-xs font-medium
                rounded-full
                hover:bg-gray-700 dark:hover:bg-gray-100
                active:scale-95
                transition-all duration-150
              "
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                />
              </svg>
              Today
            </button>
          )}
        </div>

        {/* Right arrow */}
        <button
          onClick={goToNextMonth}
          disabled={!canGoNext}
          className="p-2 -mr-2 rounded-full hover:bg-gray-300/50 dark:hover:bg-neutral-700/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          aria-label="Next month"
        >
          <svg
            className="w-5 h-5 text-gray-500 dark:text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid - fills remaining space with slide animation */}
      <div className="flex-1 overflow-hidden">
        <div
          key={animationKey.current}
          className={`
            h-full grid grid-cols-7 gap-1 auto-rows-fr
            ${slideDirection === 'left' ? 'animate-slide-in-left' : ''}
            ${slideDirection === 'right' ? 'animate-slide-in-right' : ''}
          `}
          onAnimationEnd={() => setSlideDirection(null)}
        >
          {calendarDays.map((day) => (
            <CalendarDay
              key={day.toISOString()}
              date={day}
              isCurrentMonth={isSameMonth(day, selectedMonth)}
              isToday={isSameDay(day, today)}
              isFuture={isAfter(day, today)}
            />
          ))}
        </div>
      </div>

    </div>
  );
};
