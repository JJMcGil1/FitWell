/**
 * GoalsList Component
 *
 * Shows the user's active goals with quick toggle ability.
 */

import React, { useState } from 'react';
import { format } from 'date-fns';
import { useGoalStore } from '../stores/goalStore';
import { useUserStore } from '../stores/userStore';

export const GoalsList: React.FC = () => {
  const { currentUser } = useUserStore();
  const { goals, getLogsForDate, toggleDay } = useGoalStore();
  const [isToggling, setIsToggling] = useState<string | null>(null);

  const activeGoals = goals.filter((g) => g.isActive);
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayLogs = getLogsForDate(today);

  const handleToggle = async (goalId: string) => {
    if (!currentUser || isToggling) return;

    setIsToggling(goalId);
    try {
      await toggleDay(currentUser.id, goalId, today);
    } catch (error) {
      console.error('Failed to toggle goal:', error);
    } finally {
      setIsToggling(null);
    }
  };

  const isGoalComplete = (goalId: string) => {
    return todayLogs.some((log) => log.goalId === goalId && log.completed);
  };

  if (activeGoals.length === 0) {
    return (
      <div className="card p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-3">Today's Goals</h3>
        <p className="text-sm text-gray-400 text-center py-4">
          No active goals yet
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="text-sm font-medium text-gray-500 mb-3">Today's Goals</h3>

      <div className="space-y-2">
        {activeGoals.map((goal) => {
          const isComplete = isGoalComplete(goal.id);
          const isLoading = isToggling === goal.id;

          return (
            <button
              key={goal.id}
              onClick={() => handleToggle(goal.id)}
              disabled={isLoading}
              className={`
                w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-150
                ${
                  isComplete
                    ? 'bg-success-50 hover:bg-success-100'
                    : 'bg-gray-50 hover:bg-gray-100'
                }
                ${isLoading ? 'opacity-60' : ''}
              `}
            >
              {/* Checkbox */}
              <div
                className={`
                  w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200
                  ${
                    isComplete
                      ? 'bg-success-500 text-white'
                      : 'border-2 border-gray-300'
                  }
                `}
              >
                {isComplete && (
                  <svg
                    className="w-3 h-3 animate-check-bounce"
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
                {isLoading && (
                  <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {/* Goal info */}
              <div className="flex-1 text-left">
                <span
                  className={`text-sm font-medium ${
                    isComplete ? 'text-success-700' : 'text-gray-700'
                  }`}
                >
                  {goal.name}
                </span>
              </div>

              {/* Goal type icon */}
              <div className="text-gray-400">
                {goal.type === 'workout' && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                )}
                {goal.type === 'weight' && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                    />
                  </svg>
                )}
                {goal.type === 'custom' && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
