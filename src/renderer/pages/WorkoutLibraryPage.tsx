/**
 * WorkoutLibraryPage
 *
 * A comprehensive exercise reference library.
 * Browse exercises by muscle group, equipment, or difficulty.
 * Each exercise card shows target muscles, equipment needed, and a brief description.
 *
 * This is a read-only reference — no database interaction required.
 * Future: add-to-routine integration, video links, personal notes.
 */

import React, { useState, useMemo } from 'react';
import {
  HiOutlineMagnifyingGlass,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineXMark,
  HiOutlineBolt,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
} from 'react-icons/hi2';

// ============================================
// Types
// ============================================

type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'glutes'
  | 'core'
  | 'full-body'
  | 'cardio';

type Difficulty = 'beginner' | 'intermediate' | 'advanced';

type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'kettlebell'
  | 'bands'
  | 'bench'
  | 'pull-up bar'
  | 'box'
  | 'jump rope'
  | 'rowing machine'
  | 'bike'
  | 'battle ropes'
  | 'ab wheel'
  | 'trx'
  | 'foam roller'
  | 'none';

interface LibraryExercise {
  id: string;
  name: string;
  category: MuscleGroup;
  equipment: Equipment[];
  difficulty: Difficulty;
  description: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  tips?: string;
}

// ============================================
// Category visual config
// ============================================

const CATEGORY_CONFIG: Record<MuscleGroup, { label: string; gradient: string; icon: string; bgAccent: string }> = {
  chest:      { label: 'Chest',      gradient: 'from-red-500 to-rose-600',      icon: '🏋️', bgAccent: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' },
  back:       { label: 'Back',       gradient: 'from-blue-500 to-indigo-600',   icon: '🔙', bgAccent: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  shoulders:  { label: 'Shoulders',  gradient: 'from-purple-500 to-violet-600', icon: '💪', bgAccent: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800' },
  biceps:     { label: 'Biceps',     gradient: 'from-orange-500 to-amber-600',  icon: '💪', bgAccent: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800' },
  triceps:    { label: 'Triceps',    gradient: 'from-teal-500 to-cyan-600',     icon: '💪', bgAccent: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800' },
  legs:       { label: 'Legs',       gradient: 'from-green-500 to-emerald-600', icon: '🦵', bgAccent: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' },
  glutes:     { label: 'Glutes',     gradient: 'from-pink-500 to-fuchsia-600',  icon: '🍑', bgAccent: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800' },
  core:       { label: 'Core',       gradient: 'from-yellow-500 to-orange-600', icon: '🎯', bgAccent: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' },
  'full-body': { label: 'Full Body', gradient: 'from-brand-500 to-red-600',     icon: '🔥', bgAccent: 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800' },
  cardio:     { label: 'Cardio',     gradient: 'from-sky-500 to-blue-600',      icon: '❤️', bgAccent: 'bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800' },
};

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string }> = {
  beginner:     { label: 'Beginner',     color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
  intermediate: { label: 'Intermediate', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
  advanced:     { label: 'Advanced',     color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
};

// ============================================
// Exercise Library Data
// ============================================

const EXERCISES: LibraryExercise[] = [
  // ── CHEST ──
  {
    id: 'bench-press',
    name: 'Bench Press',
    category: 'chest',
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    description: 'The king of chest exercises. Lie flat on a bench and press a barbell from chest level to full arm extension.',
    primaryMuscles: ['Pectoralis Major'],
    secondaryMuscles: ['Anterior Deltoid', 'Triceps'],
    tips: 'Keep your feet flat on the floor and maintain a slight arch in your lower back.',
  },
  {
    id: 'incline-bench-press',
    name: 'Incline Bench Press',
    category: 'chest',
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    description: 'Performed on an incline bench (30-45 degrees) to target the upper portion of the chest.',
    primaryMuscles: ['Upper Pectoralis Major'],
    secondaryMuscles: ['Anterior Deltoid', 'Triceps'],
    tips: 'Set the bench to 30-45 degrees. Too steep and it becomes a shoulder press.',
  },
  {
    id: 'decline-bench-press',
    name: 'Decline Bench Press',
    category: 'chest',
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    description: 'Performed on a decline bench to emphasize the lower chest fibers.',
    primaryMuscles: ['Lower Pectoralis Major'],
    secondaryMuscles: ['Triceps', 'Anterior Deltoid'],
  },
  {
    id: 'dumbbell-fly',
    name: 'Dumbbell Fly',
    category: 'chest',
    equipment: ['dumbbell', 'bench'],
    difficulty: 'beginner',
    description: 'An isolation movement where you arc dumbbells outward and back together, stretching the chest fibers.',
    primaryMuscles: ['Pectoralis Major'],
    secondaryMuscles: ['Anterior Deltoid'],
    tips: 'Keep a slight bend in your elbows throughout. Think of hugging a tree.',
  },
  {
    id: 'push-ups',
    name: 'Push-Ups',
    category: 'chest',
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    description: 'The classic bodyweight chest builder. Keep your body in a straight plank and lower your chest to the floor.',
    primaryMuscles: ['Pectoralis Major'],
    secondaryMuscles: ['Triceps', 'Anterior Deltoid', 'Core'],
    tips: 'Keep your core tight and avoid flaring your elbows past 45 degrees.',
  },
  {
    id: 'cable-crossover',
    name: 'Cable Crossover',
    category: 'chest',
    equipment: ['cable'],
    difficulty: 'intermediate',
    description: 'Standing cable fly that provides constant tension through the full range of motion.',
    primaryMuscles: ['Pectoralis Major'],
    secondaryMuscles: ['Anterior Deltoid'],
  },
  {
    id: 'chest-dip',
    name: 'Chest Dip',
    category: 'chest',
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    description: 'Lean forward on parallel bars to shift emphasis from triceps to the lower chest.',
    primaryMuscles: ['Lower Pectoralis Major'],
    secondaryMuscles: ['Triceps', 'Anterior Deltoid'],
    tips: 'Lean your torso forward about 30 degrees to target the chest more.',
  },
  {
    id: 'dumbbell-bench-press',
    name: 'Dumbbell Bench Press',
    category: 'chest',
    equipment: ['dumbbell', 'bench'],
    difficulty: 'beginner',
    description: 'A bench press variation using dumbbells, allowing for a greater range of motion and independent arm work.',
    primaryMuscles: ['Pectoralis Major'],
    secondaryMuscles: ['Anterior Deltoid', 'Triceps'],
  },

  // ── BACK ──
  {
    id: 'deadlift',
    name: 'Deadlift',
    category: 'back',
    equipment: ['barbell'],
    difficulty: 'advanced',
    description: 'The ultimate compound lift. Hinge at the hips to lift a loaded barbell from the floor to hip height.',
    primaryMuscles: ['Erector Spinae', 'Glutes', 'Hamstrings'],
    secondaryMuscles: ['Lats', 'Traps', 'Forearms', 'Core'],
    tips: 'Keep the bar close to your body. Drive through your heels and engage your lats.',
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    category: 'back',
    equipment: ['barbell'],
    difficulty: 'intermediate',
    description: 'Bend at the hips and pull a barbell toward your lower chest, squeezing your shoulder blades together.',
    primaryMuscles: ['Latissimus Dorsi', 'Rhomboids'],
    secondaryMuscles: ['Biceps', 'Rear Deltoid', 'Erector Spinae'],
    tips: 'Keep your back flat and avoid using momentum to swing the weight.',
  },
  {
    id: 'pull-ups',
    name: 'Pull-Ups',
    category: 'back',
    equipment: ['pull-up bar'],
    difficulty: 'intermediate',
    description: 'Hang from a bar with an overhand grip and pull your chin above the bar. The gold standard of back exercises.',
    primaryMuscles: ['Latissimus Dorsi'],
    secondaryMuscles: ['Biceps', 'Teres Major', 'Rhomboids'],
    tips: 'Initiate the pull by depressing your shoulder blades, not by pulling with your arms.',
  },
  {
    id: 'chin-ups',
    name: 'Chin-Ups',
    category: 'back',
    equipment: ['pull-up bar'],
    difficulty: 'intermediate',
    description: 'An underhand-grip pull-up that increases bicep engagement while still heavily working the lats.',
    primaryMuscles: ['Latissimus Dorsi', 'Biceps'],
    secondaryMuscles: ['Teres Major', 'Rhomboids'],
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    category: 'back',
    equipment: ['cable', 'machine'],
    difficulty: 'beginner',
    description: 'A cable machine exercise that mimics the pull-up motion. Great for building lat width.',
    primaryMuscles: ['Latissimus Dorsi'],
    secondaryMuscles: ['Biceps', 'Teres Major'],
    tips: 'Pull the bar to your upper chest, not behind your neck.',
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    category: 'back',
    equipment: ['cable'],
    difficulty: 'beginner',
    description: 'Sit at a cable station and pull a handle toward your midsection for mid-back thickness.',
    primaryMuscles: ['Rhomboids', 'Mid Trapezius'],
    secondaryMuscles: ['Latissimus Dorsi', 'Biceps', 'Erector Spinae'],
  },
  {
    id: 't-bar-row',
    name: 'T-Bar Row',
    category: 'back',
    equipment: ['barbell'],
    difficulty: 'intermediate',
    description: 'A rowing variation using a landmine setup or T-bar machine for heavy mid-back work.',
    primaryMuscles: ['Rhomboids', 'Latissimus Dorsi'],
    secondaryMuscles: ['Biceps', 'Rear Deltoid', 'Erector Spinae'],
  },
  {
    id: 'face-pulls',
    name: 'Face Pulls',
    category: 'back',
    equipment: ['cable'],
    difficulty: 'beginner',
    description: 'Pull a rope attachment toward your face with elbows high. Essential for shoulder health and rear delts.',
    primaryMuscles: ['Rear Deltoid', 'Rhomboids'],
    secondaryMuscles: ['Mid Trapezius', 'External Rotators'],
    tips: 'Pull apart at the end of each rep for full contraction.',
  },
  {
    id: 'single-arm-dumbbell-row',
    name: 'Single-Arm Dumbbell Row',
    category: 'back',
    equipment: ['dumbbell', 'bench'],
    difficulty: 'beginner',
    description: 'Row a dumbbell with one arm while bracing on a bench. Allows full range of motion and corrects imbalances.',
    primaryMuscles: ['Latissimus Dorsi'],
    secondaryMuscles: ['Rhomboids', 'Biceps', 'Rear Deltoid'],
  },

  // ── SHOULDERS ──
  {
    id: 'overhead-press',
    name: 'Overhead Press',
    category: 'shoulders',
    equipment: ['barbell'],
    difficulty: 'intermediate',
    description: 'Press a barbell from shoulder height to full lockout overhead. The primary shoulder mass builder.',
    primaryMuscles: ['Anterior Deltoid', 'Medial Deltoid'],
    secondaryMuscles: ['Triceps', 'Upper Trapezius', 'Core'],
    tips: 'Brace your core hard. Move your head back slightly as the bar passes, then push it forward under the bar.',
  },
  {
    id: 'dumbbell-shoulder-press',
    name: 'Dumbbell Shoulder Press',
    category: 'shoulders',
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    description: 'Press dumbbells overhead from shoulder height. Allows for a more natural range of motion than barbell.',
    primaryMuscles: ['Anterior Deltoid', 'Medial Deltoid'],
    secondaryMuscles: ['Triceps', 'Upper Trapezius'],
  },
  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    category: 'shoulders',
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    description: 'Raise dumbbells out to the sides to shoulder height. The go-to isolation move for wider-looking shoulders.',
    primaryMuscles: ['Medial Deltoid'],
    secondaryMuscles: ['Upper Trapezius'],
    tips: 'Use lighter weight with control. Lead with your elbows, not your hands.',
  },
  {
    id: 'front-raise',
    name: 'Front Raise',
    category: 'shoulders',
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    description: 'Raise dumbbells straight in front of you to shoulder height, isolating the anterior delts.',
    primaryMuscles: ['Anterior Deltoid'],
    secondaryMuscles: ['Medial Deltoid'],
  },
  {
    id: 'reverse-fly',
    name: 'Reverse Fly',
    category: 'shoulders',
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    description: 'Bend forward and raise dumbbells out to the sides, targeting the often-neglected rear delts.',
    primaryMuscles: ['Rear Deltoid'],
    secondaryMuscles: ['Rhomboids', 'Mid Trapezius'],
  },
  {
    id: 'arnold-press',
    name: 'Arnold Press',
    category: 'shoulders',
    equipment: ['dumbbell'],
    difficulty: 'intermediate',
    description: 'Start with palms facing you and rotate to a standard press at the top. Hits all three deltoid heads.',
    primaryMuscles: ['Anterior Deltoid', 'Medial Deltoid'],
    secondaryMuscles: ['Triceps', 'Rear Deltoid'],
    tips: 'Named after Arnold Schwarzenegger. The rotation adds time under tension.',
  },
  {
    id: 'upright-row',
    name: 'Upright Row',
    category: 'shoulders',
    equipment: ['barbell'],
    difficulty: 'intermediate',
    description: 'Pull a barbell vertically along your body to chin height with elbows leading outward.',
    primaryMuscles: ['Medial Deltoid', 'Upper Trapezius'],
    secondaryMuscles: ['Biceps', 'Anterior Deltoid'],
    tips: 'Use a wider grip to reduce shoulder impingement risk.',
  },
  {
    id: 'shrugs',
    name: 'Barbell Shrugs',
    category: 'shoulders',
    equipment: ['barbell'],
    difficulty: 'beginner',
    description: 'Hold a heavy barbell at arm\'s length and shrug your shoulders straight up toward your ears.',
    primaryMuscles: ['Upper Trapezius'],
    secondaryMuscles: ['Levator Scapulae'],
  },

  // ── BICEPS ──
  {
    id: 'dumbbell-curl',
    name: 'Dumbbell Curl',
    category: 'biceps',
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    description: 'The classic arm builder. Curl dumbbells from full extension to shoulder height with a supinated grip.',
    primaryMuscles: ['Biceps Brachii'],
    secondaryMuscles: ['Brachialis', 'Forearms'],
    tips: 'Keep your elbows pinned to your sides. Avoid swinging.',
  },
  {
    id: 'barbell-curl',
    name: 'Barbell Curl',
    category: 'biceps',
    equipment: ['barbell'],
    difficulty: 'beginner',
    description: 'Curl a straight or EZ bar with both hands for maximum bicep loading.',
    primaryMuscles: ['Biceps Brachii'],
    secondaryMuscles: ['Brachialis', 'Forearms'],
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    category: 'biceps',
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    description: 'Curl with a neutral (palms facing each other) grip, emphasizing the brachialis and forearms.',
    primaryMuscles: ['Brachialis', 'Biceps Brachii'],
    secondaryMuscles: ['Brachioradialis'],
    tips: 'Great for building arm thickness. Keep the neutral grip throughout.',
  },
  {
    id: 'preacher-curl',
    name: 'Preacher Curl',
    category: 'biceps',
    equipment: ['dumbbell', 'bench'],
    difficulty: 'intermediate',
    description: 'Curl over a preacher bench to eliminate momentum and isolate the biceps peak.',
    primaryMuscles: ['Biceps Brachii (short head)'],
    secondaryMuscles: ['Brachialis'],
  },
  {
    id: 'concentration-curl',
    name: 'Concentration Curl',
    category: 'biceps',
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    description: 'Sit on a bench, brace your elbow against your inner thigh, and curl for maximum isolation.',
    primaryMuscles: ['Biceps Brachii'],
    secondaryMuscles: ['Brachialis'],
    tips: 'Squeeze at the top for a full contraction. This is a pure isolation movement.',
  },
  {
    id: 'cable-curl',
    name: 'Cable Curl',
    category: 'biceps',
    equipment: ['cable'],
    difficulty: 'beginner',
    description: 'Perform bicep curls using a low cable pulley for constant tension throughout the movement.',
    primaryMuscles: ['Biceps Brachii'],
    secondaryMuscles: ['Brachialis', 'Forearms'],
  },
  {
    id: 'incline-dumbbell-curl',
    name: 'Incline Dumbbell Curl',
    category: 'biceps',
    equipment: ['dumbbell', 'bench'],
    difficulty: 'intermediate',
    description: 'Curl from an inclined position to get a deep stretch on the biceps long head.',
    primaryMuscles: ['Biceps Brachii (long head)'],
    secondaryMuscles: ['Brachialis'],
    tips: 'Set the bench to 45-60 degrees. Let arms hang straight down before curling.',
  },

  // ── TRICEPS ──
  {
    id: 'tricep-dip',
    name: 'Tricep Dip',
    category: 'triceps',
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    description: 'Dip between parallel bars with an upright torso to emphasize the triceps over the chest.',
    primaryMuscles: ['Triceps Brachii'],
    secondaryMuscles: ['Anterior Deltoid', 'Pectoralis Major'],
    tips: 'Keep your body upright (unlike chest dips where you lean forward).',
  },
  {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown',
    category: 'triceps',
    equipment: ['cable'],
    difficulty: 'beginner',
    description: 'Push a cable bar or rope attachment downward from chest height, locking your elbows at the bottom.',
    primaryMuscles: ['Triceps Brachii'],
    secondaryMuscles: ['Anconeus'],
    tips: 'Keep your elbows tight to your sides. Only your forearms should move.',
  },
  {
    id: 'overhead-tricep-extension',
    name: 'Overhead Tricep Extension',
    category: 'triceps',
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    description: 'Hold a dumbbell overhead with both hands and lower it behind your head, then press back up.',
    primaryMuscles: ['Triceps Brachii (long head)'],
    secondaryMuscles: ['Anconeus'],
  },
  {
    id: 'skull-crushers',
    name: 'Skull Crushers',
    category: 'triceps',
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    description: 'Lie on a bench and lower an EZ bar toward your forehead, then extend your arms back up.',
    primaryMuscles: ['Triceps Brachii'],
    secondaryMuscles: ['Anconeus'],
    tips: 'Keep your upper arms vertical. Lower to the forehead or just behind the head.',
  },
  {
    id: 'close-grip-bench-press',
    name: 'Close-Grip Bench Press',
    category: 'triceps',
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    description: 'A bench press with a narrow grip (hands shoulder-width) to shift emphasis to the triceps.',
    primaryMuscles: ['Triceps Brachii'],
    secondaryMuscles: ['Pectoralis Major', 'Anterior Deltoid'],
  },
  {
    id: 'diamond-push-ups',
    name: 'Diamond Push-Ups',
    category: 'triceps',
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    description: 'Push-ups with hands together forming a diamond shape, dramatically increasing tricep engagement.',
    primaryMuscles: ['Triceps Brachii'],
    secondaryMuscles: ['Pectoralis Major', 'Anterior Deltoid'],
  },
  {
    id: 'tricep-kickback',
    name: 'Tricep Kickback',
    category: 'triceps',
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    description: 'Hinge forward and extend a dumbbell behind you, fully straightening the arm.',
    primaryMuscles: ['Triceps Brachii'],
    secondaryMuscles: ['Anconeus'],
    tips: 'Keep your upper arm parallel to the floor throughout the movement.',
  },

  // ── LEGS ──
  {
    id: 'barbell-squat',
    name: 'Barbell Squat',
    category: 'legs',
    equipment: ['barbell'],
    difficulty: 'intermediate',
    description: 'The king of leg exercises. Place a barbell on your upper back and squat down until thighs are parallel.',
    primaryMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Erector Spinae', 'Core'],
    tips: 'Push your knees out over your toes. Keep your chest up and core braced.',
  },
  {
    id: 'front-squat',
    name: 'Front Squat',
    category: 'legs',
    equipment: ['barbell'],
    difficulty: 'advanced',
    description: 'Hold the barbell on the front of your shoulders, forcing a more upright torso and greater quad emphasis.',
    primaryMuscles: ['Quadriceps'],
    secondaryMuscles: ['Glutes', 'Core', 'Upper Back'],
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    category: 'legs',
    equipment: ['machine'],
    difficulty: 'beginner',
    description: 'Push a weighted sled away from your body using both legs on a 45-degree leg press machine.',
    primaryMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstrings'],
    tips: 'Don\'t lock your knees at the top. Adjust foot placement to shift emphasis.',
  },
  {
    id: 'lunges',
    name: 'Walking Lunges',
    category: 'legs',
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    description: 'Step forward into a lunge, alternating legs as you walk. Great for unilateral leg development.',
    primaryMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Core'],
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    category: 'legs',
    equipment: ['dumbbell', 'bench'],
    difficulty: 'intermediate',
    description: 'A single-leg squat with the rear foot elevated on a bench. Devastating for quads and glutes.',
    primaryMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Core'],
    tips: 'Keep your front shin as vertical as possible. Most of the weight is on the front leg.',
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    category: 'legs',
    equipment: ['machine'],
    difficulty: 'beginner',
    description: 'Sit on the machine and extend your legs from bent to straight, isolating the quadriceps.',
    primaryMuscles: ['Quadriceps'],
    secondaryMuscles: [],
  },
  {
    id: 'leg-curl',
    name: 'Leg Curl',
    category: 'legs',
    equipment: ['machine'],
    difficulty: 'beginner',
    description: 'Lie face down and curl the weight toward your glutes, isolating the hamstrings.',
    primaryMuscles: ['Hamstrings'],
    secondaryMuscles: ['Gastrocnemius'],
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    category: 'legs',
    equipment: ['barbell'],
    difficulty: 'intermediate',
    description: 'A hip-hinge movement with a slight knee bend that deeply stretches and loads the hamstrings.',
    primaryMuscles: ['Hamstrings', 'Glutes'],
    secondaryMuscles: ['Erector Spinae', 'Core'],
    tips: 'Keep the bar close to your legs. Push your hips back like closing a car door with your butt.',
  },
  {
    id: 'calf-raises',
    name: 'Calf Raises',
    category: 'legs',
    equipment: ['machine'],
    difficulty: 'beginner',
    description: 'Rise up onto your toes, either standing or seated, to build the calves.',
    primaryMuscles: ['Gastrocnemius', 'Soleus'],
    secondaryMuscles: [],
    tips: 'Use a full range of motion — stretch at the bottom, squeeze at the top.',
  },
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    category: 'legs',
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    description: 'Hold a dumbbell at chest height and squat deep. Perfect for learning squat mechanics.',
    primaryMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Core', 'Upper Back'],
  },
  {
    id: 'hack-squat',
    name: 'Hack Squat',
    category: 'legs',
    equipment: ['machine'],
    difficulty: 'intermediate',
    description: 'A machine squat variation that stabilizes the back and isolates the quads.',
    primaryMuscles: ['Quadriceps'],
    secondaryMuscles: ['Glutes', 'Hamstrings'],
  },

  // ── GLUTES ──
  {
    id: 'hip-thrust',
    name: 'Hip Thrust',
    category: 'glutes',
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    description: 'Lean your upper back against a bench and drive a loaded barbell upward by extending your hips.',
    primaryMuscles: ['Gluteus Maximus'],
    secondaryMuscles: ['Hamstrings', 'Core'],
    tips: 'Squeeze your glutes hard at the top. Chin tucked, eyes forward.',
  },
  {
    id: 'glute-bridge',
    name: 'Glute Bridge',
    category: 'glutes',
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    description: 'Lie on your back with knees bent and drive your hips up by squeezing your glutes.',
    primaryMuscles: ['Gluteus Maximus'],
    secondaryMuscles: ['Hamstrings', 'Core'],
  },
  {
    id: 'cable-kickback',
    name: 'Cable Kickback',
    category: 'glutes',
    equipment: ['cable'],
    difficulty: 'beginner',
    description: 'Attach an ankle strap to a low cable and kick your leg straight back, squeezing the glute.',
    primaryMuscles: ['Gluteus Maximus'],
    secondaryMuscles: ['Hamstrings'],
  },
  {
    id: 'sumo-deadlift',
    name: 'Sumo Deadlift',
    category: 'glutes',
    equipment: ['barbell'],
    difficulty: 'advanced',
    description: 'Deadlift with a wide stance and toes pointed out, emphasizing inner thighs and glutes.',
    primaryMuscles: ['Glutes', 'Adductors'],
    secondaryMuscles: ['Hamstrings', 'Quadriceps', 'Erector Spinae'],
  },
  {
    id: 'step-ups',
    name: 'Step-Ups',
    category: 'glutes',
    equipment: ['dumbbell', 'box'],
    difficulty: 'beginner',
    description: 'Step onto an elevated platform one leg at a time, driving through the heel.',
    primaryMuscles: ['Glutes', 'Quadriceps'],
    secondaryMuscles: ['Hamstrings', 'Core'],
  },

  // ── CORE ──
  {
    id: 'plank',
    name: 'Plank',
    category: 'core',
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    description: 'Hold a rigid push-up position on your forearms. The foundation of core training.',
    primaryMuscles: ['Rectus Abdominis', 'Transverse Abdominis'],
    secondaryMuscles: ['Obliques', 'Erector Spinae', 'Shoulders'],
    tips: 'Keep your body in a straight line. Don\'t let your hips sag or pike up.',
  },
  {
    id: 'side-plank',
    name: 'Side Plank',
    category: 'core',
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    description: 'Hold your body sideways on one forearm, targeting the obliques and lateral core stability.',
    primaryMuscles: ['Obliques'],
    secondaryMuscles: ['Transverse Abdominis', 'Glute Medius'],
  },
  {
    id: 'crunches',
    name: 'Crunches',
    category: 'core',
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    description: 'Lie on your back with knees bent and curl your shoulders off the ground, contracting your abs.',
    primaryMuscles: ['Rectus Abdominis'],
    secondaryMuscles: ['Obliques'],
  },
  {
    id: 'russian-twist',
    name: 'Russian Twist',
    category: 'core',
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    description: 'Sit with your torso leaned back, feet off the ground, and rotate side to side.',
    primaryMuscles: ['Obliques'],
    secondaryMuscles: ['Rectus Abdominis', 'Hip Flexors'],
    tips: 'Add a dumbbell or medicine ball for extra resistance.',
  },
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    category: 'core',
    equipment: ['pull-up bar'],
    difficulty: 'advanced',
    description: 'Hang from a bar and raise your legs to horizontal (or higher) for intense lower ab work.',
    primaryMuscles: ['Lower Rectus Abdominis', 'Hip Flexors'],
    secondaryMuscles: ['Obliques', 'Forearms'],
    tips: 'Avoid swinging. Control the negative (lowering) phase.',
  },
  {
    id: 'ab-rollout',
    name: 'Ab Rollout',
    category: 'core',
    equipment: ['ab wheel'],
    difficulty: 'advanced',
    description: 'Kneel and roll an ab wheel forward, extending your body, then contract back. Intense anti-extension work.',
    primaryMuscles: ['Rectus Abdominis', 'Transverse Abdominis'],
    secondaryMuscles: ['Lats', 'Shoulders', 'Hip Flexors'],
  },
  {
    id: 'mountain-climbers',
    name: 'Mountain Climbers',
    category: 'core',
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    description: 'From a push-up position, rapidly alternate driving knees toward your chest.',
    primaryMuscles: ['Core', 'Hip Flexors'],
    secondaryMuscles: ['Shoulders', 'Quadriceps'],
  },
  {
    id: 'dead-bug',
    name: 'Dead Bug',
    category: 'core',
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    description: 'Lie on your back and slowly extend opposite arm and leg while keeping your lower back pressed to the floor.',
    primaryMuscles: ['Transverse Abdominis', 'Rectus Abdominis'],
    secondaryMuscles: ['Hip Flexors'],
    tips: 'The key is keeping your lower back flat on the ground. If it lifts, reduce range of motion.',
  },
  {
    id: 'bicycle-crunch',
    name: 'Bicycle Crunch',
    category: 'core',
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    description: 'Alternate bringing elbow to opposite knee in a cycling motion. Great for obliques.',
    primaryMuscles: ['Obliques', 'Rectus Abdominis'],
    secondaryMuscles: ['Hip Flexors'],
  },
  {
    id: 'pallof-press',
    name: 'Pallof Press',
    category: 'core',
    equipment: ['cable', 'bands'],
    difficulty: 'intermediate',
    description: 'Press a cable or band straight out from your chest while resisting rotation. Premier anti-rotation exercise.',
    primaryMuscles: ['Obliques', 'Transverse Abdominis'],
    secondaryMuscles: ['Glutes', 'Shoulders'],
  },

  // ── FULL BODY ──
  {
    id: 'burpees',
    name: 'Burpees',
    category: 'full-body',
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    description: 'Drop to a push-up, perform it, jump your feet forward, and explosively jump up. Full-body conditioning.',
    primaryMuscles: ['Full Body'],
    secondaryMuscles: ['Chest', 'Shoulders', 'Quads', 'Core'],
    tips: 'Scale by removing the push-up or jump as needed.',
  },
  {
    id: 'kettlebell-swing',
    name: 'Kettlebell Swing',
    category: 'full-body',
    equipment: ['kettlebell'],
    difficulty: 'intermediate',
    description: 'Hinge at the hips and explosively swing a kettlebell to shoulder height using hip drive.',
    primaryMuscles: ['Glutes', 'Hamstrings'],
    secondaryMuscles: ['Core', 'Shoulders', 'Lats'],
    tips: 'This is a hip hinge, not a squat. The power comes from your hips, not your arms.',
  },
  {
    id: 'clean-and-press',
    name: 'Clean and Press',
    category: 'full-body',
    equipment: ['barbell'],
    difficulty: 'advanced',
    description: 'Explosively clean a barbell from the floor to your shoulders, then press it overhead.',
    primaryMuscles: ['Full Body'],
    secondaryMuscles: ['Traps', 'Shoulders', 'Legs', 'Core'],
  },
  {
    id: 'turkish-get-up',
    name: 'Turkish Get-Up',
    category: 'full-body',
    equipment: ['kettlebell'],
    difficulty: 'advanced',
    description: 'Start lying down holding a weight overhead and stand up through a series of deliberate movements.',
    primaryMuscles: ['Core', 'Shoulders'],
    secondaryMuscles: ['Glutes', 'Legs', 'Chest'],
    tips: 'Learn the movement unloaded first. Each position is a checkpoint.',
  },
  {
    id: 'thrusters',
    name: 'Thrusters',
    category: 'full-body',
    equipment: ['barbell'],
    difficulty: 'intermediate',
    description: 'Combine a front squat with an overhead press in one fluid motion. Popular in CrossFit.',
    primaryMuscles: ['Quadriceps', 'Shoulders'],
    secondaryMuscles: ['Glutes', 'Core', 'Triceps'],
  },
  {
    id: 'man-makers',
    name: 'Man Makers',
    category: 'full-body',
    equipment: ['dumbbell'],
    difficulty: 'advanced',
    description: 'A brutal combo: push-up, renegade row each side, squat clean, and overhead press.',
    primaryMuscles: ['Full Body'],
    secondaryMuscles: ['Chest', 'Back', 'Shoulders', 'Core', 'Legs'],
  },
  {
    id: 'farmers-walk',
    name: 'Farmer\'s Walk',
    category: 'full-body',
    equipment: ['dumbbell'],
    difficulty: 'beginner',
    description: 'Hold heavy dumbbells at your sides and walk for distance or time. Builds total-body strength and grip.',
    primaryMuscles: ['Forearms', 'Traps', 'Core'],
    secondaryMuscles: ['Legs', 'Shoulders'],
    tips: 'Stand tall, shoulders back. Walk with deliberate, controlled steps.',
  },

  // ── CARDIO ──
  {
    id: 'running',
    name: 'Running',
    category: 'cardio',
    equipment: ['none'],
    difficulty: 'beginner',
    description: 'The most fundamental cardio exercise. Run outdoors or on a treadmill at your chosen pace.',
    primaryMuscles: ['Heart', 'Lungs', 'Quadriceps'],
    secondaryMuscles: ['Hamstrings', 'Calves', 'Core'],
  },
  {
    id: 'cycling',
    name: 'Cycling',
    category: 'cardio',
    equipment: ['bike'],
    difficulty: 'beginner',
    description: 'Low-impact cardio on a stationary or road bike. Great for building leg endurance.',
    primaryMuscles: ['Heart', 'Quadriceps'],
    secondaryMuscles: ['Hamstrings', 'Calves', 'Glutes'],
  },
  {
    id: 'jump-rope',
    name: 'Jump Rope',
    category: 'cardio',
    equipment: ['jump rope'],
    difficulty: 'beginner',
    description: 'A high-intensity, low-cost cardio option that also builds coordination and calf endurance.',
    primaryMuscles: ['Calves', 'Heart'],
    secondaryMuscles: ['Shoulders', 'Forearms', 'Core'],
    tips: 'Use your wrists to turn the rope, not your whole arms.',
  },
  {
    id: 'rowing',
    name: 'Rowing',
    category: 'cardio',
    equipment: ['rowing machine'],
    difficulty: 'beginner',
    description: 'A full-body cardio exercise on a rowing machine. Works 86% of your muscles.',
    primaryMuscles: ['Heart', 'Lats', 'Legs'],
    secondaryMuscles: ['Biceps', 'Core', 'Shoulders'],
  },
  {
    id: 'box-jumps',
    name: 'Box Jumps',
    category: 'cardio',
    equipment: ['box'],
    difficulty: 'intermediate',
    description: 'Explosively jump onto a raised platform. Builds power and elevates heart rate.',
    primaryMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Calves', 'Core', 'Hamstrings'],
    tips: 'Step down instead of jumping down to save your joints.',
  },
  {
    id: 'battle-ropes',
    name: 'Battle Ropes',
    category: 'cardio',
    equipment: ['battle ropes'],
    difficulty: 'intermediate',
    description: 'Create waves with heavy ropes using alternating or simultaneous arm movements.',
    primaryMuscles: ['Shoulders', 'Core', 'Heart'],
    secondaryMuscles: ['Arms', 'Back', 'Legs'],
  },
  {
    id: 'stair-climber',
    name: 'Stair Climber',
    category: 'cardio',
    equipment: ['machine'],
    difficulty: 'beginner',
    description: 'Climb endlessly on a stair machine. Exceptional for glutes and cardio endurance.',
    primaryMuscles: ['Glutes', 'Quadriceps', 'Heart'],
    secondaryMuscles: ['Calves', 'Hamstrings'],
  },
  {
    id: 'swimming',
    name: 'Swimming',
    category: 'cardio',
    equipment: ['none'],
    difficulty: 'beginner',
    description: 'A zero-impact, full-body cardio exercise. Works every major muscle group.',
    primaryMuscles: ['Heart', 'Lats', 'Shoulders'],
    secondaryMuscles: ['Core', 'Legs', 'Chest'],
  },
  {
    id: 'sprints',
    name: 'Sprints',
    category: 'cardio',
    equipment: ['none'],
    difficulty: 'intermediate',
    description: 'Short bursts of maximal-effort running. One of the most effective fat-burning exercises.',
    primaryMuscles: ['Quadriceps', 'Glutes', 'Heart'],
    secondaryMuscles: ['Hamstrings', 'Calves', 'Core'],
  },
];

// ============================================
// Exercise Card Component
// ============================================

interface ExerciseCardProps {
  exercise: LibraryExercise;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const catConfig = CATEGORY_CONFIG[exercise.category];
  const diffConfig = DIFFICULTY_CONFIG[exercise.difficulty];

  return (
    <div
      className="group bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 transition-all duration-200 hover:shadow-soft overflow-hidden cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Gradient header with icon */}
      <div className={`h-20 bg-gradient-to-br ${catConfig.gradient} flex items-center justify-center relative overflow-hidden`}>
        <span className="text-4xl opacity-90 select-none" role="img">{catConfig.icon}</span>
        {/* Decorative circles */}
        <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/10" />
        <div className="absolute -bottom-2 -left-2 w-10 h-10 rounded-full bg-white/10" />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name */}
        <h3 className="font-semibold text-[15px] text-gray-900 dark:text-gray-100 leading-tight">
          {exercise.name}
        </h3>

        {/* Tags row */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {/* Difficulty badge */}
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${diffConfig.color}`}>
            {diffConfig.label}
          </span>
          {/* Category badge */}
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${catConfig.bgAccent}`}>
            {catConfig.label}
          </span>
        </div>

        {/* Description */}
        <p className={`text-xs text-gray-500 dark:text-gray-400 mt-2.5 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
          {exercise.description}
        </p>

        {/* Expanded details */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-neutral-700/50 space-y-2.5 animate-fade-in">
            {/* Primary Muscles */}
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Primary Muscles
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {exercise.primaryMuscles.map((m) => (
                  <span key={m} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Secondary Muscles */}
            {exercise.secondaryMuscles.length > 0 && (
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Secondary Muscles
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {exercise.secondaryMuscles.map((m) => (
                    <span key={m} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-400">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Equipment */}
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Equipment
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {exercise.equipment.map((e) => (
                  <span key={e} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-400 capitalize">
                    {e === 'none' ? 'No equipment' : e.replace('-', ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Tips */}
            {exercise.tips && (
              <div className="mt-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
                <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                  <span className="font-semibold">Pro tip:</span> {exercise.tips}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Expand indicator */}
        <div className="flex items-center justify-center mt-2">
          {isExpanded ? (
            <HiOutlineChevronUp className="w-4 h-4 text-gray-300 dark:text-gray-600" />
          ) : (
            <HiOutlineChevronDown className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 transition-colors" />
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// Category Filter Pills
// ============================================

const ALL_CATEGORIES: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core', 'full-body', 'cardio',
];

const ALL_DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

// ============================================
// Main Page Component
// ============================================

export const WorkoutLibraryPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MuscleGroup | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter exercises
  const filteredExercises = useMemo(() => {
    return EXERCISES.filter((ex) => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          ex.name.toLowerCase().includes(q) ||
          ex.description.toLowerCase().includes(q) ||
          ex.primaryMuscles.some((m) => m.toLowerCase().includes(q)) ||
          ex.secondaryMuscles.some((m) => m.toLowerCase().includes(q)) ||
          ex.equipment.some((e) => e.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && ex.category !== selectedCategory) return false;

      // Difficulty filter
      if (selectedDifficulty !== 'all' && ex.difficulty !== selectedDifficulty) return false;

      return true;
    });
  }, [searchQuery, selectedCategory, selectedDifficulty]);

  // Group by category for display
  const groupedExercises = useMemo(() => {
    if (selectedCategory !== 'all') {
      return [{ category: selectedCategory, exercises: filteredExercises }];
    }

    const groups: { category: MuscleGroup; exercises: LibraryExercise[] }[] = [];
    for (const cat of ALL_CATEGORIES) {
      const catExercises = filteredExercises.filter((ex) => ex.category === cat);
      if (catExercises.length > 0) {
        groups.push({ category: cat, exercises: catExercises });
      }
    }
    return groups;
  }, [filteredExercises, selectedCategory]);

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) + (selectedDifficulty !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedDifficulty('all');
    setSearchQuery('');
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
              Workout Library
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {EXERCISES.length} exercises across {ALL_CATEGORIES.length} muscle groups
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-3 mt-4">
          {/* Search input */}
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercises, muscles, equipment..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <HiOutlineXMark className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              showFilters || activeFilterCount > 0
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                : 'border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700'
            }`}
          >
            <HiOutlineAdjustmentsHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-[11px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-3 p-4 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 animate-fade-in">
            {/* Category pills */}
            <div className="mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 block">
                Muscle Group
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600'
                  }`}
                >
                  All
                </button>
                {ALL_CATEGORIES.map((cat) => {
                  const config = CATEGORY_CONFIG[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedCategory === cat
                          ? 'bg-brand-500 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600'
                      }`}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty pills */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 block">
                Difficulty
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedDifficulty('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedDifficulty === 'all'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600'
                  }`}
                >
                  All Levels
                </button>
                {ALL_DIFFICULTIES.map((diff) => {
                  const config = DIFFICULTY_CONFIG[diff];
                  return (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedDifficulty === diff
                          ? 'bg-brand-500 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-600'
                      }`}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clear filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-3 text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="px-6 py-3 flex items-center justify-between">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
        </span>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Exercise Grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        {filteredExercises.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                <HiOutlineBolt className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No exercises found
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                Try adjusting your search or filters to find what you're looking for.
              </p>
              <button
                onClick={clearFilters}
                className="btn-primary"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedExercises.map(({ category, exercises }) => {
              const config = CATEGORY_CONFIG[category];
              return (
                <div key={category}>
                  {/* Section header — only show when viewing "all" */}
                  {selectedCategory === 'all' && (
                    <div className="flex items-center gap-2.5 mb-4">
                      <span className="text-xl select-none" role="img">{config.icon}</span>
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {config.label}
                      </h2>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        ({exercises.length})
                      </span>
                      <div className="flex-1 border-t border-gray-200 dark:border-neutral-700 ml-2" />
                    </div>
                  )}

                  {/* Cards grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {exercises.map((exercise) => (
                      <ExerciseCard key={exercise.id} exercise={exercise} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
