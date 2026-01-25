/**
 * Achievement Store
 *
 * Manages achievement definitions, user unlocks, and progress calculation.
 * Achievement definitions are static - only unlocks are persisted.
 */

import React from 'react';
import { create } from 'zustand';
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

// SVG Icon component that renders based on icon type
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
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
        </svg>
      );
    case 'bicep':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      );
    case 'flame':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
        </svg>
      );
    case 'star':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      );
    case 'hundred':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      );
    case 'trophy':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
        </svg>
      );
    case 'crown':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3L3 9l1.5 12h15L21 9l-9-6z" />
        </svg>
      );
    case 'runner':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84" />
        </svg>
      );
    case 'shoe':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
        </svg>
      );
    case 'jersey':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      );
    case 'sparkle':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      );
    case 'trident':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
        </svg>
      );
    case 'road':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
        </svg>
      );
    case 'globe':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
      );
    case 'scale':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
        </svg>
      );
    case 'trending-down':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
        </svg>
      );
    case 'target':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'medal':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
        </svg>
      );
    case 'butterfly':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
        </svg>
      );
    case 'calendar':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      );
    case 'bolt':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      );
    case 'moon':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      );
    case 'diamond':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      );
    case 'sunrise':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      );
    case 'palette':
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
        </svg>
      );
    case 'lock':
    default:
      return (
        <svg className={baseClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      );
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
