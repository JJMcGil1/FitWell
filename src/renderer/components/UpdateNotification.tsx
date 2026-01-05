/**
 * UpdateNotification Component
 *
 * Shows update status in the bottom right corner.
 * Single "Update Now" button - downloads and auto-restarts.
 */

import { useState, useEffect } from 'react';

type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'restarting' | 'error';

export function UpdateNotification() {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [version, setVersion] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if updater API is available (not in dev mode)
    if (!window.updater) return;

    const unsubscribers: (() => void)[] = [];

    unsubscribers.push(
      window.updater.onUpdateChecking(() => {
        setStatus('checking');
        setDismissed(false);
      })
    );

    unsubscribers.push(
      window.updater.onUpdateAvailable((info) => {
        setStatus('available');
        setVersion(info.version);
        setDismissed(false);
      })
    );

    unsubscribers.push(
      window.updater.onUpdateNotAvailable(() => {
        setStatus('idle');
      })
    );

    unsubscribers.push(
      window.updater.onDownloadProgress((progressInfo) => {
        setStatus('downloading');
        setProgress(Math.round(progressInfo.percent));
      })
    );

    unsubscribers.push(
      window.updater.onUpdateDownloaded(() => {
        // Auto-install when download completes
        setStatus('restarting');
        setTimeout(() => {
          window.updater?.installUpdate();
        }, 500);
      })
    );

    unsubscribers.push(
      window.updater.onError((errorMsg) => {
        setStatus('error');
        setError(errorMsg);
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  const handleUpdate = () => {
    setStatus('downloading');
    setProgress(0);
    window.updater?.downloadUpdate();
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  // Don't show anything if idle, dismissed, or updater not available
  if (status === 'idle' || dismissed || !window.updater) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-xs">
        {/* Close button - only show when not updating */}
        {(status === 'available' || status === 'error') && (
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Checking status */}
        {status === 'checking' && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Checking for updates...</p>
            </div>
          </div>
        )}

        {/* Update available - single button */}
        {status === 'available' && (
          <div className="pr-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Update Available</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Version {version}</p>
              </div>
            </div>
            <button
              onClick={handleUpdate}
              className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Update Now
            </button>
          </div>
        )}

        {/* Downloading */}
        {status === 'downloading' && (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Updating...</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{progress}% complete</p>
              </div>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Restarting */}
        {status === 'restarting' && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Restarting...</p>
            </div>
          </div>
        )}

        {/* Error - Code Signature (macOS quarantine issue) */}
        {status === 'error' && error.toLowerCase().includes('code signature') && (
          <div className="pr-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Update Ready</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">v{version} - Manual step needed</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
              Run this in Terminal, then reopen FitWell:
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText('xattr -cr /Applications/FitWell.app');
                const btn = document.getElementById('copy-btn');
                if (btn) btn.textContent = 'Copied!';
                setTimeout(() => {
                  if (btn) btn.textContent = 'Copy Command';
                }, 2000);
              }}
              id="copy-btn"
              className="w-full py-2 px-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-mono rounded-lg transition-colors"
            >
              Copy Command
            </button>
          </div>
        )}

        {/* Error - Generic */}
        {status === 'error' && !error.toLowerCase().includes('code signature') && (
          <div className="pr-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Update Error</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
