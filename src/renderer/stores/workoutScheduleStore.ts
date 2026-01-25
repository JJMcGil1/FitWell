/**
 * Workout Schedule Store
 *
 * Manages workout templates and weekly schedule.
 * Templates are reusable workout routines.
 * Schedule maps days of the week to templates.
 */

import { create } from 'zustand';
import type { WorkoutTemplate, ScheduleEntry, Exercise, ExerciseSet } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

// Day of week labels
export const DAYS_OF_WEEK = [
  { value: 0, short: 'Sun', full: 'Sunday' },
  { value: 1, short: 'Mon', full: 'Monday' },
  { value: 2, short: 'Tue', full: 'Tuesday' },
  { value: 3, short: 'Wed', full: 'Wednesday' },
  { value: 4, short: 'Thu', full: 'Thursday' },
  { value: 5, short: 'Fri', full: 'Friday' },
  { value: 6, short: 'Sat', full: 'Saturday' },
] as const;

// Template color options
export const TEMPLATE_COLORS: string[] = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#84cc16', // lime
];

interface WorkoutScheduleState {
  // Data
  templates: WorkoutTemplate[];
  schedule: ScheduleEntry[];
  selectedTemplate: WorkoutTemplate | null;

  // View state
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTemplates: (userId: string) => Promise<void>;
  fetchSchedule: (userId: string) => Promise<void>;
  fetchAll: (userId: string) => Promise<void>;

  createTemplate: (template: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<WorkoutTemplate>;
  updateTemplate: (id: string, updates: Partial<Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;

  setScheduleEntry: (userId: string, dayOfWeek: number, templateId: string | null) => Promise<void>;
  clearSchedule: (userId: string) => Promise<void>;

  setSelectedTemplate: (template: WorkoutTemplate | null) => void;

  // Computed
  getTemplateForDay: (dayOfWeek: number) => WorkoutTemplate | null;
  getWeeklySchedule: () => { day: typeof DAYS_OF_WEEK[number]; template: WorkoutTemplate | null }[];

  // Reset
  reset: () => void;
}

const initialState = {
  templates: [],
  schedule: [],
  selectedTemplate: null,
  isLoading: false,
  error: null,
};

// Helper to generate unique IDs for exercises and sets
export const generateExerciseId = () => `exercise_${uuidv4()}`;
export const generateSetId = () => `set_${uuidv4()}`;

// Helper to create a new empty exercise
export const createEmptyExercise = (): Exercise => ({
  id: generateExerciseId(),
  name: '',
  sets: [createEmptySet()],
});

// Helper to create a new empty set
export const createEmptySet = (): ExerciseSet => ({
  id: generateSetId(),
  reps: undefined,
  weight: undefined,
  unit: 'lbs',
  completed: false,
});

export const useWorkoutScheduleStore = create<WorkoutScheduleState>((set, get) => ({
  ...initialState,

  fetchTemplates: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const templates = await window.api.getWorkoutTemplates(userId);
      set({ templates, isLoading: false });
    } catch (error) {
      console.error('[WorkoutScheduleStore] Failed to fetch templates:', error);
      set({ error: 'Failed to load workout templates', isLoading: false });
    }
  },

  fetchSchedule: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const schedule = await window.api.getSchedule(userId);
      set({ schedule, isLoading: false });
    } catch (error) {
      console.error('[WorkoutScheduleStore] Failed to fetch schedule:', error);
      set({ error: 'Failed to load schedule', isLoading: false });
    }
  },

  fetchAll: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const [templates, schedule] = await Promise.all([
        window.api.getWorkoutTemplates(userId),
        window.api.getSchedule(userId),
      ]);
      set({ templates, schedule, isLoading: false });
    } catch (error) {
      console.error('[WorkoutScheduleStore] Failed to fetch data:', error);
      set({ error: 'Failed to load workout schedule', isLoading: false });
    }
  },

  createTemplate: async (template) => {
    try {
      const newTemplate = await window.api.createWorkoutTemplate(template);
      set((state) => ({
        templates: [...state.templates, newTemplate],
      }));
      return newTemplate;
    } catch (error) {
      console.error('[WorkoutScheduleStore] Failed to create template:', error);
      throw error;
    }
  },

  updateTemplate: async (id, updates) => {
    try {
      const updatedTemplate = await window.api.updateWorkoutTemplate(id, updates);
      set((state) => ({
        templates: state.templates.map((t) => (t.id === id ? updatedTemplate : t)),
        selectedTemplate: state.selectedTemplate?.id === id ? updatedTemplate : state.selectedTemplate,
      }));
    } catch (error) {
      console.error('[WorkoutScheduleStore] Failed to update template:', error);
      throw error;
    }
  },

  deleteTemplate: async (id) => {
    try {
      await window.api.deleteWorkoutTemplate(id);
      set((state) => ({
        templates: state.templates.filter((t) => t.id !== id),
        schedule: state.schedule.filter((s) => s.templateId !== id),
        selectedTemplate: state.selectedTemplate?.id === id ? null : state.selectedTemplate,
      }));
    } catch (error) {
      console.error('[WorkoutScheduleStore] Failed to delete template:', error);
      throw error;
    }
  },

  setScheduleEntry: async (userId, dayOfWeek, templateId) => {
    try {
      const result = await window.api.setScheduleEntry(userId, dayOfWeek, templateId);
      set((state) => {
        const newSchedule = state.schedule.filter((s) => s.dayOfWeek !== dayOfWeek);
        if (result) {
          newSchedule.push(result);
        }
        return { schedule: newSchedule };
      });
    } catch (error) {
      console.error('[WorkoutScheduleStore] Failed to set schedule entry:', error);
      throw error;
    }
  },

  clearSchedule: async (userId) => {
    try {
      await window.api.clearSchedule(userId);
      set({ schedule: [] });
    } catch (error) {
      console.error('[WorkoutScheduleStore] Failed to clear schedule:', error);
      throw error;
    }
  },

  setSelectedTemplate: (template) => {
    set({ selectedTemplate: template });
  },

  getTemplateForDay: (dayOfWeek) => {
    const { schedule, templates } = get();
    const entry = schedule.find((s) => s.dayOfWeek === dayOfWeek);
    if (!entry) return null;
    return templates.find((t) => t.id === entry.templateId) || null;
  },

  getWeeklySchedule: () => {
    const { schedule, templates } = get();
    return DAYS_OF_WEEK.map((day) => {
      const entry = schedule.find((s) => s.dayOfWeek === day.value);
      const template = entry ? templates.find((t) => t.id === entry.templateId) || null : null;
      return { day, template };
    });
  },

  reset: () => {
    set(initialState);
  },
}));
