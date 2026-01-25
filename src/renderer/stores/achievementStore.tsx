/**
 * Achievement Store
 *
 * Manages achievement definitions, user unlocks, and progress calculation.
 * Achievement definitions are static - only unlocks are persisted.
 */

import React from 'react';
import { create } from 'zustand';
import {
  HiOutlineSquares2X2,
  HiOutlineSparkles,
  HiOutlineFire,
  HiOutlineStar,
  HiOutlineChartBar,
  HiOutlineTrophy,
  HiOutlineShieldCheck,
  HiOutlineGlobeAmericas,
  HiOutlineUser,
  HiOutlineMapPin,
  HiOutlineMap,
  HiOutlineScale,
  HiOutlineArrowTrendingDown,
  HiOutlineClock,
  HiOutlineCheckBadge,
  HiOutlineRocketLaunch,
  HiOutlineCalendar,
  HiOutlineBolt,
  HiOutlineMoon,
  HiOutlineHeart,
  HiOutlineSun,
  HiOutlinePaintBrush,
  HiOutlineLockClosed,
} from 'react-icons/hi2';
import { PiCompassRoseBold, PiSneaker } from 'react-icons/pi';
import type {
  AchievementDefinition,
  UserAchievement,
  AchievementProgress,
  AchievementStats,
  AchievementCategory,
  AchievementTier,
} from '../../shared/types';

// ============================================
// Icon Components (SVG-based)
// ============================================

// Icon type identifiers used in achievement definitions
export type AchievementIconType =
  | 'dumbbell'
  | 'bicep'
  | 'flame'
  | 'star'
  | 'hundred'
  | 'trophy'
  | 'crown'
  | 'runner'
  | 'shoe'
  | 'jersey'
  | 'sparkle'
  | 'trident'
  | 'road'
  | 'globe'
  | 'scale'
  | 'trending-down'
  | 'target'
  | 'medal'
  | 'butterfly'
  | 'calendar'
  | 'bolt'
  | 'moon'
  | 'diamond'
  | 'sunrise'
  | 'palette'
  | 'lock';

// Icon component that renders based on icon type using react-icons
export const AchievementIcon: React.FC<{
  icon: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ icon, className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const baseClass = `${sizeClasses[size]} ${className}`;

  switch (icon) {
    case 'dumbbell':
      return <HiOutlineSquares2X2 className={baseClass} />;
    case 'bicep':
      return <HiOutlineSparkles className={baseClass} />;
    case 'flame':
      return <HiOutlineFire className={baseClass} />;
    case 'star':
      return <HiOutlineStar className={baseClass} />;
    case 'hundred':
      return <HiOutlineChartBar className={baseClass} />;
    case 'trophy':
      return <HiOutlineTrophy className={baseClass} />;
    case 'crown':
      return <HiOutlineShieldCheck className={baseClass} />;
    case 'runner':
      return <PiCompassRoseBold className={baseClass} />;
    case 'shoe':
      return <PiSneaker className={baseClass} />;
    case 'jersey':
      return <HiOutlineUser className={baseClass} />;
    case 'sparkle':
      return <HiOutlineSparkles className={baseClass} />;
    case 'trident':
      return <HiOutlineMapPin className={baseClass} />;
    case 'road':
      return <HiOutlineMap className={baseClass} />;
    case 'globe':
      return <HiOutlineGlobeAmericas className={baseClass} />;
    case 'scale':
      return <HiOutlineScale className={baseClass} />;
    case 'trending-down':
      return <HiOutlineArrowTrendingDown className={baseClass} />;
    case 'target':
      return <HiOutlineClock className={baseClass} />;
    case 'medal':
      return <HiOutlineCheckBadge className={baseClass} />;
    case 'butterfly':
      return <HiOutlineRocketLaunch className={baseClass} />;
    case 'calendar':
      return <HiOutlineCalendar className={baseClass} />;
    case 'bolt':
      return <HiOutlineBolt className={baseClass} />;
    case 'moon':
      return <HiOutlineMoon className={baseClass} />;
    case 'diamond':
      return <HiOutlineHeart className={baseClass} />;
    case 'sunrise':
      return <HiOutlineSun className={baseClass} />;
    case 'palette':
      return <HiOutlinePaintBrush className={baseClass} />;
    case 'lock':
    default:
      return <HiOutlineLockClosed className={baseClass} />;
  }
};

// ============================================
// Achievement Definitions (Static)
// ============================================

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // ========== WORKOUT ACHIEVEMENTS ==========
  {
    id: 'workout_first',
    name: 'First Steps',
    description: 'Complete your first workout',
    category: 'workout',
    tier: 'bronze',
    icon: 'dumbbell',
    requirement: 1,
    requirementType: 'count',
  },
  {
    id: 'workout_10',
    name: 'Getting Started',
    description: 'Complete 10 workouts',
    category: 'workout',
    tier: 'bronze',
    icon: 'bicep',
    requirement: 10,
    requirementType: 'count',
  },
  {
    id: 'workout_25',
    name: 'Building Habits',
    description: 'Complete 25 workouts',
    category: 'workout',
    tier: 'silver',
    icon: 'flame',
    requirement: 25,
    requirementType: 'count',
  },
  {
    id: 'workout_50',
    name: 'Committed',
    description: 'Complete 50 workouts',
    category: 'workout',
    tier: 'silver',
    icon: 'star',
    requirement: 50,
    requirementType: 'count',
  },
  {
    id: 'workout_100',
    name: 'Century Club',
    description: 'Complete 100 workouts',
    category: 'workout',
    tier: 'gold',
    icon: 'hundred',
    requirement: 100,
    requirementType: 'count',
  },
  {
    id: 'workout_250',
    name: 'Fitness Enthusiast',
    description: 'Complete 250 workouts',
    category: 'workout',
    tier: 'gold',
    icon: 'trophy',
    requirement: 250,
    requirementType: 'count',
  },
  {
    id: 'workout_500',
    name: 'Iron Will',
    description: 'Complete 500 workouts',
    category: 'workout',
    tier: 'platinum',
    icon: 'crown',
    requirement: 500,
    requirementType: 'count',
  },

  // ========== RUNNING ACHIEVEMENTS ==========
  {
    id: 'run_first',
    name: 'First Mile',
    description: 'Log your first run',
    category: 'running',
    tier: 'bronze',
    icon: 'runner',
    requirement: 1,
    requirementType: 'count',
  },
  {
    id: 'run_10_miles',
    name: '10 Miler',
    description: 'Run a total of 10 miles',
    category: 'running',
    tier: 'bronze',
    icon: 'shoe',
    requirement: 10,
    requirementType: 'distance',
  },
  {
    id: 'run_26_miles',
    name: 'Marathon Distance',
    description: 'Run a total of 26.2 miles',
    category: 'running',
    tier: 'silver',
    icon: 'jersey',
    requirement: 26.2,
    requirementType: 'distance',
  },
  {
    id: 'run_50_miles',
    name: 'Fifty Miles',
    description: 'Run a total of 50 miles',
    category: 'running',
    tier: 'silver',
    icon: 'sparkle',
    requirement: 50,
    requirementType: 'distance',
  },
  {
    id: 'run_100_miles',
    name: 'Century Runner',
    description: 'Run a total of 100 miles',
    category: 'running',
    tier: 'gold',
    icon: 'trident',
    requirement: 100,
    requirementType: 'distance',
  },
  {
    id: 'run_500_miles',
    name: 'Road Warrior',
    description: 'Run a total of 500 miles',
    category: 'running',
    tier: 'gold',
    icon: 'road',
    requirement: 500,
    requirementType: 'distance',
  },
  {
    id: 'run_1000_miles',
    name: 'Thousand Mile Club',
    description: 'Run a total of 1,000 miles',
    category: 'running',
    tier: 'platinum',
    icon: 'globe',
    requirement: 1000,
    requirementType: 'distance',
  },

  // ========== WEIGHT ACHIEVEMENTS ==========
  {
    id: 'weight_first',
    name: 'Weight Watcher',
    description: 'Log your first weight entry',
    category: 'weight',
    tier: 'bronze',
    icon: 'scale',
    requirement: 1,
    requirementType: 'count',
  },
  {
    id: 'weight_lost_5',
    name: 'First Five',
    description: 'Lose 5 pounds from your starting weight',
    category: 'weight',
    tier: 'bronze',
    icon: 'trending-down',
    requirement: 5,
    requirementType: 'weight_lost',
  },
  {
    id: 'weight_lost_10',
    name: 'Ten Down',
    description: 'Lose 10 pounds from your starting weight',
    category: 'weight',
    tier: 'silver',
    icon: 'target',
    requirement: 10,
    requirementType: 'weight_lost',
  },
  {
    id: 'weight_lost_25',
    name: 'Quarter Century',
    description: 'Lose 25 pounds from your starting weight',
    category: 'weight',
    tier: 'gold',
    icon: 'medal',
    requirement: 25,
    requirementType: 'weight_lost',
  },
  {
    id: 'weight_lost_50',
    name: 'Transformation',
    description: 'Lose 50 pounds from your starting weight',
    category: 'weight',
    tier: 'platinum',
    icon: 'butterfly',
    requirement: 50,
    requirementType: 'weight_lost',
  },

  // ========== STREAK ACHIEVEMENTS ==========
  {
    id: 'streak_3',
    name: 'Three-peat',
    description: 'Maintain a 3-day streak',
    category: 'streak',
    tier: 'bronze',
    icon: 'flame',
    requirement: 3,
    requirementType: 'streak',
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    category: 'streak',
    tier: 'bronze',
    icon: 'calendar',
    requirement: 7,
    requirementType: 'streak',
  },
  {
    id: 'streak_14',
    name: 'Two Week Titan',
    description: 'Maintain a 14-day streak',
    category: 'streak',
    tier: 'silver',
    icon: 'bolt',
    requirement: 14,
    requirementType: 'streak',
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    category: 'streak',
    tier: 'silver',
    icon: 'moon',
    requirement: 30,
    requirementType: 'streak',
  },
  {
    id: 'streak_60',
    name: 'Two Month Champion',
    description: 'Maintain a 60-day streak',
    category: 'streak',
    tier: 'gold',
    icon: 'diamond',
    requirement: 60,
    requirementType: 'streak',
  },
  {
    id: 'streak_100',
    name: 'Century Streak',
    description: 'Maintain a 100-day streak',
    category: 'streak',
    tier: 'gold',
    icon: 'trophy',
    requirement: 100,
    requirementType: 'streak',
  },
  {
    id: 'streak_365',
    name: 'Year of Dedication',
    description: 'Maintain a 365-day streak',
    category: 'streak',
    tier: 'platinum',
    icon: 'crown',
    requirement: 365,
    requirementType: 'streak',
  },

  // ========== SPECIAL ACHIEVEMENTS ==========
  {
    id: 'special_early_bird',
    name: 'Early Bird',
    description: 'Complete your first workout (any time counts!)',
    category: 'special',
    tier: 'bronze',
    icon: 'sunrise',
    requirement: 1,
    requirementType: 'custom',
  },
  {
    id: 'special_variety',
    name: 'Well Rounded',
    description: 'Complete workouts and runs (do both!)',
    category: 'special',
    tier: 'silver',
    icon: 'palette',
    requirement: 1,
    requirementType: 'custom',
  },
];

// ============================================
// Store Interface
// ============================================

interface AchievementState {
  // Data
  userAchievements: UserAchievement[];
  stats: AchievementStats | null;

  // State
  isLoading: boolean;
  error: string | null;
  newlyUnlocked: AchievementDefinition[]; // For showing unlock notifications

  // Actions
  fetchAchievements: (userId: string) => Promise<void>;
  fetchStats: (userId: string) => Promise<void>;
  checkAndUnlockAchievements: (userId: string) => Promise<AchievementDefinition[]>;
  dismissNewlyUnlocked: () => void;

  // Computed
  getAchievementProgress: () => AchievementProgress[];
  getAchievementsByCategory: (category: AchievementCategory) => AchievementProgress[];
  getUnlockedCount: () => number;
  getTotalCount: () => number;

  // Reset
  reset: () => void;
}

const initialState = {
  userAchievements: [],
  stats: null,
  isLoading: false,
  error: null,
  newlyUnlocked: [],
};

// ============================================
// Store Implementation
// ============================================

export const useAchievementStore = create<AchievementState>((set, get) => ({
  ...initialState,

  fetchAchievements: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const userAchievements = await window.api.getUserAchievements(userId);
      set({ userAchievements, isLoading: false });
    } catch (error) {
      console.error('[AchievementStore] Failed to fetch achievements:', error);
      set({ error: 'Failed to load achievements', isLoading: false });
    }
  },

  fetchStats: async (userId: string) => {
    try {
      const stats = await window.api.getAchievementStats(userId);
      set({ stats });
    } catch (error) {
      console.error('[AchievementStore] Failed to fetch stats:', error);
    }
  },

  checkAndUnlockAchievements: async (userId: string) => {
    const { stats, userAchievements } = get();
    if (!stats) return [];

    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));
    const newlyUnlocked: AchievementDefinition[] = [];

    for (const def of ACHIEVEMENT_DEFINITIONS) {
      // Skip if already unlocked
      if (unlockedIds.has(def.id)) continue;

      let currentValue = 0;
      let shouldUnlock = false;

      switch (def.requirementType) {
        case 'count':
          if (def.category === 'workout') {
            currentValue = stats.totalWorkouts;
          } else if (def.category === 'running') {
            currentValue = stats.totalRuns;
          } else if (def.category === 'weight') {
            currentValue = stats.firstWeightEntry !== null ? 1 : 0;
          }
          shouldUnlock = currentValue >= def.requirement;
          break;

        case 'distance':
          currentValue = stats.totalMiles;
          shouldUnlock = currentValue >= def.requirement;
          break;

        case 'weight_lost':
          currentValue = stats.weightLost;
          shouldUnlock = currentValue >= def.requirement;
          break;

        case 'streak':
          // Check both current and longest streak
          currentValue = Math.max(stats.currentStreak, stats.longestStreak);
          shouldUnlock = currentValue >= def.requirement;
          break;

        case 'custom':
          // Special achievements with custom logic
          if (def.id === 'special_early_bird') {
            shouldUnlock = stats.totalWorkouts >= 1;
          } else if (def.id === 'special_variety') {
            shouldUnlock = stats.totalWorkouts >= 1 && stats.totalRuns >= 1;
          }
          break;
      }

      if (shouldUnlock) {
        try {
          await window.api.unlockAchievement(userId, def.id);
          newlyUnlocked.push(def);
          unlockedIds.add(def.id);
        } catch (error) {
          console.error(`[AchievementStore] Failed to unlock ${def.id}:`, error);
        }
      }
    }

    if (newlyUnlocked.length > 0) {
      // Refresh achievements list
      const updatedAchievements = await window.api.getUserAchievements(userId);
      set({
        userAchievements: updatedAchievements,
        newlyUnlocked,
      });
    }

    return newlyUnlocked;
  },

  dismissNewlyUnlocked: () => {
    set({ newlyUnlocked: [] });
  },

  getAchievementProgress: () => {
    const { userAchievements, stats } = get();
    if (!stats) return [];

    const unlockedMap = new Map(
      userAchievements.map((ua) => [ua.achievementId, ua.unlockedAt])
    );

    return ACHIEVEMENT_DEFINITIONS.map((def) => {
      let currentValue = 0;

      switch (def.requirementType) {
        case 'count':
          if (def.category === 'workout') {
            currentValue = stats.totalWorkouts;
          } else if (def.category === 'running') {
            currentValue = stats.totalRuns;
          } else if (def.category === 'weight') {
            currentValue = stats.firstWeightEntry !== null ? 1 : 0;
          }
          break;

        case 'distance':
          currentValue = stats.totalMiles;
          break;

        case 'weight_lost':
          currentValue = stats.weightLost;
          break;

        case 'streak':
          currentValue = Math.max(stats.currentStreak, stats.longestStreak);
          break;

        case 'custom':
          if (def.id === 'special_early_bird') {
            currentValue = stats.totalWorkouts >= 1 ? 1 : 0;
          } else if (def.id === 'special_variety') {
            currentValue = stats.totalWorkouts >= 1 && stats.totalRuns >= 1 ? 1 : 0;
          }
          break;
      }

      const isUnlocked = unlockedMap.has(def.id);
      const progressPercent = Math.min(100, (currentValue / def.requirement) * 100);

      return {
        definition: def,
        currentValue,
        isUnlocked,
        unlockedAt: unlockedMap.get(def.id),
        progressPercent,
      };
    });
  },

  getAchievementsByCategory: (category: AchievementCategory) => {
    return get().getAchievementProgress().filter((ap) => ap.definition.category === category);
  },

  getUnlockedCount: () => {
    return get().userAchievements.length;
  },

  getTotalCount: () => {
    return ACHIEVEMENT_DEFINITIONS.length;
  },

  reset: () => {
    set(initialState);
  },
}));

// ============================================
// Helper Functions
// ============================================

export function getTierColor(tier: AchievementTier): string {
  switch (tier) {
    case 'bronze':
      return '#CD7F32';
    case 'silver':
      return '#C0C0C0';
    case 'gold':
      return '#FFD700';
    case 'platinum':
      return '#E5E4E2';
    default:
      return '#6B7280';
  }
}

export function getCategoryLabel(category: AchievementCategory): string {
  switch (category) {
    case 'workout':
      return 'Workouts';
    case 'running':
      return 'Running';
    case 'weight':
      return 'Weight';
    case 'streak':
      return 'Streaks';
    case 'special':
      return 'Special';
    default:
      return category;
  }
}

// Returns the icon type identifier for a category
export function getCategoryIconType(category: AchievementCategory): string {
  switch (category) {
    case 'workout':
      return 'dumbbell';
    case 'running':
      return 'runner';
    case 'weight':
      return 'scale';
    case 'streak':
      return 'flame';
    case 'special':
      return 'star';
    default:
      return 'trophy';
  }
}

// Returns a React element for the category icon
export function CategoryIcon({ category, className = '', size = 'md' }: {
  category: AchievementCategory;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}): React.ReactElement {
  return React.createElement(AchievementIcon, {
    icon: getCategoryIconType(category),
    className,
    size,
  });
}
