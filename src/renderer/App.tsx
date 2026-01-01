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
import { TitleBar, Sidebar, LoadingScreen } from './components';
import { HomePage, CalendarPage, GoalsPage } from './pages';

const App: React.FC = () => {
  const { initialize, currentUser, isLoading: userLoading, error } = useUserStore();
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
          <span className="text-4xl mb-4 block">😓</span>
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
          <span className="text-4xl mb-4 block">👋</span>
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
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Left sidebar navigation */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Title bar with user switcher */}
        <TitleBar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;
