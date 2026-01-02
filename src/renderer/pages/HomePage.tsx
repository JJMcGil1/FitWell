/**
 * HomePage
 *
 * Main dashboard with welcome message, calendar overview,
 * streak display, and today's goals.
 */

import React from 'react';
import { useUserStore } from '../stores/userStore';
import { Calendar, StreakDisplay, GoalsList } from '../components';

export const HomePage: React.FC = () => {
  const { currentUser } = useUserStore();

  if (!currentUser) return null;

  return (
    <div className="p-8">
      {/* Welcome message */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Hey, {currentUser.name}!
        </h2>
        <p className="text-gray-500 mt-1">
          Let's keep that momentum going.
        </p>
      </div>

      {/* Main grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar - takes 2 columns */}
        <div className="lg:col-span-2">
          <Calendar />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <StreakDisplay />
          <GoalsList />
        </div>
      </div>
    </div>
  );
};
