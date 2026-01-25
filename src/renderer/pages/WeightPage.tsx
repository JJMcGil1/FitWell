/**
 * WeightPage
 *
 * Weight tracking with visual progress chart.
 * Features: line chart, date range filtering, goal weight target, statistics.
 */

import React, { useState, useMemo } from 'react';
import { useWeightStore } from '../stores/weightStore';
import { useUserStore } from '../stores/userStore';
import { useGoalStore } from '../stores/goalStore';
import type { WeightEntry } from '../../shared/types';

type DateRange = '7d' | '30d' | '90d' | '1y' | 'all';

export const WeightPage: React.FC = () => {
  const { currentUser } = useUserStore();
  const { entries, addEntry, deleteEntry, isLoading } = useWeightStore();
  const { goals } = useGoalStore();

  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNotes, setNewNotes] = useState('');

  // Get weight goal if exists
  const weightGoal = goals.find((g) => g.type === 'weight' && g.isActive);
  const targetWeight = weightGoal?.targetValue;

  // Filter entries by date range
  const filteredEntries = useMemo(() => {
    if (dateRange === 'all') return [...entries].sort((a, b) => a.date.localeCompare(b.date));

    const now = new Date();
    let cutoffDate = new Date();

    switch (dateRange) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    return entries
      .filter((e) => e.date >= cutoffStr)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [entries, dateRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredEntries.length === 0) {
      return {
        current: null,
        change: null,
        min: null,
        max: null,
        average: null,
      };
    }

    const weights = filteredEntries.map((e) => e.weight);
    const current = entries[0]?.weight ?? null; // Most recent (entries are sorted desc)
    const oldest = filteredEntries[0]?.weight ?? null;
    const change = current !== null && oldest !== null ? current - oldest : null;

    return {
      current,
      change,
      min: Math.min(...weights),
      max: Math.max(...weights),
      average: weights.reduce((a, b) => a + b, 0) / weights.length,
    };
  }, [filteredEntries, entries]);

  // Handle adding new entry
  const handleAddEntry = async () => {
    if (!currentUser || !newWeight) return;

    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) return;

    await addEntry({
      userId: currentUser.id,
      date: newDate,
      weight,
      unit: 'lbs',
      notes: newNotes || undefined,
    });

    setNewWeight('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewNotes('');
    setShowAddForm(false);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this weight entry?')) {
      await deleteEntry(id);
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Weight Progress</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track your weight over time
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Log Weight
        </button>
      </div>

      {/* Add Weight Form */}
      {showAddForm && (
        <div className="card p-5 mb-6 animate-fade-in">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Log Weight Entry</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Weight (lbs)
              </label>
              <input
                type="number"
                step="0.1"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                placeholder="e.g., 165.5"
                className="input"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Notes (optional)
              </label>
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="e.g., After workout"
                className="input"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAddEntry}
              disabled={!newWeight}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Entry
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewWeight('');
                setNewNotes('');
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {stats.current !== null ? `${stats.current.toFixed(1)}` : '—'}
            <span className="text-sm font-normal text-gray-500 ml-1">lbs</span>
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Change</p>
          <p className={`text-2xl font-bold mt-1 ${
            stats.change === null ? 'text-gray-900 dark:text-gray-100' :
            stats.change < 0 ? 'text-green-600 dark:text-green-400' :
            stats.change > 0 ? 'text-red-500 dark:text-red-400' :
            'text-gray-900 dark:text-gray-100'
          }`}>
            {stats.change !== null ? (
              <>
                {stats.change > 0 ? '+' : ''}{stats.change.toFixed(1)}
                <span className="text-sm font-normal text-gray-500 ml-1">lbs</span>
              </>
            ) : '—'}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Low</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {stats.min !== null ? `${stats.min.toFixed(1)}` : '—'}
            <span className="text-sm font-normal text-gray-500 ml-1">lbs</span>
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">High</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {stats.max !== null ? `${stats.max.toFixed(1)}` : '—'}
            <span className="text-sm font-normal text-gray-500 ml-1">lbs</span>
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Average</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {stats.average !== null ? `${stats.average.toFixed(1)}` : '—'}
            <span className="text-sm font-normal text-gray-500 ml-1">lbs</span>
          </p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="flex items-center gap-2 mb-4">
        {(['7d', '30d', '90d', '1y', 'all'] as DateRange[]).map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              dateRange === range
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-600'
            }`}
          >
            {range === '7d' ? '7 Days' :
             range === '30d' ? '30 Days' :
             range === '90d' ? '90 Days' :
             range === '1y' ? '1 Year' : 'All Time'}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="card p-6 mb-6">
        {filteredEntries.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p>No weight entries in this period</p>
              <p className="text-sm mt-1">Log your first weight to see the chart</p>
            </div>
          </div>
        ) : filteredEntries.length === 1 ? (
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{filteredEntries[0].weight} lbs</p>
              <p className="mt-2">{formatFullDate(filteredEntries[0].date)}</p>
              <p className="text-sm mt-1">Log more entries to see a trend chart</p>
            </div>
          </div>
        ) : (
          <WeightChart entries={filteredEntries} targetWeight={targetWeight} />
        )}
      </div>

      {/* Weight Goal Info */}
      {targetWeight && (
        <div className="card p-4 mb-6 border-l-4 border-brand-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-brand-500 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Goal Weight: {targetWeight} lbs
              </p>
              {stats.current !== null && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {Math.abs(stats.current - targetWeight).toFixed(1)} lbs {stats.current > targetWeight ? 'to lose' : 'to gain'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Entry History */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Recent Entries ({entries.length})
        </h3>

        {entries.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400">No weight entries yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Click "Log Weight" to add your first entry</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.slice(0, 20).map((entry, index) => {
              const prevEntry = entries[index + 1];
              const change = prevEntry ? entry.weight - prevEntry.weight : null;

              return (
                <div key={entry.id} className="card p-4 flex items-center gap-4">
                  {/* Date */}
                  <div className="w-20 text-sm text-gray-500 dark:text-gray-400">
                    {formatFullDate(entry.date)}
                  </div>

                  {/* Weight */}
                  <div className="flex-1">
                    <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {entry.weight.toFixed(1)} lbs
                    </span>
                    {entry.notes && (
                      <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                        {entry.notes}
                      </span>
                    )}
                  </div>

                  {/* Change */}
                  {change !== null && (
                    <div className={`text-sm font-medium ${
                      change < 0 ? 'text-green-600 dark:text-green-400' :
                      change > 0 ? 'text-red-500 dark:text-red-400' :
                      'text-gray-500'
                    }`}>
                      {change > 0 ? '+' : ''}{change.toFixed(1)}
                    </div>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete entry"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}

            {entries.length > 20 && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
                Showing 20 of {entries.length} entries
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// SVG Line Chart Component
interface WeightChartProps {
  entries: WeightEntry[];
  targetWeight?: number;
}

const WeightChart: React.FC<WeightChartProps> = ({ entries, targetWeight }) => {
  const chartWidth = 800;
  const chartHeight = 300;
  const padding = { top: 20, right: 40, bottom: 40, left: 50 };

  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Calculate bounds
  const weights = entries.map((e) => e.weight);
  let minWeight = Math.min(...weights);
  let maxWeight = Math.max(...weights);

  // Include target weight in bounds if provided
  if (targetWeight) {
    minWeight = Math.min(minWeight, targetWeight);
    maxWeight = Math.max(maxWeight, targetWeight);
  }

  // Add padding to bounds
  const weightPadding = (maxWeight - minWeight) * 0.1 || 5;
  minWeight = minWeight - weightPadding;
  maxWeight = maxWeight + weightPadding;

  // Scale functions
  const xScale = (index: number) => (index / (entries.length - 1)) * innerWidth;
  const yScale = (weight: number) =>
    innerHeight - ((weight - minWeight) / (maxWeight - minWeight)) * innerHeight;

  // Generate path
  const pathD = entries
    .map((entry, i) => {
      const x = xScale(i);
      const y = yScale(entry.weight);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Generate area path for gradient fill
  const areaD = `${pathD} L ${xScale(entries.length - 1)} ${innerHeight} L 0 ${innerHeight} Z`;

  // Y-axis ticks
  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks }, (_, i) =>
    minWeight + ((maxWeight - minWeight) / (yTicks - 1)) * i
  );

  // X-axis labels (show ~5-7 dates)
  const xLabelCount = Math.min(7, entries.length);
  const xLabelIndices = Array.from({ length: xLabelCount }, (_, i) =>
    Math.round((i / (xLabelCount - 1)) * (entries.length - 1))
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full min-w-[600px]"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(249, 115, 22)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(249, 115, 22)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid lines */}
          {yTickValues.map((tick, i) => (
            <line
              key={`grid-${i}`}
              x1={0}
              x2={innerWidth}
              y1={yScale(tick)}
              y2={yScale(tick)}
              stroke="currentColor"
              strokeOpacity={0.1}
              className="text-gray-500 dark:text-gray-600"
            />
          ))}

          {/* Target weight line */}
          {targetWeight && (
            <>
              <line
                x1={0}
                x2={innerWidth}
                y1={yScale(targetWeight)}
                y2={yScale(targetWeight)}
                stroke="rgb(34, 197, 94)"
                strokeWidth={2}
                strokeDasharray="6,4"
              />
              <text
                x={innerWidth + 5}
                y={yScale(targetWeight)}
                fill="rgb(34, 197, 94)"
                fontSize={11}
                dominantBaseline="middle"
              >
                Goal
              </text>
            </>
          )}

          {/* Area fill */}
          <path d={areaD} fill="url(#areaGradient)" />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke="rgb(249, 115, 22)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {entries.map((entry, i) => (
            <g key={entry.id}>
              <circle
                cx={xScale(i)}
                cy={yScale(entry.weight)}
                r={4}
                fill="rgb(249, 115, 22)"
                stroke="white"
                strokeWidth={2}
              />
              <title>{`${formatDate(entry.date)}: ${entry.weight} lbs`}</title>
            </g>
          ))}

          {/* Y-axis labels */}
          {yTickValues.map((tick, i) => (
            <text
              key={`ylabel-${i}`}
              x={-10}
              y={yScale(tick)}
              fill="currentColor"
              className="text-gray-500 dark:text-gray-400"
              fontSize={11}
              textAnchor="end"
              dominantBaseline="middle"
            >
              {tick.toFixed(0)}
            </text>
          ))}

          {/* X-axis labels */}
          {xLabelIndices.map((index) => (
            <text
              key={`xlabel-${index}`}
              x={xScale(index)}
              y={innerHeight + 25}
              fill="currentColor"
              className="text-gray-500 dark:text-gray-400"
              fontSize={11}
              textAnchor="middle"
            >
              {formatDate(entries[index].date)}
            </text>
          ))}

          {/* Y-axis label */}
          <text
            x={-35}
            y={innerHeight / 2}
            fill="currentColor"
            className="text-gray-500 dark:text-gray-400"
            fontSize={11}
            textAnchor="middle"
            transform={`rotate(-90, -35, ${innerHeight / 2})`}
          >
            Weight (lbs)
          </text>
        </g>
      </svg>
    </div>
  );
};
