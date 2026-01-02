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
    id: 'calendar',
    label: 'Calendar',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'workouts',
    label: 'Workout Schedule',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    id: 'running',
    label: 'Running',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
  },
  {
    id: 'goals',
    label: 'Goals',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
];

export const Sidebar: React.FC = () => {
  const { currentPage, navigate } = useNavigationStore();
  const { currentUser, isSwitching } = useUserStore();
  const { goals, streaks } = useGoalStore();
  const { getLatestWeight } = useWeightStore();

  // Get current streak
  const primaryGoal = goals.find((g) => g.isActive);
  const streak = primaryGoal ? streaks.get(primaryGoal.id) : null;
  const currentStreak = streak?.currentStreak ?? 0;

  // Get latest weight
  const latestWeight = getLatestWeight();

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
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => navigate(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200 ease-out relative group
                    text-[14px] font-medium tracking-[-0.01em]
                    outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:ring-offset-0
                    ${isActive
                      ? 'bg-white/[0.08] text-white'
                      : 'text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200 active:bg-white/[0.06]'
                    }
                  `}
                >
                  {/* Active indicator - subtle left accent */}
                  <span
                    className={`
                      absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full
                      transition-all duration-200 ease-out
                      ${isActive ? 'h-4 bg-orange-500' : 'h-0 bg-orange-500/0'}
                    `}
                  />

                  {/* Icon with smooth color transition */}
                  <span className={`
                    transition-colors duration-200 ease-out flex-shrink-0
                    ${isActive
                      ? 'text-orange-400'
                      : 'text-neutral-500 group-hover:text-neutral-400'
                    }
                  `}>
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

      {/* Bottom section */}
      <div className="pb-4 px-3">
        {/* User tile - clicks to Settings */}
        {currentUser && (
          <button
            onClick={() => navigate('settings')}
            disabled={isSwitching}
            className={`
              w-full rounded-lg px-3 py-2.5 transition-all duration-200 ease-out relative
              hover:bg-white/[0.04] active:bg-white/[0.06]
              outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:ring-offset-0
              ${currentPage === 'settings' ? 'bg-white/[0.08]' : ''}
              ${isSwitching ? 'pointer-events-none' : ''}
            `}
          >
            {/* Active indicator */}
            <span
              className={`
                absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full
                transition-all duration-200 ease-out
                ${currentPage === 'settings' ? 'h-4 bg-orange-500' : 'h-0 bg-orange-500/0'}
              `}
            />
              <div className="flex items-center gap-3">
                {/* Avatar */}
                {currentUser.profilePhoto ? (
                  <img
                    src={currentUser.profilePhoto}
                    alt={currentUser.name}
                    className={`w-8 h-8 rounded-full object-cover flex-shrink-0 transition-all duration-200 ease-out ${isSwitching ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}`}
                  />
                ) : (
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] font-semibold flex-shrink-0 transition-all duration-200 ease-out ${isSwitching ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}`}
                    style={{ backgroundColor: currentUser.avatarColor }}
                  >
                    {(currentUser.firstName?.charAt(0) ?? '').toUpperCase()}
                    {(currentUser.lastName?.charAt(0) ?? '').toUpperCase()}
                  </div>
                )}
                {/* User info */}
                <div className={`flex-1 min-w-0 text-left transition-all duration-200 ease-out ${isSwitching ? 'opacity-0 translate-x-2' : 'opacity-100 translate-x-0'}`}>
                  <span className="text-[13px] font-medium text-neutral-200 block truncate">
                    {currentUser.name}
                  </span>
                  {/* Stats row */}
                  <div className="flex items-center gap-2.5 mt-0.5">
                    {/* Streak */}
                    <span className="text-[12px] text-neutral-500 flex items-center gap-1">
                      <svg className={`w-3.5 h-3.5 ${currentStreak > 0 ? 'text-orange-400' : 'opacity-50'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className={currentStreak > 0 ? 'text-orange-400 font-medium' : ''}>
                        {currentStreak}
                      </span>
                    </span>
                    {/* Weight */}
                    <span className="text-[12px] text-neutral-500 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                      <span>{latestWeight?.weight ?? '—'}</span>
                    </span>
                  </div>
                </div>
              </div>
          </button>
        )}
      </div>
    </aside>
  );
};
