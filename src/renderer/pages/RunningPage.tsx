/**
 * RunningPage (Cardio Page)
 *
 * Track cardio sessions: running, cycling, stairmaster, swimming, etc.
 * Features session logging, pace calculation, and statistics.
 */

import React, { useState, useEffect } from 'react';
import { useUserStore } from '../stores/userStore';
import { useRunStore, formatPace, formatDuration, formatTotalDuration } from '../stores/runStore';
import type { Run, SessionIntensity, CardioType, DistanceUnit } from '../../shared/types';
import { format, subDays, isToday, isYesterday, parseISO } from 'date-fns';
import { HiOutlinePlus, HiOutlineXMark, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineClock, HiOutlineFire, HiOutlineArrowTrendingUp } from 'react-icons/hi2';
import { CardMenu } from '../components/CardMenu';
import { FaPersonRunning, FaPersonWalking, FaPersonSwimming } from 'react-icons/fa6';
import { TbStairs } from 'react-icons/tb';
import { MdOutlineDirectionsBike, MdOutlineFitnessCenter } from 'react-icons/md';
import { GiJumpingRope } from 'react-icons/gi';
import { LuWaves, LuGauge } from 'react-icons/lu';
import { PiCompassRoseBold, PiMapPinLineBold } from 'react-icons/pi';
import { BsThreeDots } from 'react-icons/bs';
import { Dropdown } from '../components/Dropdown';
import type { DropdownOption } from '../components/Dropdown';

// Cardio activity types
const CARDIO_TYPES: { type: CardioType; label: string; icon: React.ReactNode }[] = [
  { type: 'running', label: 'Run', icon: <FaPersonRunning className="w-4 h-4" /> },
  { type: 'walking', label: 'Walk', icon: <FaPersonWalking className="w-4 h-4" /> },
  { type: 'cycling', label: 'Cycle', icon: <MdOutlineDirectionsBike className="w-4 h-4" /> },
  { type: 'stairmaster', label: 'Stairs', icon: <TbStairs className="w-4 h-4" /> },
  { type: 'elliptical', label: 'Elliptical', icon: <MdOutlineFitnessCenter className="w-4 h-4" /> },
  { type: 'rowing', label: 'Row', icon: <LuWaves className="w-4 h-4" /> },
  { type: 'swimming', label: 'Swim', icon: <FaPersonSwimming className="w-4 h-4" /> },
  { type: 'hiit', label: 'HIIT', icon: <MdOutlineFitnessCenter className="w-4 h-4" /> },
  { type: 'jump_rope', label: 'Rope', icon: <GiJumpingRope className="w-4 h-4" /> },
  { type: 'other', label: 'Other', icon: <BsThreeDots className="w-4 h-4" /> },
];

// Distance unit options
const DISTANCE_UNITS: { unit: DistanceUnit; label: string; shortLabel: string }[] = [
  { unit: 'miles', label: 'Miles', shortLabel: 'mi' },
  { unit: 'km', label: 'Kilometers', shortLabel: 'km' },
  { unit: 'meters', label: 'Meters', shortLabel: 'm' },
  { unit: 'yards', label: 'Yards', shortLabel: 'yd' },
  { unit: 'laps', label: 'Laps', shortLabel: 'laps' },
  { unit: 'floors', label: 'Floors', shortLabel: 'floors' },
  { unit: 'steps', label: 'Steps', shortLabel: 'steps' },
];

// Dropdown options for distance units
const DISTANCE_UNIT_OPTIONS: DropdownOption<DistanceUnit>[] = DISTANCE_UNITS.map((u) => ({
  value: u.unit,
  label: u.label,
}));

// Filter tabs: subset of cardio types shown as quick filters
const FILTER_TABS: { type: CardioType | 'all'; label: string }[] = [
  { type: 'all', label: 'All' },
  { type: 'running', label: 'Run' },
  { type: 'walking', label: 'Walk' },
  { type: 'cycling', label: 'Cycle' },
  { type: 'stairmaster', label: 'Stairs' },
  { type: 'swimming', label: 'Swim' },
  { type: 'rowing', label: 'Row' },
  { type: 'hiit', label: 'HIIT' },
];

export const RunningPage: React.FC = () => {
  const { currentUser } = useUserStore();
  const {
    isLoading,
    fetchRuns,
    createRun,
    deleteRun,
    getRunStats,
    filterCardioType,
    setFilterCardioType,
    getFilteredRuns,
  } = useRunStore();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingRun, setEditingRun] = useState<Run | null>(null);

  // Form state
  const [cardioType, setCardioType] = useState<CardioType>('running');
  const [sessionType, setSessionType] = useState<SessionIntensity>('easy');
  const [sessionDate, setSessionDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [sessionDistance, setSessionDistance] = useState<number | ''>('');
  const [sessionDistanceUnit, setSessionDistanceUnit] = useState<DistanceUnit>('miles');
  const [sessionDurationMins, setSessionDurationMins] = useState<number | ''>('');
  const [sessionDurationSecs, setSessionDurationSecs] = useState<number | ''>(0);
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionCalories, setSessionCalories] = useState<number | ''>('');
  const [sessionElevation, setSessionElevation] = useState<number | ''>('');

  // Fetch runs on mount
  useEffect(() => {
    if (currentUser) {
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(), 365), 'yyyy-MM-dd');
      fetchRuns(currentUser.id, startDate, endDate);
    }
  }, [currentUser, fetchRuns]);

  const stats = getRunStats();
  const filteredRuns = getFilteredRuns();

  const resetForm = () => {
    setCardioType('running');
    setSessionType('easy');
    setSessionDate(format(new Date(), 'yyyy-MM-dd'));
    setSessionDistance('');
    setSessionDistanceUnit('miles');
    setSessionDurationMins('');
    setSessionDurationSecs(0);
    setSessionNotes('');
    setSessionCalories('');
    setSessionElevation('');
    setEditingRun(null);
  };

  const openModal = (run?: Run) => {
    if (run) {
      setEditingRun(run);
      setCardioType(run.cardioType || 'running');
      setSessionType(run.type);
      setSessionDate(run.date);
      setSessionDistance(run.distance);
      setSessionDistanceUnit(run.distanceUnit || 'miles');
      const totalMins = run.duration;
      setSessionDurationMins(Math.floor(totalMins));
      setSessionDurationSecs(Math.round((totalMins - Math.floor(totalMins)) * 60));
      setSessionNotes(run.notes || '');
      setSessionCalories(run.calories || '');
      setSessionElevation(run.elevation || '');
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSaveSession = async () => {
    if (!currentUser || !sessionDurationMins) return;

    const duration = Number(sessionDurationMins) + Number(sessionDurationSecs || 0) / 60;

    // Auto-generate route name: "M/D/YY - Activity"
    const dateObj = parseISO(sessionDate);
    const cardioLabel = CARDIO_TYPES.find((t) => t.type === cardioType)?.label || 'Cardio';
    const autoRoute = `${format(dateObj, 'M/d/yy')} - ${cardioLabel}`;

    const sessionData = {
      userId: currentUser.id,
      date: sessionDate,
      cardioType,
      type: sessionType,
      distance: Number(sessionDistance) || 0,
      distanceUnit: sessionDistanceUnit,
      duration,
      route: autoRoute,
      notes: sessionNotes.trim() || undefined,
      calories: sessionCalories ? Number(sessionCalories) : undefined,
      elevation: sessionElevation ? Number(sessionElevation) : undefined,
    };

    if (editingRun) {
      await useRunStore.getState().updateRun(editingRun.id, sessionData);
    } else {
      await createRun(sessionData);
    }

    closeModal();
  };

  const handleDeleteSession = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      await deleteRun(id);
    }
  };

  const formatSessionDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  };

  const getCardioTypeConfig = (type: CardioType) => {
    return CARDIO_TYPES.find((t) => t.type === type) || CARDIO_TYPES[0];
  };

  const getDistanceUnitConfig = (unit: DistanceUnit) => {
    return DISTANCE_UNITS.find((u) => u.unit === unit) || DISTANCE_UNITS[0];
  };

  // Group sessions by date
  const groupedSessions = filteredRuns.reduce((acc, run) => {
    const date = run.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(run);
    return acc;
  }, {} as Record<string, Run[]>);

  const sortedDates = Object.keys(groupedSessions).sort((a, b) => b.localeCompare(a));

  // Calculate live pace preview (for distance-based activities)
  const livePace = sessionDistance && sessionDurationMins
    ? (Number(sessionDurationMins) + Number(sessionDurationSecs || 0) / 60) / Number(sessionDistance)
    : null;

  // Check if current cardio type supports distance
  const supportsDistance = ['running', 'walking', 'cycling', 'swimming', 'rowing', 'stairmaster', 'elliptical'].includes(cardioType);

  return (
    <div className="h-full p-6 pb-8 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
            Cardio
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Track and manage your cardio sessions
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Log Session
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">This Week</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.thisWeekRuns}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {stats.thisWeekRuns === 1 ? 'session' : 'sessions'}{stats.thisWeekDuration > 0 ? ` · ${formatTotalDuration(stats.thisWeekDuration)}` : ''}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">This Month</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatTotalDuration(stats.thisMonthDuration)}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {stats.thisMonthRuns} {stats.thisMonthRuns === 1 ? 'session' : 'sessions'}{stats.thisMonthCalories > 0 ? ` · ${stats.thisMonthCalories.toLocaleString()} cal` : ''}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">All Time</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalRuns}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {stats.totalRuns === 1 ? 'session' : 'sessions'}{stats.totalDuration > 0 ? ` · ${formatTotalDuration(stats.totalDuration)}` : ''}
          </p>
        </div>
      </div>

      {/* Filter Tabs — by Cardio Type */}
      <div className="flex gap-1.5 mb-5">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.type}
            onClick={() => setFilterCardioType(tab.type)}
            className={`px-3 py-1.5 text-[13px] font-medium rounded-lg transition-colors ${
              filterCardioType === tab.type
                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-neutral-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Session History */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                <PiCompassRoseBold className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No sessions logged
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Track your cardio sessions, monitor your progress, and watch your fitness grow over time.
              </p>
              <button
                onClick={() => openModal()}
                className="btn-primary"
              >
                Log Your First Session
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                <h3 className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">
                  {formatSessionDate(date)}
                </h3>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                  {groupedSessions[date].map((session) => {
                    const cardioConfig = getCardioTypeConfig(session.cardioType || 'running');
                    const unitConfig = getDistanceUnitConfig(session.distanceUnit || 'miles');
                    const sessionDateObj = parseISO(session.date);
                    const dateLabel = format(sessionDateObj, 'MMM d, yyyy');

                    return (
                      <div
                        key={session.id}
                        className="group bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 transition-all duration-150 hover:shadow-soft overflow-hidden"
                      >
                        <div className="p-4">
                          {/* Header: icon + name + date + menu */}
                          <div className="flex items-start gap-3">
                            {/* Activity icon */}
                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-neutral-700 flex items-center justify-center text-gray-500 dark:text-gray-400 flex-shrink-0">
                              {cardioConfig.icon}
                            </div>

                            {/* Name (route includes date, e.g. "1/23/26 - Run") */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-[15px]">
                                {session.route || `${format(sessionDateObj, 'M/d/yy')} - ${cardioConfig.label}`}
                              </h3>
                            </div>

                            {/* Three-dot menu — visible on hover */}
                            <CardMenu
                              items={[
                                {
                                  label: 'Edit',
                                  icon: <HiOutlinePencilSquare className="w-4 h-4" />,
                                  onClick: () => openModal(session),
                                },
                                {
                                  label: 'Delete',
                                  icon: <HiOutlineTrash className="w-4 h-4" />,
                                  onClick: () => handleDeleteSession(session.id),
                                  variant: 'danger',
                                },
                              ]}
                            />
                          </div>

                          {/* Stats grid with icons */}
                          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-neutral-700/50 grid grid-cols-2 gap-2">
                            {/* Distance */}
                            {session.distance > 0 && (
                              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                <PiMapPinLineBold className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="text-xs font-medium">
                                  {session.distance % 1 === 0 ? session.distance : session.distance.toFixed(2)} {unitConfig.shortLabel}
                                </span>
                              </div>
                            )}

                            {/* Duration */}
                            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                              <HiOutlineClock className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="text-xs font-medium">
                                {formatDuration(session.duration)}
                              </span>
                            </div>

                            {/* Pace */}
                            {session.distance > 0 && session.pace && (
                              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                <LuGauge className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="text-xs font-medium">
                                  {formatPace(session.pace)}/{unitConfig.shortLabel}
                                </span>
                              </div>
                            )}

                            {/* Calories */}
                            {session.calories && (
                              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                <HiOutlineFire className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="text-xs font-medium">
                                  {session.calories} cal
                                </span>
                              </div>
                            )}

                            {/* Elevation */}
                            {session.elevation && (
                              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                                <HiOutlineArrowTrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="text-xs font-medium">
                                  {session.elevation} ft
                                </span>
                              </div>
                            )}
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

      {/* Log Cardio Session Modal */}
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
                {editingRun ? 'Edit Session' : 'Log Session'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Activity Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Activity Type
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {CARDIO_TYPES.map((type) => (
                    <button
                      key={type.type}
                      onClick={() => setCardioType(type.type)}
                      className={`flex flex-col items-center gap-1 px-2 py-3 rounded-lg border text-xs font-medium transition-all ${
                        cardioType === type.type
                          ? 'border-brand-500 bg-brand-500 text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-600'
                      }`}
                    >
                      <span className="text-lg">{type.icon}</span>
                      <span className="truncate w-full text-center">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                />
              </div>

              {/* Distance - only show for distance-based activities */}
              {supportsDistance && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Distance
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={sessionDistance}
                      onChange={(e) => setSessionDistance(e.target.value ? parseFloat(e.target.value) : '')}
                      placeholder="3.10"
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                    />
                    <Dropdown<DistanceUnit>
                      options={DISTANCE_UNIT_OPTIONS}
                      value={sessionDistanceUnit}
                      onChange={setSessionDistanceUnit}
                    />
                  </div>
                </div>
              )}

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={sessionDurationMins}
                      onChange={(e) => setSessionDurationMins(e.target.value ? parseInt(e.target.value) : '')}
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
                      value={sessionDurationSecs}
                      onChange={(e) => setSessionDurationSecs(e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="00"
                      min="0"
                      max="59"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                    />
                    <p className="text-xs text-gray-400 mt-1">seconds</p>
                  </div>
                </div>
              </div>

              {/* Live Pace Preview - only for distance-based activities */}
              {supportsDistance && livePace && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm text-blue-700 dark:text-blue-300">Calculated Pace</span>
                  <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {formatPace(livePace)} /{getDistanceUnitConfig(sessionDistanceUnit).shortLabel}
                  </span>
                </div>
              )}

              {/* Optional fields row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Calories (optional)
                  </label>
                  <input
                    type="number"
                    value={sessionCalories}
                    onChange={(e) => setSessionCalories(e.target.value ? parseInt(e.target.value) : '')}
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
                    value={sessionElevation}
                    onChange={(e) => setSessionElevation(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="150"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                  />
                </div>
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
                onClick={handleSaveSession}
                disabled={!sessionDurationMins}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingRun ? 'Save Changes' : 'Log Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
