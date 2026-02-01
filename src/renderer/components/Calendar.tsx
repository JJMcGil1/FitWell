/**
 * Calendar Component
 *
 * The main UI element - a month view showing workout/run activity.
 * Inspired by GitHub contribution graph meets Apple Health.
 */

import React, { useMemo, useState, useRef, useEffect } from 'react';
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
import { useWorkoutStore } from '../stores/workoutStore';
import { useRunStore } from '../stores/runStore';
import { useUserStore } from '../stores/userStore';
import { useWorkoutScheduleStore } from '../stores/workoutScheduleStore';
import { CalendarDay } from './CalendarDay';

type SlideDirection = 'left' | 'right' | null;

export const Calendar: React.FC = () => {
  const { currentUser } = useUserStore();
  const { fetchWorkouts } = useWorkoutStore();
  const { fetchRuns } = useRunStore();
  const { fetchAll: fetchSchedule } = useWorkoutScheduleStore();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [slideDirection, setSlideDirection] = useState<SlideDirection>(null);
  const animationKey = useRef(0);

  const today = new Date();

  // Fetch activities for the month
  const fetchActivitiesForMonth = async (month: Date) => {
    if (!currentUser) return;
    const startDate = format(startOfMonth(month), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(month), 'yyyy-MM-dd');
    await Promise.all([
      fetchWorkouts(currentUser.id, startDate, endDate),
      fetchRuns(currentUser.id, startDate, endDate),
    ]);
  };

  // Fetch activities and schedule when component mounts or user changes
  useEffect(() => {
    fetchActivitiesForMonth(selectedMonth);
    if (currentUser) {
      fetchSchedule(currentUser.id);
    }
  }, [currentUser?.id]);

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
    await fetchActivitiesForMonth(newMonth);
  };

  const goToNextMonth = async () => {
    setSlideDirection('left'); // Content slides left (coming from right)
    animationKey.current += 1;
    const newMonth = addMonths(selectedMonth, 1);
    setSelectedMonth(newMonth);
    await fetchActivitiesForMonth(newMonth);
  };

  const goToToday = async () => {
    // Determine direction based on whether today is before or after current month
    const isGoingBack = isAfter(selectedMonth, today);
    setSlideDirection(isGoingBack ? 'right' : 'left');
    animationKey.current += 1;
    setSelectedMonth(today);
    await fetchActivitiesForMonth(today);
  };

  const canGoNext = !isAfter(startOfMonth(selectedMonth), startOfMonth(today));

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="relative flex items-center mb-6">
        {/* Left: Page title */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
            Calendar
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Track your daily activity
          </p>
        </div>

        {/* Center: Month navigation card */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5
          bg-white/90 dark:bg-neutral-800/90 backdrop-blur-xl rounded-2xl px-2.5 py-2
          border border-gray-200/70 dark:border-neutral-600/50
          shadow-lg shadow-black/[0.08] dark:shadow-black/40
          ring-1 ring-black/[0.04] dark:ring-white/[0.06]">

          {/* Today button - only show if not in current month */}
          {!isSameMonth(selectedMonth, today) && (
            <button
              onClick={goToToday}
              className="
                flex items-center gap-1.5 px-3 py-1.5 mr-0.5
                bg-gradient-to-r from-orange-500 to-amber-500
                text-white text-[11px] font-bold uppercase tracking-wide
                rounded-full
                shadow-sm shadow-orange-500/25
                hover:shadow-md hover:shadow-orange-500/30 hover:brightness-110
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

          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-700/80 active:scale-90 transition-all duration-150"
            aria-label="Previous month"
          >
            <svg
              className="w-4 h-4 text-gray-500 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <span className="text-[17px] font-bold text-gray-900 dark:text-gray-100 tracking-tight min-w-[170px] text-center select-none">
            {format(selectedMonth, 'MMMM yyyy')}
          </span>

          <button
            onClick={goToNextMonth}
            disabled={!canGoNext}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-700/80 active:scale-90 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:active:scale-100"
            aria-label="Next month"
          >
            <svg
              className="w-4 h-4 text-gray-500 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
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
