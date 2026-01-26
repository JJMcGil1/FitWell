/**
 * Sidebar Component
 *
 * Clean, minimal sidebar following Linear/Arc design patterns.
 * - Window drag region at top
 * - Navigation in upper section
 * - User summary at bottom with quick switch
 * - Collapsible to icon-only mode
 */

import React, { useMemo, useState, useEffect } from 'react';
import { useNavigationStore, type Page } from '../stores/navigationStore';
import { useUserStore } from '../stores/userStore';
import { useWorkoutStore } from '../stores/workoutStore';
import { useWeightStore } from '../stores/weightStore';
import { format, subDays } from 'date-fns';
import logoFull from '../../../assets/fitwell-logo.svg';
import logoIcon from '../../../assets/fitwell-logo-icon.svg';
import { FaPersonRunning } from 'react-icons/fa6';
import { FaFire } from 'react-icons/fa';
import { LuLayoutDashboard, LuScale, LuWeight, LuChevronsLeft, LuChevronsRight } from 'react-icons/lu';
import { AiOutlineSchedule } from 'react-icons/ai';
import { BsCalendar2Check } from 'react-icons/bs';
import { GoGoal } from 'react-icons/go';
import { GrAchievement } from 'react-icons/gr';
import { IoScale } from 'react-icons/io5';

const SIDEBAR_COLLAPSED_KEY = 'fitwell-sidebar-collapsed';

interface NavItem {
  id: Page;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    Icon: LuLayoutDashboard,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    Icon: BsCalendar2Check,
  },
  {
    id: 'workouts',
    label: 'Workout Routine',
    Icon: AiOutlineSchedule,
  },
  {
    id: 'running',
    label: 'Cardio',
    Icon: FaPersonRunning,
  },
  {
    id: 'weight',
    label: 'Weight',
    Icon: LuScale,
  },
  {
    id: 'volume',
    label: 'Volume',
    Icon: LuWeight,
  },
  {
    id: 'goals',
    label: 'Goals',
    Icon: GoGoal,
  },
];

export const Sidebar: React.FC = () => {
  const { currentPage, navigate } = useNavigationStore();
  const { currentUser, isSwitching } = useUserStore();
  const { workouts } = useWorkoutStore();
  const { getLatestWeight } = useWeightStore();

  // Collapsed state with localStorage persistence
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
  }, [isCollapsed]);

  const toggleCollapsed = () => setIsCollapsed(!isCollapsed);

  // Calculate current streak from workouts (consecutive days with workouts)
  const currentStreak = useMemo(() => {
    if (workouts.length === 0) return 0;

    const workoutDates = new Set(workouts.map(w => w.date));
    const today = new Date();
    let streak = 0;

    // Check from today backwards
    for (let i = 0; i < 365; i++) {
      const checkDate = format(subDays(today, i), 'yyyy-MM-dd');
      if (workoutDates.has(checkDate)) {
        streak++;
      } else if (i > 0) {
        // Allow today to be missing (streak continues from yesterday)
        break;
      }
    }

    return streak;
  }, [workouts]);

  // Get latest weight
  const latestWeight = getLatestWeight();

  return (
    <aside className={`
      ${isCollapsed ? 'w-20' : 'w-56'}
      bg-gradient-to-b from-neutral-800 via-neutral-900 to-neutral-950
      flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.3)]
      transition-all duration-300 ease-out
    `}>
      {/* Drag region for macOS window controls */}
      <div className="h-8 drag-region flex-shrink-0" />

      {/* Logo - crossfade transition */}
      <div className="py-4 px-3 relative h-[72px]">
        {/* Full logo - fades out when collapsed */}
        <img
          src={logoFull}
          alt="FitWell"
          className={`
            h-10 absolute left-3 top-4
            transition-opacity duration-300 ease-out
            ${isCollapsed ? 'opacity-0' : 'opacity-100'}
          `}
          draggable={false}
        />
        {/* Icon logo - fades in when collapsed, fixed position for collapsed state (80px sidebar, ~40px icon = left at ~20px) */}
        <img
          src={logoIcon}
          alt="FitWell"
          className={`
            h-10 absolute left-[20px] top-4
            transition-opacity duration-300 ease-out
            ${isCollapsed ? 'opacity-100' : 'opacity-0'}
          `}
          draggable={false}
        />
      </div>

      {/* Navigation */}
      <nav className="pt-2 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            const IconComponent = item.Icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => navigate(item.id)}
                  className={`
                    w-full flex items-center gap-3 py-2.5 px-4 rounded-lg
                    transition-all duration-300 ease-out relative group
                    text-[14px] font-medium tracking-[-0.01em]
                    outline-none focus:outline-none
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
                      transition-all duration-300 ease-out
                      ${isActive ? 'h-4 bg-orange-500' : 'h-0 bg-orange-500/0'}
                    `}
                  />

                  {/* Icon with smooth size and color transition */}
                  <span className={`
                    flex-shrink-0
                    ${isActive
                      ? 'text-orange-400'
                      : 'text-neutral-500 group-hover:text-neutral-400'
                    }
                  `}>
                    <IconComponent className={`transition-all duration-300 ease-out ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />
                  </span>

                  {/* Label with smooth fade transition */}
                  <span className={`
                    truncate transition-all duration-300 ease-out overflow-hidden whitespace-nowrap
                    ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}
                  `}>
                    {item.label}
                  </span>

                  {/* Flyout tooltip - only when collapsed */}
                  {isCollapsed && (
                    <span className="
                      absolute left-full top-1/2 -translate-y-1/2 ml-3
                      px-3 py-1.5 rounded-lg
                      bg-neutral-800 text-white text-[13px] font-medium
                      shadow-lg shadow-black/20 border border-neutral-700
                      opacity-0 group-hover:opacity-100
                      pointer-events-none
                      transition-opacity duration-200
                      whitespace-nowrap z-50
                    ">
                      {item.label}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Divider - full width */}
      <div className="border-t border-neutral-700" />

      {/* Bottom section */}
      <div className="pb-4 px-3 pt-2">
        {/* Collapse toggle button */}
        <button
          onClick={toggleCollapsed}
          className="w-full flex items-center justify-center py-2 mb-1 rounded-lg relative group
            text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04]
            transition-all duration-200 ease-out
            outline-none focus:outline-none"
        >
          {isCollapsed ? (
            <LuChevronsRight className="w-5 h-5" />
          ) : (
            <LuChevronsLeft className="w-5 h-5" />
          )}

          {/* Flyout tooltip - only when collapsed */}
          {isCollapsed && (
            <span className="
              absolute left-full top-1/2 -translate-y-1/2 ml-3
              px-3 py-1.5 rounded-lg
              bg-neutral-800 text-white text-[13px] font-medium
              shadow-lg shadow-black/20 border border-neutral-700
              opacity-0 group-hover:opacity-100
              pointer-events-none
              transition-opacity duration-200
              whitespace-nowrap z-50
            ">
              Expand sidebar
            </span>
          )}
        </button>

        {/* Achievements */}
        <button
          onClick={() => navigate('achievements')}
          className={`
            w-full flex items-center gap-3 py-2.5 px-4 rounded-lg
            transition-all duration-300 ease-out relative group
            text-[14px] font-medium tracking-[-0.01em]
            outline-none focus:outline-none
            ${currentPage === 'achievements'
              ? 'bg-white/[0.08] text-white'
              : 'text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200 active:bg-white/[0.06]'
            }
          `}
        >
          {/* Active indicator */}
          <span
            className={`
              absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full
              transition-all duration-300 ease-out
              ${currentPage === 'achievements' ? 'h-4 bg-orange-500' : 'h-0 bg-orange-500/0'}
            `}
          />

          {/* Icon with smooth size transition */}
          <span className={`
            transition-all duration-300 ease-out flex-shrink-0
            ${currentPage === 'achievements'
              ? 'text-orange-400'
              : 'text-neutral-500 group-hover:text-neutral-400'
            }
          `}>
            <GrAchievement className={`transition-all duration-300 ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />
          </span>

          {/* Label with smooth fade transition */}
          <span className={`
            transition-all duration-300 ease-out overflow-hidden whitespace-nowrap
            ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}
          `}>
            Achievements
          </span>

          {/* Flyout tooltip - only when collapsed */}
          {isCollapsed && (
            <span className="
              absolute left-full top-1/2 -translate-y-1/2 ml-3
              px-3 py-1.5 rounded-lg
              bg-neutral-800 text-white text-[13px] font-medium
              shadow-lg shadow-black/20 border border-neutral-700
              opacity-0 group-hover:opacity-100
              pointer-events-none
              transition-opacity duration-200
              whitespace-nowrap z-50
            ">
              Achievements
            </span>
          )}
        </button>

        {/* User tile - clicks to Settings */}
        {currentUser && (
          <button
            onClick={() => navigate('settings')}
            disabled={isSwitching}
            className={`
              w-full flex items-center gap-3 py-2.5 px-4 rounded-lg mt-1
              transition-all duration-300 ease-out relative group
              hover:bg-white/[0.04] active:bg-white/[0.06]
              outline-none focus:outline-none
              ${currentPage === 'settings' ? 'bg-white/[0.08]' : ''}
              ${isSwitching ? 'pointer-events-none' : ''}
            `}
          >
            {/* Active indicator */}
            <span
              className={`
                absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full
                transition-all duration-300 ease-out
                ${currentPage === 'settings' ? 'h-4 bg-orange-500' : 'h-0 bg-orange-500/0'}
              `}
            />
            {/* Avatar - stays in place like other nav icons */}
            {currentUser.profilePhoto ? (
              <img
                src={currentUser.profilePhoto}
                alt={currentUser.name}
                className={`
                  w-8 h-8 rounded-full object-cover flex-shrink-0
                  transition-all duration-300 ease-out
                  ${isSwitching ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}
                `}
              />
            ) : (
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] font-semibold flex-shrink-0
                  transition-all duration-300 ease-out
                  ${isSwitching ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}
                `}
                style={{ backgroundColor: currentUser.avatarColor }}
              >
                {(currentUser.firstName?.charAt(0) ?? '').toUpperCase()}
                {(currentUser.lastName?.charAt(0) ?? '').toUpperCase()}
              </div>
            )}
            {/* User info - fades out when collapsed */}
            <div className={`
              min-w-0 text-left transition-all duration-300 ease-out overflow-hidden whitespace-nowrap
              ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}
              ${isSwitching ? 'opacity-0 translate-x-2' : 'translate-x-0'}
            `}>
              <span className="text-[13px] font-medium text-neutral-200 block truncate whitespace-nowrap">
                {currentUser.name}
              </span>
              {/* Stats row */}
              <div className="flex items-center gap-2.5 mt-0.5 whitespace-nowrap">
                {/* Streak */}
                <span className="text-[12px] text-neutral-500 flex items-center gap-1">
                  <FaFire className={`w-3.5 h-3.5 ${currentStreak > 0 ? 'text-orange-400' : 'opacity-50'}`} />
                  <span className={currentStreak > 0 ? 'text-orange-400 font-medium' : ''}>
                    {currentStreak}
                  </span>
                </span>
                {/* Weight */}
                <span className="text-[12px] text-neutral-500 flex items-center gap-1">
                  <IoScale className="w-3.5 h-3.5" />
                  <span>{latestWeight?.weight ?? '—'}</span>
                </span>
              </div>
            </div>

            {/* Flyout tooltip - only when collapsed */}
            {isCollapsed && (
              <span className="
                absolute left-full top-1/2 -translate-y-1/2 ml-3
                px-3 py-1.5 rounded-lg
                bg-neutral-800 text-white text-[13px] font-medium
                shadow-lg shadow-black/20 border border-neutral-700
                opacity-0 group-hover:opacity-100
                pointer-events-none
                transition-opacity duration-200
                whitespace-nowrap z-50
              ">
                {currentUser.name}
              </span>
            )}
          </button>
        )}
      </div>
    </aside>
  );
};
