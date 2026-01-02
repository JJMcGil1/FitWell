/**
 * StreakDisplay Component
 *
 * Shows current streak with animated fire icon.
 * This is a key motivational element.
 */

import React from 'react';
import { useGoalStore } from '../stores/goalStore';

export const StreakDisplay: React.FC = () => {
  const { goals, streaks } = useGoalStore();

  // Get the primary goal's streak (first active goal)
  const primaryGoal = goals.find((g) => g.isActive);
  const streak = primaryGoal ? streaks.get(primaryGoal.id) : null;

  const currentStreak = streak?.currentStreak ?? 0;
  const longestStreak = streak?.longestStreak ?? 0;

  // Determine streak level for visual emphasis
  const getStreakLevel = () => {
    if (currentStreak >= 30) return 'legendary';
    if (currentStreak >= 14) return 'excellent';
    if (currentStreak >= 7) return 'great';
    if (currentStreak >= 3) return 'good';
    return 'starting';
  };

  const streakLevel = getStreakLevel();

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">
            Current Streak
          </h3>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">
              {currentStreak}
            </span>
            <span className="text-lg text-gray-400">
              {currentStreak === 1 ? 'day' : 'days'}
            </span>
          </div>

          {/* Streak message */}
          <p className="text-sm text-gray-500 mt-2">
            {currentStreak === 0 && "Start your streak today!"}
            {currentStreak > 0 && currentStreak < 3 && "Great start! Keep it going!"}
            {currentStreak >= 3 && currentStreak < 7 && "You're building momentum!"}
            {currentStreak >= 7 && currentStreak < 14 && "A full week! Impressive!"}
            {currentStreak >= 14 && currentStreak < 30 && "Two weeks strong! Amazing!"}
            {currentStreak >= 30 && "Legendary streak! You're unstoppable!"}
          </p>
        </div>

        {/* Fire icon with animation */}
        <div className="relative">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              currentStreak === 0
                ? 'bg-gray-100'
                : currentStreak >= 3
                  ? 'bg-orange-50'
                  : 'bg-orange-50/50'
            }`}
          >
            <svg
              className={`w-8 h-8 ${
                currentStreak >= 3 ? 'streak-fire text-orange-500' : ''
              } ${currentStreak === 0 ? 'opacity-40 text-gray-400' : 'text-orange-500'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>

          {/* Streak level badge */}
          {currentStreak >= 7 && (
            <div
              className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shadow-sm
                ${streakLevel === 'legendary' ? 'bg-purple-100 text-purple-700' : ''}
                ${streakLevel === 'excellent' ? 'bg-yellow-100 text-yellow-700' : ''}
                ${streakLevel === 'great' ? 'bg-orange-100 text-orange-700' : ''}
              `}
            >
              {streakLevel}
            </div>
          )}
        </div>
      </div>

      {/* Best streak */}
      {longestStreak > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-500">Best streak</span>
          <span className="text-sm font-semibold text-gray-700">
            {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
          </span>
        </div>
      )}
    </div>
  );
};
