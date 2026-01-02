/**
 * Sidebar Component
 *
 * Clean, minimal sidebar following Linear/Arc design patterns.
 * - Window drag region at top
 * - Navigation in upper section
 * - User summary at bottom with quick switch
 */

import React from 'react';
import { useNavigationStore, type Page } from '../stores/navigationStore';
import { useUserStore } from '../stores/userStore';
import { useGoalStore } from '../stores/goalStore';
import { useWeightStore } from '../stores/weightStore';
import logoFull from '../../../assets/fitwell-logo.svg';

interface NavItem {
  id: Page;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: (
      <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: (
      <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'goals',
    label: 'Goals',
    icon: (
      <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
];

export const Sidebar: React.FC = () => {
  const { currentPage, navigate } = useNavigationStore();
  const { users, currentUser, switchUser, isSwitching } = useUserStore();
  const { goals, streaks } = useGoalStore();
  const { getLatestWeight } = useWeightStore();

  // Get current streak
  const primaryGoal = goals.find((g) => g.isActive);
  const streak = primaryGoal ? streaks.get(primaryGoal.id) : null;
  const currentStreak = streak?.currentStreak ?? 0;

  // Get latest weight
  const latestWeight = getLatestWeight();

  // Get the other user for quick switch
  const otherUser = users.find((u) => u.id !== currentUser?.id);

  const handleSwitch = async () => {
    if (otherUser) {
      await switchUser(otherUser.id);
    }
  };

  return (
    <aside className="w-56 bg-gradient-to-b from-neutral-800 via-neutral-900 to-neutral-950 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.3)]">
      {/* Drag region for macOS window controls */}
      <div className="h-8 drag-region flex-shrink-0" />

      {/* Logo */}
      <div className="px-3 py-4">
        <img src={logoFull} alt="FitWell" className="h-10" draggable={false} />
      </div>

      {/* Navigation */}
      <nav className="pt-2 px-3">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => navigate(item.id)}
                  className={`
                    w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-150 relative
                    text-[15px] font-medium
                    ${isActive
                      ? 'bg-neutral-700/80 text-white shadow-md'
                      : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white'
                    }
                  `}
                >
                  {/* Active indicator accent */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-500 rounded-r-full" />
                  )}
                  <span className={isActive ? 'text-orange-400' : 'text-neutral-500'}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom section - User Summary */}
      <div className="pb-4 px-2">
        {currentUser && (
          <div className="rounded-xl px-3 py-2.5 transition-colors duration-150 hover:bg-neutral-800/60 cursor-default">
            {/* User info row */}
            <div className="flex items-center gap-3">
              {/* Avatar with transition */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 transition-all duration-150 ${isSwitching ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}`}
                style={{ backgroundColor: currentUser.avatarColor }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              {/* User info with transition */}
              <div className={`flex-1 min-w-0 transition-all duration-150 ${isSwitching ? 'opacity-0 translate-x-2' : 'opacity-100 translate-x-0'}`}>
                <span className="text-sm font-medium text-white block truncate">
                  {currentUser.name}
                </span>
                {/* Stats row */}
                <div className="flex items-center gap-3 mt-0.5">
                  {/* Streak */}
                  <span className="text-sm text-neutral-400 flex items-center gap-1">
                    <svg className={`w-4 h-4 ${currentStreak > 0 ? 'text-orange-400' : 'opacity-50'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className={currentStreak > 0 ? 'text-orange-400 font-medium' : ''}>
                      {currentStreak}
                    </span>
                  </span>
                  {/* Weight */}
                  <span className="text-sm text-neutral-400 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                    <span>{latestWeight?.weight ?? 185}</span>
                  </span>
                </div>
              </div>
              {/* Switch button */}
              {otherUser && (
                <button
                  onClick={handleSwitch}
                  disabled={isSwitching}
                  className={`p-2 rounded-lg hover:bg-neutral-700/50 transition-all duration-150 group ${isSwitching ? 'opacity-50' : ''}`}
                  title={`Switch to ${otherUser.name}`}
                >
                  <svg
                    className={`w-5 h-5 text-neutral-400 group-hover:text-neutral-200 transition-all duration-300 ${isSwitching ? 'rotate-180' : 'rotate-0'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
