/**
 * GoalsPage
 *
 * Manage goals - view, create, edit, delete.
 */

import React, { useState } from 'react';
import { HiOutlineArrowPath, HiOutlineScale, HiOutlineClipboardDocument, HiOutlinePlus, HiOutlineCheckBadge, HiOutlineBolt, HiOutlinePencilSquare, HiOutlinePauseCircle, HiOutlineTrash, HiOutlinePlayCircle } from 'react-icons/hi2';
import { useGoalStore } from '../stores/goalStore';
import { useUserStore } from '../stores/userStore';
import type { Goal, GoalType } from '../../shared/types';

export const GoalsPage: React.FC = () => {
  const { currentUser } = useUserStore();
  const { goals, createGoal, updateGoal, deleteGoal, streaks } = useGoalStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalType, setNewGoalType] = useState<GoalType>('workout');

  // Edit state
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editGoalName, setEditGoalName] = useState('');
  const [editGoalType, setEditGoalType] = useState<GoalType>('workout');

  const activeGoals = goals.filter((g) => g.isActive);
  const inactiveGoals = goals.filter((g) => !g.isActive);

  const handleCreateGoal = async () => {
    if (!currentUser || !newGoalName.trim()) return;

    await createGoal({
      userId: currentUser.id,
      name: newGoalName.trim(),
      type: newGoalType,
      frequency: 'daily',
      isActive: true,
    });

    setNewGoalName('');
    setNewGoalType('workout');
    setIsCreating(false);
  };

  const handleToggleActive = async (goal: Goal) => {
    await updateGoal(goal.id, { isActive: !goal.isActive });
  };

  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setEditGoalName(goal.name);
    setEditGoalType(goal.type);
  };

  const handleSaveEdit = async () => {
    if (!editingGoal || !editGoalName.trim()) return;

    await updateGoal(editingGoal.id, {
      name: editGoalName.trim(),
      type: editGoalType,
    });

    setEditingGoal(null);
    setEditGoalName('');
    setEditGoalType('workout');
  };

  const handleCancelEdit = () => {
    setEditingGoal(null);
    setEditGoalName('');
    setEditGoalType('workout');
  };

  const handleDelete = async (goalId: string) => {
    if (window.confirm('Are you sure you want to delete this goal? This cannot be undone.')) {
      await deleteGoal(goalId);
    }
  };

  const getGoalTypeIcon = (type: GoalType) => {
    switch (type) {
      case 'workout':
        return <HiOutlineArrowPath className="w-5 h-5" />;
      case 'weight':
        return <HiOutlineScale className="w-5 h-5" />;
      default:
        return <HiOutlineClipboardDocument className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Goals</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your fitness goals
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="btn-primary"
        >
          <HiOutlinePlus className="w-4 h-4" />
          New Goal
        </button>
      </div>

      {/* Create goal form */}
      {isCreating && (
        <div className="card p-5 mb-6 animate-fade-in">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Create New Goal</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Goal Name
              </label>
              <input
                type="text"
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                placeholder="e.g., Morning Run, Meditation, Strength Training"
                className="input"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Goal Type
              </label>
              <div className="flex gap-2">
                {(['workout', 'weight', 'custom'] as GoalType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setNewGoalType(type)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium
                      transition-all duration-150
                      ${newGoalType === type
                        ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-600'
                      }
                    `}
                  >
                    {getGoalTypeIcon(type)}
                    <span className="capitalize">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCreateGoal}
                disabled={!newGoalName.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Goal
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewGoalName('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Goals */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Active Goals ({activeGoals.length})
        </h3>

        {activeGoals.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center">
              <HiOutlineCheckBadge className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">No active goals yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create a goal to start tracking</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeGoals.map((goal) => {
              const streak = streaks.get(goal.id);
              return (
                <div
                  key={goal.id}
                  className="card p-4 flex items-center gap-4"
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-500 dark:text-brand-400">
                    {getGoalTypeIcon(goal.type)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {goal.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {goal.type} • {goal.frequency}
                    </p>
                  </div>

                  {/* Streak */}
                  {streak && streak.currentStreak > 0 && (
                    <div className="flex items-center gap-1 text-orange-500">
                      <HiOutlineBolt className="w-4 h-4" />
                      <span className="text-sm font-medium">{streak.currentStreak}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(goal)}
                      className="p-2 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                      title="Edit goal"
                    >
                      <HiOutlinePencilSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(goal)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                      title="Pause goal"
                    >
                      <HiOutlinePauseCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete goal"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inactive Goals */}
      {inactiveGoals.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Paused Goals ({inactiveGoals.length})
          </h3>

          <div className="space-y-3">
            {inactiveGoals.map((goal) => (
              <div
                key={goal.id}
                className="card p-4 flex items-center gap-4 opacity-60"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-neutral-700 flex items-center justify-center text-gray-400 dark:text-gray-500">
                  {getGoalTypeIcon(goal.type)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
                    {goal.name}
                  </h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                    {goal.type} • Paused
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(goal)}
                    className="p-2 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                    title="Edit goal"
                  >
                    <HiOutlinePencilSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(goal)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                    title="Resume goal"
                  >
                    <HiOutlinePlayCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete goal"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {editingGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Edit Goal</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Goal Name
                  </label>
                  <input
                    type="text"
                    value={editGoalName}
                    onChange={(e) => setEditGoalName(e.target.value)}
                    placeholder="e.g., Morning Run, Meditation, Strength Training"
                    className="input"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Goal Type
                  </label>
                  <div className="flex gap-2">
                    {(['workout', 'weight', 'custom'] as GoalType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setEditGoalType(type)}
                        className={`
                          flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium
                          transition-all duration-150
                          ${editGoalType === type
                            ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-600'
                          }
                        `}
                      >
                        {getGoalTypeIcon(type)}
                        <span className="capitalize">{type}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-4 bg-gray-50 dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-700">
              <button
                onClick={handleCancelEdit}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editGoalName.trim()}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
