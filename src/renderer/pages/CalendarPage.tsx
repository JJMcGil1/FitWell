/**
 * CalendarPage
 *
 * Dedicated full calendar view with more space and detail.
 */

import React from 'react';
import { Calendar, StreakDisplay } from '../components';

export const CalendarPage: React.FC = () => {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Calendar</h2>
        <p className="text-gray-500 mt-1">
          Track your daily progress
        </p>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Calendar - takes 3 columns on xl */}
        <div className="xl:col-span-3">
          <Calendar />
        </div>

        {/* Side panel */}
        <div className="space-y-6">
          <StreakDisplay />

          {/* Quick stats card */}
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-4">This Month</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed days</span>
                <span className="text-sm font-semibold text-gray-900">--</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Partial days</span>
                <span className="text-sm font-semibold text-gray-900">--</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completion rate</span>
                <span className="text-sm font-semibold text-gray-900">--%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
