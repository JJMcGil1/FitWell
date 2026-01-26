/**
 * FitWell App
 *
 * Main application component.
 * Handles initialization, layout with sidebar, and page routing.
 */

import React, { useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { HiOutlineExclamationTriangle } from 'react-icons/hi2';
import { useUserStore } from './stores/userStore';
import { useGoalStore } from './stores/goalStore';
import { useWorkoutStore } from './stores/workoutStore';
import { useRunStore } from './stores/runStore';
import { useWeightStore } from './stores/weightStore';
import { useNavigationStore } from './stores/navigationStore';
import { useThemeStore } from './stores/themeStore';
// TODO: Re-enable UpdateNotification after Apple Developer Program confirmation
// import { Sidebar, LoadingScreen, Onboarding, UpdateNotification } from './components';
import { Sidebar, LoadingScreen, Onboarding } from './components';
import { DashboardPage, CalendarPage, WorkoutsPage, RunningPage, WeightPage, VolumePage, GoalsPage, AchievementsPage, SettingsPage } from './pages';

// ⚠️ DEV FLAG: Set to true to force show onboarding screen for development
const DEV_SHOW_ONBOARDING = false;

const App: React.FC = () => {
  const { initialize, currentUser, isLoading: userLoading, isSwitching, error } = useUserStore();
  const { fetchGoals, reset: resetGoals } = useGoalStore();
  const { fetchWorkouts, reset: resetWorkouts } = useWorkoutStore();
  const { fetchRuns, reset: resetRuns } = useRunStore();
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
      resetWorkouts();
      resetRuns();
      resetWeight();

      // Fetch new user's data
      const today = new Date();
      const startDate = format(startOfMonth(today), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(today), 'yyyy-MM-dd');

      fetchGoals(currentUser.id);
      fetchWorkouts(currentUser.id, startDate, endDate);
      fetchRuns(currentUser.id, startDate, endDate);
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
            <HiOutlineExclamationTriangle className="w-8 h-8 text-red-400" />
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
      case 'dashboard':
        return <DashboardPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'workouts':
        return <WorkoutsPage />;
      case 'running':
        return <RunningPage />;
      case 'weight':
        return <WeightPage />;
      case 'volume':
        return <VolumePage />;
      case 'goals':
        return <GoalsPage />;
      case 'achievements':
        return <AchievementsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
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

      {/* TODO: Re-enable after Apple Developer Program confirmation
      <UpdateNotification />
      */}
    </div>
  );
};

export default App;
