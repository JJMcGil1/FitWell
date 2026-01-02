/**
 * Calendar Component
 *
 * The main UI element - a month view showing workout completion status.
 * Inspired by GitHub contribution graph meets Apple Health.
 */

import React, { useMemo } from 'react';
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

export const Calendar: React.FC = () => {
  const { currentUser } = useUserStore();
  const { selectedMonth, setSelectedMonth, fetchLogsForMonth } = useGoalStore();

  const today = new Date();

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [selectedMonth]);

  // Navigation handlers
  const goToPreviousMonth = async () => {
    const newMonth = subMonths(selectedMonth, 1);
    setSelectedMonth(newMonth);
    if (currentUser) {
      await fetchLogsForMonth(currentUser.id, newMonth);
    }
  };

  const goToNextMonth = async () => {
    const newMonth = addMonths(selectedMonth, 1);
    setSelectedMonth(newMonth);
    if (currentUser) {
      await fetchLogsForMonth(currentUser.id, newMonth);
    }
  };

  const goToToday = async () => {
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
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
            {format(selectedMonth, 'MMMM yyyy')}
          </h1>

          {/* Today pill - only show if not in current month */}
          {!isSameMonth(selectedMonth, today) && (
            <button
              onClick={goToToday}
              className="px-2.5 py-1 text-xs font-medium text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-500/20 rounded-full hover:bg-brand-100 dark:hover:bg-brand-500/30 transition-colors"
            >
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

      {/* Calendar grid - fills remaining space */}
      <div className="flex-1 grid grid-cols-7 gap-1 auto-rows-fr">
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
  );
};
