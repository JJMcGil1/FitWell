/**
 * RunningPage
 *
 * Track runs, distance, pace, and running goals.
 * Features run logging, pace calculation, and statistics.
 */

import React, { useState, useEffect } from 'react';
import { useUserStore } from '../stores/userStore';
import { useRunStore, formatPace, formatDuration } from '../stores/runStore';
import type { Run, RunType } from '../../shared/types';
import { format, subDays, isToday, isYesterday, parseISO } from 'date-fns';

// Run type configurations
const RUN_TYPES: { type: RunType; label: string; description: string; color: string }[] = [
  { type: 'easy', label: 'Easy', description: 'Relaxed, conversational pace', color: 'bg-green-500' },
  { type: 'tempo', label: 'Tempo', description: 'Comfortably hard effort', color: 'bg-orange-500' },
  { type: 'interval', label: 'Interval', description: 'Speed work with recovery', color: 'bg-red-500' },
  { type: 'long', label: 'Long', description: 'Extended distance run', color: 'bg-blue-500' },
  { type: 'recovery', label: 'Recovery', description: 'Very easy, active recovery', color: 'bg-purple-500' },
  { type: 'race', label: 'Race', description: 'Competition or time trial', color: 'bg-yellow-500' },
];

export const RunningPage: React.FC = () => {
  const { currentUser } = useUserStore();
  const {
    runs,
    isLoading,
    fetchRuns,
    createRun,
    deleteRun,
    getRunStats,
    filterType,
    setFilterType,
    getFilteredRuns,
  } = useRunStore();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingRun, setEditingRun] = useState<Run | null>(null);

  // Form state
  const [runType, setRunType] = useState<RunType>('easy');
  const [runDate, setRunDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [runDistance, setRunDistance] = useState<number | ''>('');
  const [runDurationMins, setRunDurationMins] = useState<number | ''>('');
  const [runDurationSecs, setRunDurationSecs] = useState<number | ''>(0);
  const [runRoute, setRunRoute] = useState('');
  const [runNotes, setRunNotes] = useState('');
  const [runCalories, setRunCalories] = useState<number | ''>('');
  const [runElevation, setRunElevation] = useState<number | ''>('');

  // Fetch runs on mount
  useEffect(() => {
    if (currentUser) {
      // Fetch last 365 days of runs for good statistics
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(), 365), 'yyyy-MM-dd');
      fetchRuns(currentUser.id, startDate, endDate);
    }
  }, [currentUser, fetchRuns]);

  const stats = getRunStats();
  const filteredRuns = getFilteredRuns();

  const resetForm = () => {
    setRunType('easy');
    setRunDate(format(new Date(), 'yyyy-MM-dd'));
    setRunDistance('');
    setRunDurationMins('');
    setRunDurationSecs(0);
    setRunRoute('');
    setRunNotes('');
    setRunCalories('');
    setRunElevation('');
    setEditingRun(null);
  };

  const openModal = (run?: Run) => {
    if (run) {
      setEditingRun(run);
      setRunType(run.type);
      setRunDate(run.date);
      setRunDistance(run.distance);
      const totalMins = run.duration;
      setRunDurationMins(Math.floor(totalMins));
      setRunDurationSecs(Math.round((totalMins - Math.floor(totalMins)) * 60));
      setRunRoute(run.route || '');
      setRunNotes(run.notes || '');
      setRunCalories(run.calories || '');
      setRunElevation(run.elevation || '');
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSaveRun = async () => {
    if (!currentUser || !runDistance || !runDurationMins) return;

    const duration = Number(runDurationMins) + Number(runDurationSecs || 0) / 60;

    const runData = {
      userId: currentUser.id,
      date: runDate,
      type: runType,
      distance: Number(runDistance),
      duration,
      route: runRoute.trim() || undefined,
      notes: runNotes.trim() || undefined,
      calories: runCalories ? Number(runCalories) : undefined,
      elevation: runElevation ? Number(runElevation) : undefined,
    };

    if (editingRun) {
      await useRunStore.getState().updateRun(editingRun.id, runData);
    } else {
      await createRun(runData);
    }

    closeModal();
  };

  const handleDeleteRun = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this run?')) {
      await deleteRun(id);
    }
  };

  const formatRunDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  };

  const getRunTypeConfig = (type: RunType) => {
    return RUN_TYPES.find((t) => t.type === type) || RUN_TYPES[0];
  };

  // Group runs by date
  const groupedRuns = filteredRuns.reduce((acc, run) => {
    const date = run.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(run);
    return acc;
  }, {} as Record<string, Run[]>);

  const sortedDates = Object.keys(groupedRuns).sort((a, b) => b.localeCompare(a));

  // Calculate live pace preview
  const livePace = runDistance && runDurationMins
    ? (Number(runDurationMins) + Number(runDurationSecs || 0) / 60) / Number(runDistance)
    : null;

  return (
    <div className="h-full p-6 pb-8 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
            Running
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {stats.thisWeekDistance.toFixed(1)} mi this week
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Log Run
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">This Week</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.thisWeekDistance.toFixed(1)}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">miles</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">This Month</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.thisMonthDistance.toFixed(1)}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">miles</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Avg Pace</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatPace(stats.averagePace)}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">/mile</p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Longest Run</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.longestRun.toFixed(1)}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">miles</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
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
        {RUN_TYPES.map((type) => (
          <button
            key={type.type}
            onClick={() => setFilterType(type.type)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filterType === type.type
                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-600'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Run History */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No runs logged
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Track your runs, monitor your pace, and watch your distance grow over time.
              </p>
              <button
                onClick={() => openModal()}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                Log Your First Run
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                  {formatRunDate(date)}
                </h3>
                <div className="space-y-3">
                  {groupedRuns[date].map((run) => {
                    const typeConfig = getRunTypeConfig(run.type);
                    return (
                      <div
                        key={run.id}
                        className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          {/* Type indicator */}
                          <div className={`w-10 h-10 rounded-lg ${typeConfig.color} bg-opacity-10 dark:bg-opacity-20 flex items-center justify-center`}>
                            <svg className={`w-5 h-5 ${typeConfig.color.replace('bg-', 'text-').replace('500', '600')} dark:${typeConfig.color.replace('bg-', 'text-').replace('500', '400')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                            </svg>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 capitalize">
                                {run.type}
                              </span>
                              {run.route && (
                                <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                  {run.route}
                                </span>
                              )}
                            </div>

                            {/* Stats row */}
                            <div className="flex items-center gap-6 mt-2">
                              <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                  {run.distance.toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">miles</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                  {formatDuration(run.duration)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">time</p>
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                  {formatPace(run.pace)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">pace</p>
                              </div>
                              {run.elevation && (
                                <div>
                                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                    {run.elevation}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">ft elev</p>
                                </div>
                              )}
                            </div>

                            {run.notes && (
                              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                {run.notes}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openModal(run)}
                              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                              title="Edit run"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteRun(run.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete run"
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

      {/* Log Run Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-neutral-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {editingRun ? 'Edit Run' : 'Log Run'}
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
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Run Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Run Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {RUN_TYPES.map((type) => (
                    <button
                      key={type.type}
                      onClick={() => setRunType(type.type)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all text-center ${
                        runType === type.type
                          ? 'border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-600'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  {getRunTypeConfig(runType).description}
                </p>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={runDate}
                  onChange={(e) => setRunDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                />
              </div>

              {/* Distance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Distance (miles)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={runDistance}
                  onChange={(e) => setRunDistance(e.target.value ? parseFloat(e.target.value) : '')}
                  placeholder="3.10"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={runDurationMins}
                      onChange={(e) => setRunDurationMins(e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="25"
                      min="0"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                    />
                    <p className="text-xs text-gray-400 mt-1">minutes</p>
                  </div>
                  <span className="text-gray-400 font-medium">:</span>
                  <div className="w-24">
                    <input
                      type="number"
                      value={runDurationSecs}
                      onChange={(e) => setRunDurationSecs(e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="00"
                      min="0"
                      max="59"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                    />
                    <p className="text-xs text-gray-400 mt-1">seconds</p>
                  </div>
                </div>
              </div>

              {/* Live Pace Preview */}
              {livePace && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm text-blue-700 dark:text-blue-300">Calculated Pace</span>
                  <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {formatPace(livePace)} /mi
                  </span>
                </div>
              )}

              {/* Route */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Route Name (optional)
                </label>
                <input
                  type="text"
                  value={runRoute}
                  onChange={(e) => setRunRoute(e.target.value)}
                  placeholder="e.g., Neighborhood loop, Park trail"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                />
              </div>

              {/* Optional fields row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Calories (optional)
                  </label>
                  <input
                    type="number"
                    value={runCalories}
                    onChange={(e) => setRunCalories(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="300"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Elevation (ft, optional)
                  </label>
                  <input
                    type="number"
                    value={runElevation}
                    onChange={(e) => setRunElevation(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="150"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={runNotes}
                  onChange={(e) => setRunNotes(e.target.value)}
                  placeholder="How did it feel? Weather conditions?"
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
                onClick={handleSaveRun}
                disabled={!runDistance || !runDurationMins}
                className="px-6 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingRun ? 'Save Changes' : 'Log Run'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
