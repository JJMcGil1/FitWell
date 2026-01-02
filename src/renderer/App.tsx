/**
 * FitWell App
 *
 * Main application component.
 * Handles initialization, layout with sidebar, and page routing.
 */

import React, { useEffect } from 'react';
import { useUserStore } from './stores/userStore';
import { useGoalStore } from './stores/goalStore';
import { useWeightStore } from './stores/weightStore';
import { useNavigationStore } from './stores/navigationStore';
import { Sidebar, LoadingScreen } from './components';
import { HomePage, CalendarPage, GoalsPage } from './pages';

const App: React.FC = () => {
  const { initialize, currentUser, isLoading: userLoading, isSwitching, error } = useUserStore();
  const { fetchGoals, fetchLogsForMonth, selectedMonth, reset: resetGoals } = useGoalStore();
  const { fetchEntries, reset: resetWeight } = useWeightStore();
  const { currentPage } = useNavigationStore();

  // Initialize app on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Fetch data when user changes
  useEffect(() => {
    if (currentUser) {
      // Reset stores when switching users
      resetGoals();
      resetWeight();

      // Fetch new user's data
      fetchGoals(currentUser.id);
      fetchLogsForMonth(currentUser.id, selectedMonth);
      fetchEntries(currentUser.id);
    }
  }, [currentUser?.id]);

  // Show loading screen during initialization
  if (userLoading) {
    return <LoadingScreen />;
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show empty state if no user (shouldn't happen with seed data)
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome to FitWell
          </h1>
          <p className="text-gray-500">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'calendar':
        return <CalendarPage />;
      case 'goals':
        return <GoalsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="h-screen flex bg-gray-200 overflow-hidden">
      {/* Left sidebar navigation with shadow */}
      <Sidebar />

      {/* Main content area */}
      <main className={`flex-1 overflow-y-auto min-w-0 user-content ${isSwitching ? 'switching' : ''}`}>
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
