/**
 * VolumePage
 *
 * Log workout volume - the actual weight moved during today's workout.
 * Connects to the workout routine to show today's scheduled exercises
 * and allows logging sets/reps/weight for each.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUserStore } from '../stores/userStore';
import { useWorkoutStore, createEmptySet, generateSetId } from '../stores/workoutStore';
import { useWorkoutScheduleStore, DAYS_OF_WEEK } from '../stores/workoutScheduleStore';
import { useNavigationStore } from '../stores/navigationStore';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns';
import { LuWeight, LuTrendingUp, LuCalendar, LuDumbbell, LuPlus, LuCheck, LuX, LuChevronRight } from 'react-icons/lu';
import { HiOutlineChartBar } from 'react-icons/hi2';
import type { Exercise, ExerciseSet, Workout } from '../../shared/types';

interface LoggingExercise extends Exercise {
  sets: ExerciseSet[];
}

export const VolumePage: React.FC = () => {
  const { currentUser } = useUserStore();
  const { workouts, isLoading: workoutsLoading, fetchWorkouts, createWorkout, updateWorkout, getWorkoutsByDate } = useWorkoutStore();
  const { templates, schedule, isLoading: scheduleLoading, fetchAll, getTemplateForDay } = useWorkoutScheduleStore();

  // Local state for logging
  const [loggingExercises, setLoggingExercises] = useState<LoggingExercise[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Get today's info
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const dayOfWeek = today.getDay();
  const dayName = DAYS_OF_WEEK[dayOfWeek].full;

  // Fetch data on mount
  useEffect(() => {
    if (currentUser) {
      fetchAll(currentUser.id);
      // Fetch a wider date range for volume stats
      const startDate = format(subDays(today, 30), 'yyyy-MM-dd');
      const endDate = todayStr;
      fetchWorkouts(currentUser.id, startDate, endDate);
    }
  }, [currentUser?.id]);

  // Get today's template and existing workout
  const todayTemplate = useMemo(() => getTemplateForDay(dayOfWeek), [schedule, templates, dayOfWeek]);
  const todayWorkouts = useMemo(() => getWorkoutsByDate(todayStr), [workouts, todayStr]);

  // Find if there's already a workout logged for today that matches the template
  const existingWorkout = useMemo(() => {
    if (!todayTemplate) return null;
    return todayWorkouts.find(w => w.name === todayTemplate.name) || todayWorkouts[0] || null;
  }, [todayWorkouts, todayTemplate]);

  // Initialize logging exercises from template or existing workout
  useEffect(() => {
    if (existingWorkout && existingWorkout.exercises.length > 0) {
      // Use existing workout data
      const exercises: LoggingExercise[] = existingWorkout.exercises.map(ex => ({
        ...ex,
        sets: ex.sets && ex.sets.length > 0 ? ex.sets : [createEmptySet()],
      }));
      setLoggingExercises(exercises);
      setHasUnsavedChanges(false);
    } else if (todayTemplate && todayTemplate.exercises.length > 0) {
      // Initialize from template
      const exercises: LoggingExercise[] = todayTemplate.exercises.map(ex => {
        const numSets = ex.targetSets || 3;
        const sets: ExerciseSet[] = Array.from({ length: numSets }, () => ({
          id: generateSetId(),
          reps: ex.targetReps || undefined,
          weight: undefined,
          unit: 'lbs',
          completed: false,
        }));
        return {
          ...ex,
          sets,
        };
      });
      setLoggingExercises(exercises);
      setHasUnsavedChanges(false);
    } else {
      setLoggingExercises([]);
    }
  }, [todayTemplate?.id, existingWorkout?.id]);

  // Update a set
  const updateSet = useCallback((exerciseId: string, setId: string, updates: Partial<ExerciseSet>) => {
    setLoggingExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex;
      return {
        ...ex,
        sets: ex.sets.map(s => s.id === setId ? { ...s, ...updates } : s),
      };
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Toggle set completed
  const toggleSetCompleted = useCallback((exerciseId: string, setId: string) => {
    setLoggingExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex;
      return {
        ...ex,
        sets: ex.sets.map(s => s.id === setId ? { ...s, completed: !s.completed } : s),
      };
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Add a set to an exercise
  const addSet = useCallback((exerciseId: string) => {
    setLoggingExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex;
      const lastSet = ex.sets[ex.sets.length - 1];
      return {
        ...ex,
        sets: [...ex.sets, {
          id: generateSetId(),
          reps: lastSet?.reps,
          weight: lastSet?.weight,
          unit: 'lbs',
          completed: false,
        }],
      };
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Remove a set from an exercise
  const removeSet = useCallback((exerciseId: string, setId: string) => {
    setLoggingExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex;
      if (ex.sets.length <= 1) return ex; // Keep at least one set
      return {
        ...ex,
        sets: ex.sets.filter(s => s.id !== setId),
      };
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Save workout
  const handleSave = async () => {
    if (!currentUser || !todayTemplate || loggingExercises.length === 0) return;

    setIsSaving(true);
    try {
      const workoutData = {
        userId: currentUser.id,
        date: todayStr,
        type: todayTemplate.type,
        name: todayTemplate.name,
        exercises: loggingExercises,
        notes: todayTemplate.notes,
      };

      if (existingWorkout) {
        await updateWorkout(existingWorkout.id, workoutData);
      } else {
        await createWorkout(workoutData);
      }
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save workout:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate volume stats
  const volumeStats = useMemo(() => {
    if (!workouts || workouts.length === 0) {
      return {
        totalVolume: 0,
        weeklyVolume: 0,
        todayVolume: 0,
        workoutsWithVolume: 0,
        volumeByDay: [] as { date: string; volume: number }[],
      };
    }

    // Calculate volume for a workout
    const calcWorkoutVolume = (w: Workout) => {
      let vol = 0;
      if (w.exercises) {
        w.exercises.forEach(exercise => {
          if (exercise.sets) {
            exercise.sets.forEach(set => {
              if (set.weight && set.reps && set.completed) {
                vol += set.weight * set.reps;
              }
            });
          }
        });
      }
      return vol;
    };

    const workoutsWithVolumeData = workouts.map(w => ({ ...w, volume: calcWorkoutVolume(w) }));
    const totalVolume = workoutsWithVolumeData.reduce((sum, w) => sum + w.volume, 0);
    const workoutsWithVolume = workoutsWithVolumeData.filter(w => w.volume > 0).length;

    // Weekly volume
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
    const weeklyVolume = workoutsWithVolumeData
      .filter(w => {
        const d = parseISO(w.date);
        return d >= weekStart && d <= weekEnd;
      })
      .reduce((sum, w) => sum + w.volume, 0);

    // Today's volume (from current logging state)
    let todayVolume = 0;
    loggingExercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.weight && set.reps && set.completed) {
          todayVolume += set.weight * set.reps;
        }
      });
    });

    // Last 7 days
    const last7Days = eachDayOfInterval({
      start: subDays(today, 6),
      end: today,
    });
    const volumeByDay = last7Days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayVolume = workoutsWithVolumeData
        .filter(w => w.date === dateStr)
        .reduce((sum, w) => sum + w.volume, 0);
      return { date: dateStr, volume: dayVolume };
    });

    return { totalVolume, weeklyVolume, todayVolume, workoutsWithVolume, volumeByDay };
  }, [workouts, loggingExercises]);

  const formatNumber = (num: number) => Math.round(num).toLocaleString();
  const maxVolume = Math.max(...volumeStats.volumeByDay.map(d => d.volume), 1);
  const isLoading = workoutsLoading || scheduleLoading;

  return (
    <div className="h-full p-6 pb-8 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
            Volume
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {dayName}, {format(today, 'MMMM d')}
          </p>
        </div>
        {hasUnsavedChanges && loggingExercises.length > 0 && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary"
          >
            {isSaving ? 'Saving...' : 'Save Workout'}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Today's Workout Section */}
          {todayTemplate ? (
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
              {/* Workout Header */}
              <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-700 flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: todayTemplate.color }}
                />
                <div className="flex-1">
                  <h2 className="font-medium text-gray-900 dark:text-gray-100">
                    {todayTemplate.name}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {loggingExercises.length} exercises • {loggingExercises.reduce((sum, ex) => sum + ex.sets.length, 0)} sets
                  </p>
                </div>
                {existingWorkout && !hasUnsavedChanges && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <LuCheck className="w-4 h-4" />
                    Saved
                  </span>
                )}
              </div>

              {/* Exercises */}
              <div className="divide-y divide-gray-100 dark:divide-neutral-700">
                {loggingExercises.map((exercise, exIndex) => (
                  <div key={exercise.id} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {exIndex + 1}. {exercise.name}
                      </h3>
                      {exercise.targetSets && exercise.targetReps && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          Target: {exercise.targetSets}×{exercise.targetReps}
                        </span>
                      )}
                    </div>

                    {/* Sets table */}
                    <div className="space-y-2">
                      {/* Header row */}
                      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-1">
                        <div className="col-span-2">Set</div>
                        <div className="col-span-3">Weight</div>
                        <div className="col-span-3">Reps</div>
                        <div className="col-span-4 text-right">Done</div>
                      </div>

                      {/* Set rows */}
                      {exercise.sets.map((set, setIndex) => (
                        <div
                          key={set.id}
                          className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg transition-colors ${
                            set.completed
                              ? 'bg-emerald-50 dark:bg-emerald-900/20'
                              : 'bg-gray-50 dark:bg-neutral-700/50'
                          }`}
                        >
                          <div className="col-span-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                            {setIndex + 1}
                          </div>
                          <div className="col-span-3">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={set.weight || ''}
                                onChange={(e) => updateSet(exercise.id, set.id, {
                                  weight: e.target.value ? parseFloat(e.target.value) : undefined,
                                })}
                                placeholder="0"
                                className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                              />
                              <span className="text-xs text-gray-400">lbs</span>
                            </div>
                          </div>
                          <div className="col-span-3">
                            <input
                              type="number"
                              value={set.reps || ''}
                              onChange={(e) => updateSet(exercise.id, set.id, {
                                reps: e.target.value ? parseInt(e.target.value) : undefined,
                              })}
                              placeholder="0"
                              className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                            />
                          </div>
                          <div className="col-span-4 flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleSetCompleted(exercise.id, set.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                set.completed
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-gray-200 dark:bg-neutral-600 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-neutral-500'
                              }`}
                            >
                              <LuCheck className="w-4 h-4" />
                            </button>
                            {exercise.sets.length > 1 && (
                              <button
                                onClick={() => removeSet(exercise.id, set.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                <LuX className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Add set button */}
                      <button
                        onClick={() => addSet(exercise.id)}
                        className="w-full py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <LuPlus className="w-4 h-4" />
                        Add Set
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* No workout scheduled */
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-neutral-700 flex items-center justify-center">
                <LuCalendar className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No workout scheduled for {dayName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Set up your weekly routine in the Workout Routine page to see today's workout here.
              </p>
              <button
                onClick={() => useNavigationStore.getState().navigate('workouts')}
                className="inline-flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400 font-medium hover:underline"
              >
                Go to Workout Routine
                <LuChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Today's Volume */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 border border-gray-200 dark:border-neutral-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <LuWeight className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Today</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatNumber(volumeStats.todayVolume)} <span className="text-sm font-normal text-gray-500">lbs</span>
              </p>
            </div>

            {/* Weekly Volume */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 border border-gray-200 dark:border-neutral-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <LuTrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">This Week</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatNumber(volumeStats.weeklyVolume)} <span className="text-sm font-normal text-gray-500">lbs</span>
              </p>
            </div>

            {/* Workouts Tracked */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 border border-gray-200 dark:border-neutral-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <LuDumbbell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Workouts</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {volumeStats.workoutsWithVolume}
              </p>
            </div>
          </div>

          {/* Weekly Chart */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-gray-200 dark:border-neutral-700">
            <div className="flex items-center gap-2 mb-6">
              <HiOutlineChartBar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Last 7 Days</h2>
            </div>

            <div className="flex items-end justify-between gap-2 h-32">
              {volumeStats.volumeByDay.map((day, index) => {
                const height = day.volume > 0 ? (day.volume / maxVolume) * 100 : 0;
                const isToday = index === volumeStats.volumeByDay.length - 1;

                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          day.volume > 0
                            ? isToday
                              ? 'bg-orange-500'
                              : 'bg-orange-300 dark:bg-orange-600'
                            : 'bg-gray-100 dark:bg-neutral-700 min-h-[4px]'
                        }`}
                        style={{ height: day.volume > 0 ? `${Math.max(height, 8)}%` : '4px' }}
                        title={`${formatNumber(day.volume)} lbs`}
                      />
                    </div>
                    <span className={`text-xs ${isToday ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                      {format(parseISO(day.date), 'EEE')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
