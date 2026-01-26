/**
 * WorkoutsPage
 *
 * Weekly workout routine setup.
 * Users define the workouts they do regularly and assign them to days of the week.
 * Supports multiple workouts per day and duration-based exercises (planks, holds, etc.).
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useUserStore } from '../stores/userStore';
import {
  useWorkoutScheduleStore,
  DAYS_OF_WEEK,
  TEMPLATE_COLORS,
  createEmptyExercise,
} from '../stores/workoutScheduleStore';
import type { WorkoutTemplate, WorkoutType, Exercise, ExerciseTargetUnit } from '../../shared/types';
import { HiOutlinePlus, HiOutlineXMark, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineBolt, HiOutlineSquares2X2, HiOutlineHeart, HiOutlineUser, HiOutlineTrophy, HiOutlineEllipsisHorizontal, HiOutlineCalendarDays, HiOutlineQueueList } from 'react-icons/hi2';
import { CardMenu } from '../components/CardMenu';

// Workout type configurations
const WORKOUT_TYPES: { type: WorkoutType; label: string; icon: JSX.Element }[] = [
  {
    type: 'strength',
    label: 'Strength',
    icon: <HiOutlineSquares2X2 className="w-5 h-5" />,
  },
  {
    type: 'cardio',
    label: 'Cardio',
    icon: <HiOutlineHeart className="w-5 h-5" />,
  },
  {
    type: 'flexibility',
    label: 'Flexibility',
    icon: <HiOutlineUser className="w-5 h-5" />,
  },
  {
    type: 'sports',
    label: 'Sports',
    icon: <HiOutlineTrophy className="w-5 h-5" />,
  },
  {
    type: 'other',
    label: 'Other',
    icon: <HiOutlineEllipsisHorizontal className="w-5 h-5" />,
  },
];

// Common exercises for quick selection
const COMMON_EXERCISES: Record<WorkoutType, string[]> = {
  strength: [
    'Bench Press', 'Squat', 'Deadlift', 'Shoulder Press', 'Barbell Row',
    'Pull-ups', 'Dumbbell Curl', 'Tricep Extension', 'Leg Press', 'Lunges',
    'Lat Pulldown', 'Leg Curl', 'Leg Extension', 'Calf Raises', 'Dips',
  ],
  cardio: ['Running', 'Cycling', 'Swimming', 'Jump Rope', 'Rowing', 'Elliptical', 'Walking', 'HIIT'],
  flexibility: ['Yoga', 'Stretching', 'Pilates', 'Foam Rolling', 'Mobility Work'],
  sports: ['Basketball', 'Soccer', 'Tennis', 'Golf', 'Volleyball', 'Climbing', 'Martial Arts'],
  other: ['Hiking', 'Dancing', 'Gardening', 'Housework'],
};

// Single-char day initials for compact display
const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const WorkoutsPage: React.FC = () => {
  const { currentUser } = useUserStore();
  const {
    templates,
    schedule,
    isLoading,
    fetchAll,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    addScheduleEntry,
    removeScheduleEntry,
    getWeeklySchedule,
  } = useWorkoutScheduleStore();

  // Modal state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [assigningDay, setAssigningDay] = useState<number | null>(null);

  // Form state for template
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState<WorkoutType>('strength');
  const [templateColor, setTemplateColor] = useState<string>(TEMPLATE_COLORS[0]);
  const [templateNotes, setTemplateNotes] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([createEmptyExercise()]);

  // Fetch data on mount
  useEffect(() => {
    if (currentUser) {
      fetchAll(currentUser.id);
    }
  }, [currentUser, fetchAll]);

  const weeklySchedule = getWeeklySchedule();
  const today = useMemo(() => new Date().getDay(), []);

  const resetForm = () => {
    setTemplateName('');
    setTemplateType('strength');
    setTemplateColor(TEMPLATE_COLORS[0]);
    setTemplateNotes('');
    setExercises([createEmptyExercise()]);
    setEditingTemplate(null);
  };

  const openTemplateModal = (template?: WorkoutTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateName(template.name);
      setTemplateType(template.type);
      setTemplateColor(template.color);
      setTemplateNotes(template.notes || '');
      // Migrate old sets array format to new targetSets/targetReps format
      const migratedExercises = template.exercises.map((exercise) => {
        if (exercise.targetSets === undefined && exercise.sets && exercise.sets.length > 0) {
          return {
            ...exercise,
            targetSets: exercise.sets.length,
            targetReps: exercise.sets[0]?.reps || 12,
          };
        }
        return exercise;
      });
      setExercises(migratedExercises.length > 0 ? migratedExercises : [createEmptyExercise()]);
    } else {
      resetForm();
    }
    setShowTemplateModal(true);
  };

  const closeTemplateModal = () => {
    setShowTemplateModal(false);
    resetForm();
  };

  const handleSaveTemplate = async () => {
    if (!currentUser || !templateName.trim()) return;

    // Filter out empty exercises
    const validExercises = exercises.filter((e) => e.name.trim());

    const templateData = {
      userId: currentUser.id,
      name: templateName.trim(),
      type: templateType,
      exercises: validExercises,
      color: templateColor,
      notes: templateNotes.trim() || undefined,
    };

    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, templateData);
    } else {
      await createTemplate(templateData);
    }

    closeTemplateModal();
  };

  const handleDeleteTemplate = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this workout? It will also be removed from your schedule.')) {
      await deleteTemplate(id);
    }
  };

  const handleAssignTemplate = async (templateId: string) => {
    if (currentUser && assigningDay !== null) {
      await addScheduleEntry(currentUser.id, assigningDay, templateId);
      setAssigningDay(null);
    }
  };

  const handleRemoveEntry = async (entryId: string) => {
    await removeScheduleEntry(entryId);
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

  const getWorkoutTypeConfig = (type: WorkoutType) => {
    return WORKOUT_TYPES.find((t) => t.type === type) || WORKOUT_TYPES[4];
  };

  return (
    <div className="h-full p-6 pb-8 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
            My Workout Routine
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {templates.length} workout{templates.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => openTemplateModal()}
          className="btn-primary"
        >
          <HiOutlinePlus className="w-4 h-4" />
          New Workout
        </button>
      </div>

      {/* Weekly Schedule Strip */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <HiOutlineCalendarDays className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Weekly Schedule</h2>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-1.5 shadow-soft">
          <div className="flex flex-wrap gap-1.5 [&>*]:min-w-[130px] [&>*]:flex-1">
            {weeklySchedule.map(({ day, entries }) => {
              const isToday = day.value === today;
              const hasWorkouts = entries.length > 0;
              const totalExercises = entries.reduce(
                (sum, e) => sum + e.template.exercises.length,
                0
              );

              return (
                <div
                  key={day.value}
                  className="group relative"
                >
                  {/* Day Card — has workouts */}
                  {hasWorkouts ? (
                    <div
                      className={`relative rounded-xl p-3.5 min-h-[140px] flex flex-col transition-all duration-150 cursor-default ${
                        isToday
                          ? 'bg-gradient-to-b from-brand-50 to-brand-50/40 dark:from-brand-500/10 dark:to-brand-500/5 border border-brand-200/50 dark:border-brand-500/20'
                          : 'bg-gray-50/80 dark:bg-neutral-800/50'
                      }`}
                    >
                      {/* Stacked color accent bars — one per workout */}
                      <div className="absolute top-0 left-3.5 right-3.5 flex gap-0.5">
                        {entries.map(({ entryId, template }) => (
                          <div
                            key={entryId}
                            className="flex-1 h-[3px] rounded-b-full"
                            style={{ backgroundColor: template.color }}
                          />
                        ))}
                      </div>

                      {/* Day label */}
                      <div className={`text-xs font-semibold uppercase tracking-wide mb-2.5 mt-0.5 ${
                        isToday
                          ? 'text-brand-600 dark:text-brand-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {day.short}
                      </div>

                      {/* Workout list — one row per workout */}
                      <div className="flex-1 flex flex-col min-w-0 gap-1.5">
                        {entries.map(({ entryId, template }) => (
                          <div
                            key={entryId}
                            className="flex items-center gap-2 group/entry"
                          >
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: template.color }}
                            />
                            <p className="text-[13px] font-medium text-gray-900 dark:text-gray-100 truncate leading-tight flex-1">
                              {template.name}
                            </p>
                            {/* Per-entry remove — hover-reveal */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveEntry(entryId);
                              }}
                              className="p-0.5 rounded text-gray-300 dark:text-gray-600 opacity-0 group-hover/entry:opacity-100 hover:text-red-500 dark:hover:text-red-400 transition-all duration-150 flex-shrink-0"
                              title="Remove workout"
                            >
                              <HiOutlineXMark className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Footer: exercise count + always-visible add button */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200/60 dark:border-neutral-700/40">
                        <span className="text-[11px] text-gray-400 dark:text-gray-500">
                          {totalExercises} exercise{totalExercises !== 1 ? 's' : ''}
                        </span>
                        <button
                          onClick={() => setAssigningDay(day.value)}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-gray-400 dark:text-gray-500 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-all duration-150"
                          title="Add another workout"
                        >
                          <HiOutlinePlus className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-medium">Add</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Empty day — rest day */
                    <button
                      onClick={() => setAssigningDay(day.value)}
                      className={`w-full rounded-xl p-3.5 min-h-[140px] flex flex-col items-center transition-all duration-150 ${
                        isToday
                          ? 'bg-gradient-to-b from-brand-50 to-brand-50/40 dark:from-brand-500/10 dark:to-brand-500/5 border border-brand-200/50 dark:border-brand-500/20 hover:from-brand-100/80 hover:to-brand-50/60 dark:hover:from-brand-500/15 dark:hover:to-brand-500/8'
                          : 'bg-gray-50/80 dark:bg-neutral-800/50 hover:bg-gray-100 dark:hover:bg-neutral-700/50'
                      }`}
                      title="Add workout"
                    >
                      {/* Day label */}
                      <div className={`text-xs font-semibold uppercase tracking-wide mb-auto self-start ${
                        isToday
                          ? 'text-brand-600 dark:text-brand-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {day.short}
                      </div>

                      {/* Add workout prompt */}
                      <div className="flex flex-col items-center gap-2 mb-2">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                          isToday
                            ? 'bg-brand-100/60 dark:bg-brand-500/10'
                            : 'bg-gray-200/60 dark:bg-neutral-700/50 group-hover:bg-gray-200 dark:group-hover:bg-neutral-600/50'
                        }`}>
                          <HiOutlinePlus className={`w-4 h-4 ${
                            isToday
                              ? 'text-brand-500 dark:text-brand-400'
                              : 'text-gray-400 dark:text-gray-500'
                          }`} />
                        </div>
                        <span className={`text-[11px] font-medium ${
                          isToday
                            ? 'text-brand-500 dark:text-brand-400'
                            : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                        }`}>
                          Add Workout
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Workout Templates */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <HiOutlineBolt className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">My Workouts</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                <HiOutlineBolt className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No workouts yet
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                Define the workouts you do regularly, like "Leg Day" or "Push Day", then assign them to the days you train.
              </p>
              <button
                onClick={() => openTemplateModal()}
                className="btn-primary"
              >
                <HiOutlinePlus className="w-4 h-4" />
                Add Your First Workout
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto -mx-1 px-1">
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              {templates.map((template) => {
                const typeConfig = getWorkoutTypeConfig(template.type);
                const isScheduled = schedule.some((s) => s.templateId === template.id);
                const scheduledDayValues = schedule
                  .filter((s) => s.templateId === template.id)
                  .map((s) => s.dayOfWeek);
                const scheduledCount = scheduledDayValues.length;

                return (
                  <div
                    key={template.id}
                    className="group bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 transition-all duration-150 hover:shadow-soft overflow-hidden"
                  >
                    {/* Color accent bar */}
                    <div
                      className="h-[3px] w-full"
                      style={{ backgroundColor: template.color }}
                    />

                    <div className="p-4">
                      {/* Header: icon + name + menu */}
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: template.color + '15' }}
                        >
                          <div style={{ color: template.color }}>{typeConfig.icon}</div>
                        </div>

                        {/* Name + type badge */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-[15px]">
                            {template.name}
                          </h3>
                          <span
                            className="inline-block text-[11px] font-medium px-1.5 py-0.5 rounded-md capitalize mt-0.5"
                            style={{
                              backgroundColor: template.color + '15',
                              color: template.color,
                            }}
                          >
                            {template.type}
                          </span>
                        </div>

                        {/* Three-dot menu — revealed on hover */}
                        <CardMenu
                          items={[
                            {
                              label: 'Edit',
                              icon: <HiOutlinePencilSquare className="w-4 h-4" />,
                              onClick: () => openTemplateModal(template),
                            },
                            {
                              label: 'Delete',
                              icon: <HiOutlineTrash className="w-4 h-4" />,
                              onClick: () => handleDeleteTemplate(template.id),
                              variant: 'danger',
                            },
                          ]}
                        />
                      </div>

                      {/* Stats row with icons */}
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-neutral-700/50 flex items-center gap-3">
                        {/* Exercise count */}
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                          <HiOutlineQueueList className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-xs font-medium">
                            {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Schedule frequency */}
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                          <HiOutlineCalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-xs font-medium">
                            {scheduledCount > 0
                              ? `${scheduledCount}x / week`
                              : 'Unscheduled'}
                          </span>
                        </div>
                      </div>

                      {/* Exercise list — compact inline */}
                      {template.exercises.length > 0 && (
                        <div className="mt-2.5">
                          <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed line-clamp-2">
                            {template.exercises.map((e) => e.name).filter(Boolean).join(' · ') || 'No exercises named'}
                          </p>
                        </div>
                      )}

                      {/* Scheduled days — mini day circles */}
                      {isScheduled && (
                        <div className="mt-3 flex items-center gap-1">
                          {DAYS_OF_WEEK.map((d) => {
                            const isActive = scheduledDayValues.includes(d.value);
                            return (
                              <div
                                key={d.value}
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold transition-colors ${
                                  isActive
                                    ? 'text-white'
                                    : 'text-gray-300 dark:text-neutral-600 bg-gray-50 dark:bg-neutral-800'
                                }`}
                                style={isActive ? { backgroundColor: template.color } : undefined}
                                title={d.full}
                              >
                                {DAY_INITIALS[d.value]}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Assign to Day Modal */}
      {assigningDay !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setAssigningDay(null)}
          />
          <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-elevated w-full max-w-md overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-gray-100 dark:border-neutral-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Assign Workout to {DAYS_OF_WEEK[assigningDay].full}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Pick a workout for this day
              </p>
            </div>
            <div className="p-3 max-h-[60vh] overflow-y-auto">
              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No workouts created yet.
                  </p>
                  <button
                    onClick={() => {
                      setAssigningDay(null);
                      openTemplateModal();
                    }}
                    className="btn-primary"
                  >
                    <HiOutlinePlus className="w-4 h-4" />
                    Create a Workout
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {templates.map((template) => {
                    const typeConfig = getWorkoutTypeConfig(template.type);
                    return (
                      <button
                        key={template.id}
                        onClick={() => handleAssignTemplate(template.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-700/60 transition-colors text-left group"
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: template.color + '15' }}
                        >
                          <div style={{ color: template.color }} className="[&>svg]:w-4 [&>svg]:h-4">
                            {typeConfig.icon}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate text-[14px]">
                            {template.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''} &middot; <span className="capitalize">{template.type}</span>
                          </p>
                        </div>
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ backgroundColor: template.color }}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-3 border-t border-gray-100 dark:border-neutral-700">
              <button
                onClick={() => setAssigningDay(null)}
                className="w-full px-4 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-neutral-700/50 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeTemplateModal}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-elevated w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-neutral-700">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {editingTemplate ? 'Edit Workout' : 'New Workout'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {editingTemplate ? 'Update your workout template' : 'Define a reusable workout routine'}
                </p>
              </div>
              <button
                onClick={closeTemplateModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Workout Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Workout Name
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Leg Day, Push Day, Upper Body"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
                />
              </div>

              {/* Workout Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Workout Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {WORKOUT_TYPES.map((type) => (
                    <button
                      key={type.type}
                      onClick={() => setTemplateType(type.type)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                        templateType === type.type
                          ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-600'
                      }`}
                    >
                      {type.icon}
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex gap-2">
                  {TEMPLATE_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setTemplateColor(color)}
                      className={`w-8 h-8 rounded-full transition-all duration-150 ${
                        templateColor === color ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-gray-100 dark:ring-offset-neutral-800 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Exercises */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Exercises
                </label>

                <div className="space-y-3">
                  {exercises.map((exercise, index) => (
                    <div
                      key={exercise.id}
                      className="p-4 rounded-xl bg-gray-50 dark:bg-neutral-700/50 border border-gray-100 dark:border-neutral-600"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm font-semibold text-gray-300 dark:text-gray-600 w-6 text-center tabular-nums">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={exercise.name}
                          onChange={(e) => updateExercise(exercise.id, { name: e.target.value })}
                          placeholder="Exercise name"
                          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
                        />
                        {exercises.length > 1 && (
                          <button
                            onClick={() => removeExercise(exercise.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <HiOutlineXMark className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Sets and Reps/Duration for strength & other exercises */}
                      {(templateType === 'strength' || templateType === 'other') && (() => {
                        const unit: ExerciseTargetUnit = exercise.targetUnit || 'reps';
                        const unitPlaceholder = unit === 'reps' ? '12' : unit === 'seconds' ? '30' : '1';

                        return (
                          <div className="ml-9 flex items-center gap-4">
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                Sets
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={exercise.targetSets || ''}
                                onChange={(e) =>
                                  updateExercise(exercise.id, {
                                    targetSets: e.target.value ? parseInt(e.target.value) : undefined,
                                  })
                                }
                                placeholder="3"
                                className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
                              />
                            </div>
                            <span className="text-gray-300 dark:text-gray-600 mt-5 font-light">&times;</span>
                            <div>
                              {/* Unit toggle: Reps / Sec / Min */}
                              <div className="flex items-center mb-1">
                                {(['reps', 'seconds', 'minutes'] as ExerciseTargetUnit[]).map((u) => {
                                  const isActive = unit === u;
                                  const label = u === 'reps' ? 'Reps' : u === 'seconds' ? 'Sec' : 'Min';
                                  return (
                                    <button
                                      key={u}
                                      type="button"
                                      onClick={() =>
                                        updateExercise(exercise.id, {
                                          targetUnit: u === 'reps' ? undefined : u,
                                          // Clear til-failure when switching to time-based
                                          ...(u !== 'reps' ? { tilFailure: false } : {}),
                                        })
                                      }
                                      className={`px-1.5 py-0 text-[10px] font-semibold rounded transition-colors ${
                                        isActive
                                          ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10'
                                          : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                                      }`}
                                    >
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>
                              {exercise.tilFailure ? (
                                <div className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-neutral-600 bg-gray-100 dark:bg-neutral-600 text-gray-400 dark:text-gray-500 text-sm text-center">
                                  &mdash;
                                </div>
                              ) : (
                                <input
                                  type="number"
                                  min="1"
                                  value={exercise.targetReps || ''}
                                  onChange={(e) =>
                                    updateExercise(exercise.id, {
                                      targetReps: e.target.value ? parseInt(e.target.value) : undefined,
                                    })
                                  }
                                  placeholder={unitPlaceholder}
                                  className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
                                />
                              )}
                            </div>
                            {/* Til Failure — only shown for reps */}
                            {unit === 'reps' && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateExercise(exercise.id, {
                                    tilFailure: !exercise.tilFailure,
                                  })
                                }
                                className={`mt-5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                  exercise.tilFailure
                                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-700'
                                    : 'bg-gray-100 dark:bg-neutral-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-neutral-600 hover:bg-gray-200 dark:hover:bg-neutral-600'
                                }`}
                              >
                                Til Failure
                              </button>
                            )}
                          </div>
                        );
                      })()}

                      {/* Duration/Distance for cardio */}
                      {templateType === 'cardio' && (
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
                              className="w-20 px-2 py-1 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
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
                              className="w-20 px-2 py-1 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Exercise Button */}
                  <button
                    type="button"
                    onClick={addExercise}
                    className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-neutral-600
                      text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-neutral-500
                      hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-neutral-700/30
                      transition-all duration-150 flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <HiOutlinePlus className="w-4 h-4" />
                    Add Exercise
                  </button>

                  {/* Quick add suggestions */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="text-gray-400 dark:text-gray-500">Quick add:</span>
                    {COMMON_EXERCISES[templateType].slice(0, 6).map((name, idx) => (
                      <span key={name} className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setExercises([...exercises, { ...createEmptyExercise(), name }]);
                          }}
                          className="text-gray-500 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors underline-offset-2 hover:underline"
                        >
                          {name}
                        </button>
                        {idx < 5 && <span className="text-gray-300 dark:text-gray-600">&middot;</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={templateNotes}
                  onChange={(e) => setTemplateNotes(e.target.value)}
                  placeholder="Any additional notes about this workout..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 dark:border-neutral-700">
              <button
                onClick={closeTemplateModal}
                className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-neutral-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {editingTemplate ? 'Save Changes' : 'Create Workout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
