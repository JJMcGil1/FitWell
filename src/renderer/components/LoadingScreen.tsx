/**
 * LoadingScreen Component
 *
 * Shown during app initialization.
 * Keep it simple and on-brand.
 */

import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">FitWell</h1>
      </div>

      {/* Loading spinner */}
      <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin" />

      <p className="mt-4 text-sm text-gray-500">Loading your fitness data...</p>
    </div>
  );
};
