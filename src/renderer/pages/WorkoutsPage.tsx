/**
 * WorkoutsPage
 *
 * Track strength training, cardio, and other workouts.
 * Features workout logging, exercise tracking, and history.
 */

import React, { useState, useEffect } from 'react';
import { useUserStore } from '../stores/userStore';
import {
  useWorkoutStore,
  createEmptyExercise,
  createEmptySet,
  generateSetId,
} from '../stores/workoutStore';
import type { Workout, WorkoutType, Exercise, ExerciseSet } from '../../shared/types';
import { format, subDays, isToday, isYesterday, parseISO } from 'date-fns';

// Workout type configurations
const WORKOUT_TYPES: { type: WorkoutType; label: string; icon: JSX.Element; color: string }[] = [
  {
    type: 'strength',
    label: 'Strength',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    color: 'bg-blue-500',
  },
  {
    type: 'cardio',
    label: 'Cardio',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    color: 'bg-red-500',
  },
  {
    type: 'flexibility',
    label: 'Flexibility',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    color: 'bg-purple-500',
  },
  {
    type: 'sports',
    label: 'Sports',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
      </svg>
    ),
    color: 'bg-green-500',
  },
  {
    type: 'other',
    label: 'Other',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    ),
    color: 'bg-gray-500',
  },
];

// Common exercises for quick selection
const COMMON_EXERCISES: Record<WorkoutType, string[]> = {
  strength: [
    'Bench Press', 'Squat', 'Deadlift', 'Shoulder Press', 'Barbell Row',
    'Pull-ups', 'Dumbbell Curl', 'Tricep Extension', 'Leg Press', 'Lunges',
  ],
  cardio: ['Running', 'Cycling', 'Swimming', 'Jump Rope', 'Rowing', 'Elliptical', 'Walking', 'HIIT'],
  flexibility: ['Yoga', 'Stretching', 'Pilates', 'Foam Rolling', 'Mobility Work'],
  sports: ['Basketball', 'Soccer', 'Tennis', 'Golf', 'Volleyball', 'Climbing', 'Martial Arts'],
  other: ['Hiking', 'Dancing', 'Gardening', 'Housework'],
};

export const WorkoutsPage: React.FC = () => {
  const { currentUser } = useUserStore();
  const {
    workouts,
    isLoading,
    fetchWorkouts,
    createWorkout,
    deleteWorkout,
    getWorkoutStats,
    filterType,
    setFilterType,
    getFilteredWorkouts,
  } = useWorkoutStore();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  // Form state
  const [workoutType, setWorkoutType] = useState<WorkoutType>('strength');
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDate, setWorkoutDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [workoutDuration, setWorkoutDuration] = useState<number | ''>('');
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([createEmptyExercise()]);

  // Fetch workouts on mount
  useEffect(() => {
    if (currentUser) {
      // Fetch last 90 days of workouts
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(), 90), 'yyyy-MM-dd');
      fetchWorkouts(currentUser.id, startDate, endDate);
    }
  }, [currentUser, fetchWorkouts]);

  const stats = getWorkoutStats();
  const filteredWorkouts = getFilteredWorkouts();

  const resetForm = () => {
    setWorkoutType('strength');
    setWorkoutName('');
    setWorkoutDate(format(new Date(), 'yyyy-MM-dd'));
    setWorkoutDuration('');
    setWorkoutNotes('');
    setExercises([createEmptyExercise()]);
    setEditingWorkout(null);
  };

  const openModal = (workout?: Workout) => {
    if (workout) {
      setEditingWorkout(workout);
      setWorkoutType(workout.type);
      setWorkoutName(workout.name);
      setWorkoutDate(workout.date);
      setWorkoutDuration(workout.duration || '');
      setWorkoutNotes(workout.notes || '');
      setExercises(workout.exercises.length > 0 ? workout.exercises : [createEmptyExercise()]);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSaveWorkout = async () => {
    if (!currentUser || !workoutName.trim()) return;

    // Filter out empty exercises
    const validExercises = exercises.filter((e) => e.name.trim());

    const workoutData = {
      userId: currentUser.id,
      date: workoutDate,
      type: workoutType,
      name: workoutName.trim(),
      exercises: validExercises,
      duration: workoutDuration || undefined,
      notes: workoutNotes.trim() || undefined,
    };

    if (editingWorkout) {
      await useWorkoutStore.getState().updateWorkout(editingWorkout.id, workoutData);
    } else {
      await createWorkout(workoutData);
    }

    closeModal();
  };

  const handleDeleteWorkout = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this workout?')) {
      await deleteWorkout(id);
    }
  };

  // Exercise management
  const addExercise = () => {
    setExercises([...exercises, createEmptyExercise()]);
  };

  const removeExercise = (exerciseId: string) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter((e) => e.id !== exerciseId));
    }
  };

  const updateExercise = (exerciseId: string, updates: Partial<Exercise>) => {
    setExercises(
      exercises.map((e) => (e.id === exerciseId ? { ...e, ...updates } : e))
    );
  };

  // Set management
  const addSet = (exerciseId: string) => {
    setExercises(
      exercises.map((e) =>
        e.id === exerciseId
          ? { ...e, sets: [...(e.sets || []), createEmptySet()] }
          : e
      )
    );
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setExercises(
      exercises.map((e) =>
        e.id === exerciseId
          ? { ...e, sets: (e.sets || []).filter((s) => s.id !== setId) }
          : e
      )
    );
  };

  const updateSet = (exerciseId: string, setId: string, updates: Partial<ExerciseSet>) => {
    setExercises(
      exercises.map((e) =>
        e.id === exerciseId
          ? {
              ...e,
              sets: (e.sets || []).map((s) =>
                s.id === setId ? { ...s, ...updates } : s
              ),
            }
          : e
      )
    );
  };

  const formatWorkoutDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  };

  const getWorkoutTypeConfig = (type: WorkoutType) => {
    return WORKOUT_TYPES.find((t) => t.type === type) || WORKOUT_TYPES[4];
  };

  // Group workouts by date
  const groupedWorkouts = filteredWorkouts.reduce((acc, workout) => {
    const date = workout.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(workout);
    return acc;
  }, {} as Record<string, Workout[]>);

  const sortedDates = Object.keys(groupedWorkouts).sort((a, b) => b.localeCompare(a));

  return (
    <div className="h-full p-6 pb-8 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
            Workout Schedule
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {stats.thisWeek} workouts this week
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Log Workout
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">This Week</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.thisWeek}</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">This Month</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.thisMonth}</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Strength</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.byType.strength}</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Cardio</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.byType.cardio}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filterType === 'all'
              ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-600'
          }`}
        >
          All
        </button>
        {WORKOUT_TYPES.map((type) => (
          <button
            key={type.type}
            onClick={() => setFilterType(type.type)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              filterType === type.type
                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-600'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Workout History */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        ) : filteredWorkouts.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No workouts yet
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Start tracking your strength training, gym sessions, and other workouts.
              </p>
              <button
                onClick={() => openModal()}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                Log Your First Workout
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  {formatWorkoutDate(date)}
                </h3>
                <div className="space-y-3">
                  {groupedWorkouts[date].map((workout) => {
                    const typeConfig = getWorkoutTypeConfig(workout.type);
                    const totalSets = workout.exercises.reduce(
                      (sum, e) => sum + (e.sets?.length || 0),
                      0
                    );
                    return (
                      <div
                        key={workout.id}
                        className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          {/* Type Icon */}
                          <div className={`w-10 h-10 rounded-lg ${typeConfig.color} bg-opacity-10 dark:bg-opacity-20 flex items-center justify-center text-${typeConfig.color.replace('bg-', '')}`}>
                            <div className={`${typeConfig.color.replace('bg-', 'text-').replace('500', '600')} dark:${typeConfig.color.replace('bg-', 'text-').replace('500', '400')}`}>
                              {typeConfig.icon}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                {workout.name}
                              </h4>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 capitalize">
                                {workout.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                              {workout.exercises.length > 0 && (
                                <span>{workout.exercises.length} exercises</span>
                              )}
                              {totalSets > 0 && <span>{totalSets} sets</span>}
                              {workout.duration && <span>{workout.duration} min</span>}
                            </div>
                            {workout.exercises.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {workout.exercises.slice(0, 4).map((exercise) => (
                                  <span
                                    key={exercise.id}
                                    className="text-xs px-2 py-1 rounded bg-gray-50 dark:bg-neutral-700/50 text-gray-600 dark:text-gray-400"
                                  >
                                    {exercise.name}
                                    {exercise.sets && exercise.sets.length > 0 && (
                                      <span className="text-gray-400 dark:text-gray-500 ml-1">
                                        ({exercise.sets.length})
                                      </span>
                                    )}
                                  </span>
                                ))}
                                {workout.exercises.length > 4 && (
                                  <span className="text-xs px-2 py-1 text-gray-400 dark:text-gray-500">
                                    +{workout.exercises.length - 4} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openModal(workout)}
                              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                              title="Edit workout"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteWorkout(workout.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete workout"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Workout Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-neutral-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {editingWorkout ? 'Edit Workout' : 'Log Workout'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Workout Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Workout Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {WORKOUT_TYPES.map((type) => (
                    <button
                      key={type.type}
                      onClick={() => setWorkoutType(type.type)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        workoutType === type.type
                          ? `border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900`
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-600'
                      }`}
                    >
                      {type.icon}
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Workout Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Workout Name
                </label>
                <input
                  type="text"
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  placeholder="e.g., Upper Body, Morning Run, Yoga Session"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                />
              </div>

              {/* Date and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={workoutDate}
                    onChange={(e) => setWorkoutDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={workoutDuration}
                    onChange={(e) => setWorkoutDuration(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="45"
                    min="0"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                  />
                </div>
              </div>

              {/* Exercises */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Exercises
                  </label>
                  <button
                    onClick={addExercise}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Exercise
                  </button>
                </div>

                {/* Quick add suggestions */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {COMMON_EXERCISES[workoutType].slice(0, 6).map((name) => (
                    <button
                      key={name}
                      onClick={() => {
                        const emptyExercise = exercises.find((e) => !e.name.trim());
                        if (emptyExercise) {
                          updateExercise(emptyExercise.id, { name });
                        } else {
                          setExercises([...exercises, { ...createEmptyExercise(), name }]);
                        }
                      }}
                      className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors"
                    >
                      + {name}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {exercises.map((exercise, index) => (
                    <div
                      key={exercise.id}
                      className="p-4 rounded-lg bg-gray-50 dark:bg-neutral-700/50 border border-gray-200 dark:border-neutral-600"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm font-medium text-gray-400 dark:text-gray-500 w-6">
                          {index + 1}.
                        </span>
                        <input
                          type="text"
                          value={exercise.name}
                          onChange={(e) => updateExercise(exercise.id, { name: e.target.value })}
                          placeholder="Exercise name"
                          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                        />
                        {exercises.length > 1 && (
                          <button
                            onClick={() => removeExercise(exercise.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Sets for strength exercises */}
                      {(workoutType === 'strength' || workoutType === 'other') && (
                        <div className="ml-9 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 uppercase">
                            <span className="w-12">Set</span>
                            <span className="w-20">Reps</span>
                            <span className="w-24">Weight</span>
                            <span className="flex-1"></span>
                          </div>
                          {(exercise.sets || []).map((set, setIndex) => (
                            <div key={set.id} className="flex items-center gap-2">
                              <span className="w-12 text-sm text-gray-400 dark:text-gray-500">
                                {setIndex + 1}
                              </span>
                              <input
                                type="number"
                                value={set.reps || ''}
                                onChange={(e) =>
                                  updateSet(exercise.id, set.id, {
                                    reps: e.target.value ? parseInt(e.target.value) : undefined,
                                  })
                                }
                                placeholder="12"
                                className="w-20 px-2 py-1 rounded border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                              />
                              <div className="flex items-center w-24">
                                <input
                                  type="number"
                                  value={set.weight || ''}
                                  onChange={(e) =>
                                    updateSet(exercise.id, set.id, {
                                      weight: e.target.value ? parseFloat(e.target.value) : undefined,
                                    })
                                  }
                                  placeholder="135"
                                  className="w-16 px-2 py-1 rounded-l border border-r-0 border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                                />
                                <span className="px-2 py-1 bg-gray-100 dark:bg-neutral-600 border border-gray-200 dark:border-neutral-600 rounded-r text-xs text-gray-500 dark:text-gray-400">
                                  lbs
                                </span>
                              </div>
                              <button
                                onClick={() => removeSet(exercise.id, set.id)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => addSet(exercise.id)}
                            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 mt-1"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Set
                          </button>
                        </div>
                      )}

                      {/* Duration/Distance for cardio */}
                      {workoutType === 'cardio' && (
                        <div className="ml-9 flex gap-4">
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Duration (min)
                            </label>
                            <input
                              type="number"
                              value={exercise.duration || ''}
                              onChange={(e) =>
                                updateExercise(exercise.id, {
                                  duration: e.target.value ? parseInt(e.target.value) : undefined,
                                })
                              }
                              placeholder="30"
                              className="w-20 px-2 py-1 rounded border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Distance (mi)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={exercise.distance || ''}
                              onChange={(e) =>
                                updateExercise(exercise.id, {
                                  distance: e.target.value ? parseFloat(e.target.value) : undefined,
                                })
                              }
                              placeholder="3.0"
                              className="w-20 px-2 py-1 rounded border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={workoutNotes}
                  onChange={(e) => setWorkoutNotes(e.target.value)}
                  placeholder="How did it feel? Any PRs?"
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-neutral-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWorkout}
                disabled={!workoutName.trim()}
                className="px-6 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingWorkout ? 'Save Changes' : 'Log Workout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
