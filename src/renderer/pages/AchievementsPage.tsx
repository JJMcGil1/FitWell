/**
 * AchievementsPage
 *
 * Displays all achievements organized by category with progress tracking.
 * Shows unlocked achievements with unlock dates and locked ones with progress.
 */

import React, { useEffect, useState } from 'react';
import { HiOutlineCheck, HiStar, HiMiniStar } from 'react-icons/hi2';
import { useUserStore } from '../stores/userStore';
import {
  useAchievementStore,
  getTierColor,
  getCategoryLabel,
  CategoryIcon,
  AchievementIcon,
} from '../stores/achievementStore';
import type { AchievementCategory, AchievementProgress, AchievementTier } from '../../shared/types';
import { format } from 'date-fns';

// ============================================
// Achievement Card Component
// ============================================

interface AchievementCardProps {
  achievement: AchievementProgress;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  const { definition, currentValue, isUnlocked, unlockedAt, progressPercent } = achievement;
  const tierColor = getTierColor(definition.tier);

  // Tier symbols using react-icons
  const tierSymbol = {
    platinum: <HiStar className="w-3 h-3 text-white" />,
    gold: <HiMiniStar className="w-3 h-3 text-white" />,
    silver: <span className="w-2 h-2 rounded-full bg-white inline-block" />,
    bronze: <span className="w-2 h-2 rounded-full border border-white inline-block" />,
  };

  return (
    <div
      className={`
        relative rounded-xl p-4 border transition-all duration-200
        ${isUnlocked
          ? 'bg-white dark:bg-neutral-800 border-gray-100 dark:border-neutral-700 shadow-sm'
          : 'bg-gray-50 dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 opacity-75'
        }
      `}
    >
      {/* Tier Badge */}
      <div
        className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-sm"
        style={{ backgroundColor: tierColor }}
      >
        {tierSymbol[definition.tier]}
      </div>

      {/* Icon */}
      <div className="mb-3 text-gray-700 dark:text-gray-300">
        {isUnlocked ? (
          <AchievementIcon icon={definition.icon} size="lg" />
        ) : (
          <AchievementIcon icon="lock" size="lg" className="text-gray-400 dark:text-neutral-500" />
        )}
      </div>

      {/* Name & Description */}
      <h3 className={`font-semibold text-sm ${isUnlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-neutral-400'}`}>
        {definition.name}
      </h3>
      <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1 line-clamp-2">
        {definition.description}
      </p>

      {/* Progress or Unlock Date */}
      {isUnlocked ? (
        <div className="mt-3 flex items-center gap-1.5">
          <HiOutlineCheck className="w-3.5 h-3.5 text-green-500" />
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            Unlocked {unlockedAt ? format(new Date(unlockedAt), 'MMM d, yyyy') : ''}
          </span>
        </div>
      ) : (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400 dark:text-neutral-500">Progress</span>
            <span className="text-gray-600 dark:text-neutral-300 font-medium">
              {definition.requirementType === 'distance'
                ? `${currentValue.toFixed(1)} / ${definition.requirement}`
                : `${Math.floor(currentValue)} / ${definition.requirement}`
              }
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(progressPercent, 100)}%`,
                backgroundColor: tierColor,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// Category Section Component
// ============================================

interface CategorySectionProps {
  category: AchievementCategory;
  achievements: AchievementProgress[];
}

const CategorySection: React.FC<CategorySectionProps> = ({ category, achievements }) => {
  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-neutral-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
          <CategoryIcon category={category} size="md" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {getCategoryLabel(category)}
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            {unlockedCount} of {achievements.length} unlocked
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {achievements.map((achievement) => (
          <AchievementCard key={achievement.definition.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
};

// ============================================
// Stats Overview Component
// ============================================

interface StatsOverviewProps {
  totalUnlocked: number;
  totalAchievements: number;
  stats: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ totalUnlocked, totalAchievements, stats }) => {
  const percentage = totalAchievements > 0 ? (totalUnlocked / totalAchievements) * 100 : 0;

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white mb-8 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Main Stats */}
        <div>
          <h2 className="text-3xl font-bold">{totalUnlocked} / {totalAchievements}</h2>
          <p className="text-amber-100 mt-1">Achievements Unlocked</p>

          {/* Progress Bar */}
          <div className="mt-4 w-64">
            <div className="h-2 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-xs text-amber-100 mt-1">{percentage.toFixed(0)}% complete</p>
          </div>
        </div>

        {/* Tier Breakdown */}
        <div className="flex gap-4">
          <TierBadge tier="bronze" count={stats.bronze} />
          <TierBadge tier="silver" count={stats.silver} />
          <TierBadge tier="gold" count={stats.gold} />
          <TierBadge tier="platinum" count={stats.platinum} />
        </div>
      </div>
    </div>
  );
};

const TierBadge: React.FC<{ tier: AchievementTier; count: number }> = ({ tier, count }) => (
  <div className="text-center">
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-md"
      style={{ backgroundColor: getTierColor(tier) }}
    >
      {count}
    </div>
    <p className="text-xs text-amber-100 mt-1 capitalize">{tier}</p>
  </div>
);

// ============================================
// Filter Tabs Component
// ============================================

type FilterType = 'all' | 'unlocked' | 'locked';

interface FilterTabsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: { all: number; unlocked: number; locked: number };
}

const FilterTabs: React.FC<FilterTabsProps> = ({ activeFilter, onFilterChange, counts }) => (
  <div className="flex gap-2 mb-6">
    {(['all', 'unlocked', 'locked'] as FilterType[]).map((filter) => (
      <button
        key={filter}
        onClick={() => onFilterChange(filter)}
        className={`
          px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
          ${activeFilter === filter
            ? 'bg-orange-500 text-white'
            : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
          }
        `}
      >
        {filter.charAt(0).toUpperCase() + filter.slice(1)} ({counts[filter]})
      </button>
    ))}
  </div>
);

// ============================================
// Main Achievements Page
// ============================================

export const AchievementsPage: React.FC = () => {
  const { currentUser } = useUserStore();
  const {
    stats,
    fetchAchievements,
    fetchStats,
    checkAndUnlockAchievements,
    getAchievementProgress,
    getUnlockedCount,
    getTotalCount,
  } = useAchievementStore();

  const [filter, setFilter] = useState<FilterType>('all');
  const [isChecking, setIsChecking] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    if (currentUser) {
      fetchAchievements(currentUser.id);
      fetchStats(currentUser.id);
    }
  }, [currentUser?.id]);

  // Check for new achievements when stats change
  useEffect(() => {
    const checkAchievements = async () => {
      if (currentUser && stats && !isChecking) {
        setIsChecking(true);
        await checkAndUnlockAchievements(currentUser.id);
        setIsChecking(false);
      }
    };
    checkAchievements();
  }, [stats]);

  const allProgress = getAchievementProgress();

  // Filter achievements
  const filteredProgress = allProgress.filter((ap) => {
    if (filter === 'unlocked') return ap.isUnlocked;
    if (filter === 'locked') return !ap.isUnlocked;
    return true;
  });

  // Group by category
  const categories: AchievementCategory[] = ['workout', 'running', 'weight', 'streak', 'special'];
  const groupedAchievements = categories.reduce((acc, category) => {
    acc[category] = filteredProgress.filter((ap) => ap.definition.category === category);
    return acc;
  }, {} as Record<AchievementCategory, AchievementProgress[]>);

  // Calculate tier stats for unlocked achievements
  const tierStats = {
    bronze: allProgress.filter((ap) => ap.isUnlocked && ap.definition.tier === 'bronze').length,
    silver: allProgress.filter((ap) => ap.isUnlocked && ap.definition.tier === 'silver').length,
    gold: allProgress.filter((ap) => ap.isUnlocked && ap.definition.tier === 'gold').length,
    platinum: allProgress.filter((ap) => ap.isUnlocked && ap.definition.tier === 'platinum').length,
  };

  const counts = {
    all: allProgress.length,
    unlocked: allProgress.filter((ap) => ap.isUnlocked).length,
    locked: allProgress.filter((ap) => !ap.isUnlocked).length,
  };

  return (
    <div className="h-full overflow-y-auto p-6 pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Achievements</h1>
        <p className="text-gray-500 dark:text-neutral-400 mt-1">
          Track your fitness milestones and earn badges
        </p>
      </div>

      {/* Stats Overview */}
      <StatsOverview
        totalUnlocked={getUnlockedCount()}
        totalAchievements={getTotalCount()}
        stats={tierStats}
      />

      {/* Filter Tabs */}
      <FilterTabs
        activeFilter={filter}
        onFilterChange={setFilter}
        counts={counts}
      />

      {/* Achievement Categories */}
      {categories.map((category) => {
        const categoryAchievements = groupedAchievements[category];
        if (categoryAchievements.length === 0) return null;

        return (
          <CategorySection
            key={category}
            category={category}
            achievements={categoryAchievements}
          />
        );
      })}

      {/* Empty State */}
      {filteredProgress.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-4">
            <AchievementIcon icon="trophy" size="lg" />
          </div>
          <p className="text-gray-500 dark:text-neutral-400">
            {filter === 'unlocked'
              ? "You haven't unlocked any achievements yet. Keep working out!"
              : filter === 'locked'
              ? "Amazing! You've unlocked all achievements!"
              : "No achievements found."
            }
          </p>
        </div>
      )}
    </div>
  );
};
