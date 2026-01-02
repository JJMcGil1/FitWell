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
import { useThemeStore } from './stores/themeStore';
import { Sidebar, LoadingScreen, Onboarding } from './components';
import { CalendarPage, WorkoutsPage, RunningPage, GoalsPage, SettingsPage } from './pages';

// ⚠️ DEV FLAG: Set to true to force show onboarding screen for development
const DEV_SHOW_ONBOARDING = false;

const App: React.FC = () => {
  const { initialize, currentUser, isLoading: userLoading, isSwitching, error } = useUserStore();
  const { fetchGoals, fetchLogsForMonth, selectedMonth, reset: resetGoals } = useGoalStore();
  const { fetchEntries, reset: resetWeight } = useWeightStore();
  const { currentPage } = useNavigationStore();

  // Initialize theme store (ensures theme is applied on app load)
  useThemeStore();

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-neutral-900 relative">
        {/* Drag region for macOS window controls */}
        <div className="absolute top-0 left-0 right-0 h-14 drag-region" />
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
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

  // Show onboarding if no user exists (first-time launch) or dev flag is set
  if (!currentUser || DEV_SHOW_ONBOARDING) {
    return <Onboarding />;
  }

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'calendar':
        return <CalendarPage />;
      case 'workouts':
        return <WorkoutsPage />;
      case 'running':
        return <RunningPage />;
      case 'goals':
        return <GoalsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <CalendarPage />;
    }
  };

  return (
    <div className="h-screen flex bg-gray-200 dark:bg-neutral-900 overflow-hidden">
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
