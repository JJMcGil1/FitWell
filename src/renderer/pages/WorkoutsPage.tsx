/**
 * WorkoutsPage
 *
 * Weekly workout schedule setup.
 * Users create workout templates and assign them to days of the week.
 */

import React, { useState, useEffect } from 'react';
import { useUserStore } from '../stores/userStore';
import {
  useWorkoutScheduleStore,
  DAYS_OF_WEEK,
  TEMPLATE_COLORS,
  createEmptyExercise,
  createEmptySet,
} from '../stores/workoutScheduleStore';
import type { WorkoutTemplate, WorkoutType, Exercise, ExerciseSet } from '../../shared/types';
import { HiOutlinePlus, HiOutlineXMark, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineBolt, HiOutlineMinus, HiOutlineSquares2X2, HiOutlineHeart, HiOutlineUser, HiOutlineTrophy, HiOutlineEllipsisHorizontal } from 'react-icons/hi2';

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
    setScheduleEntry,
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
  const scheduledDaysCount = schedule.length;

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
      setExercises(template.exercises.length > 0 ? template.exercises : [createEmptyExercise()]);
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
      await setScheduleEntry(currentUser.id, assigningDay, templateId);
      setAssigningDay(null);
    }
  };

  const handleClearDay = async (dayOfWeek: number) => {
    if (currentUser) {
      await setScheduleEntry(currentUser.id, dayOfWeek, null);
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

  const getWorkoutTypeConfig = (type: WorkoutType) => {
    return WORKOUT_TYPES.find((t) => t.type === type) || WORKOUT_TYPES[4];
  };

  return (
    <div className="h-full p-6 pb-8 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
            Workout Schedule
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {scheduledDaysCount} day{scheduledDaysCount !== 1 ? 's' : ''} scheduled this week
          </p>
        </div>
        <button
          onClick={() => openTemplateModal()}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <HiOutlinePlus className="w-4 h-4" />
          New Workout
        </button>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Weekly Schedule</h2>
        <div className="grid grid-cols-7 gap-2">
          {weeklySchedule.map(({ day, template }) => (
            <div
              key={day.value}
              className={`relative rounded-xl p-3 min-h-[120px] border transition-all ${
                template
                  ? 'border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800'
                  : 'border-dashed border-gray-300 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-800/50'
              }`}
            >
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                {day.short}
              </div>

              {template ? (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: template.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {template.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleClearDay(day.value)}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Remove from schedule"
                  >
                    <HiOutlineXMark className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAssigningDay(day.value)}
                  className="absolute inset-0 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Add workout"
                >
                  <HiOutlinePlus className="w-6 h-6" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Workout Templates */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Your Workouts</h2>

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
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Create your workout routines like "Leg Day" or "Push Day" and assign them to days of the week.
              </p>
              <button
                onClick={() => openTemplateModal()}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                Create Your First Workout
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              {templates.map((template) => {
                const typeConfig = getWorkoutTypeConfig(template.type);
                const isScheduled = schedule.some((s) => s.templateId === template.id);
                const scheduledDays = schedule
                  .filter((s) => s.templateId === template.id)
                  .map((s) => DAYS_OF_WEEK[s.dayOfWeek].short);

                return (
                  <div
                    key={template.id}
                    className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Color indicator */}
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: template.color + '20' }}
                      >
                        <div style={{ color: template.color }}>{typeConfig.icon}</div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {template.name}
                          </h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 capitalize">
                            {template.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
                        </p>
                        {isScheduled && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Scheduled: {scheduledDays.join(', ')}
                          </p>
                        )}
                        {template.exercises.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {template.exercises.slice(0, 3).map((exercise) => (
                              <span
                                key={exercise.id}
                                className="text-xs px-2 py-0.5 rounded bg-gray-50 dark:bg-neutral-700/50 text-gray-600 dark:text-gray-400"
                              >
                                {exercise.name}
                              </span>
                            ))}
                            {template.exercises.length > 3 && (
                              <span className="text-xs px-2 py-0.5 text-gray-400 dark:text-gray-500">
                                +{template.exercises.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openTemplateModal(template)}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                          title="Edit workout"
                        >
                          <HiOutlinePencilSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete workout"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
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
            className="absolute inset-0 bg-black/50"
            onClick={() => setAssigningDay(null)}
          />
          <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-neutral-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Assign Workout to {DAYS_OF_WEEK[assigningDay].full}
              </h2>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto">
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
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Create a workout first
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleAssignTemplate(template.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors text-left"
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: template.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {template.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {template.exercises.length} exercises
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-neutral-700">
              <button
                onClick={() => setAssigningDay(null)}
                className="w-full px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
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
            className="absolute inset-0 bg-black/50"
            onClick={closeTemplateModal}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-neutral-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {editingTemplate ? 'Edit Workout' : 'New Workout'}
              </h2>
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
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
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
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        templateType === type.type
                          ? 'border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900'
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
                      className={`w-8 h-8 rounded-full transition-transform ${
                        templateColor === color ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-gray-100 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
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
                    <HiOutlinePlus className="w-4 h-4" />
                    Add Exercise
                  </button>
                </div>

                {/* Quick add suggestions */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {COMMON_EXERCISES[templateType].slice(0, 8).map((name) => (
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
                            <HiOutlineXMark className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Sets for strength exercises */}
                      {(templateType === 'strength' || templateType === 'other') && (
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
                                <HiOutlineMinus className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => addSet(exercise.id)}
                            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 mt-1"
                          >
                            <HiOutlinePlus className="w-3 h-3" />
                            Add Set
                          </button>
                        </div>
                      )}

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
                  value={templateNotes}
                  onChange={(e) => setTemplateNotes(e.target.value)}
                  placeholder="Any additional notes about this workout..."
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-neutral-700">
              <button
                onClick={closeTemplateModal}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
                className="px-6 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
