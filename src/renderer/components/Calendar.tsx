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
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {format(selectedMonth, 'MMMM yyyy')}
          </h2>

          {/* Today button - only show if not in current month */}
          {!isSameMonth(selectedMonth, today) && (
            <button
              onClick={goToToday}
              className="text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
            >
              Today
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Previous month"
          >
            <svg
              className="w-5 h-5 text-gray-600"
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

          <button
            onClick={goToNextMonth}
            disabled={!canGoNext}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Next month"
          >
            <svg
              className="w-5 h-5 text-gray-600"
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
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
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

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-success-500 shadow-sm" />
          <span className="text-xs text-gray-500">Complete</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-brand-100 shadow-sm" />
          <span className="text-xs text-gray-500">Partial</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white border border-gray-200 shadow-sm" />
          <span className="text-xs text-gray-500">No activity</span>
        </div>
      </div>
    </div>
  );
};
