/**
 * UpdateNotification Component
 *
 * Shows when a new version is available with:
 * - Download link to GitHub releases
 * - Copy button for xattr command
 */

import { useState, useEffect } from 'react';

type UpdateStatus = 'idle' | 'checking' | 'available';

export function UpdateNotification() {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [version, setVersion] = useState<string>('');
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

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

    // We still listen to these but just stay on 'available' status
    unsubscribers.push(
      window.updater.onDownloadProgress(() => {})
    );

    unsubscribers.push(
      window.updater.onUpdateDownloaded(() => {})
    );

    unsubscribers.push(
      window.updater.onError(() => {})
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  const handleCopyCommand = () => {
    navigator.clipboard.writeText('xattr -cr /Applications/FitWell.app');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  const downloadUrl = `https://github.com/JJMcGil1/FitWell/releases/download/v${version}/FitWell-${version}-arm64.dmg`;

  // Don't show anything if idle, dismissed, or updater not available
  if (status === 'idle' || dismissed || !window.updater) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 max-w-xs">
        {/* Close button */}
        {status === 'available' && (
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

        {/* Update available */}
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

            {/* Download button */}
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors text-center mb-3"
            >
              Download v{version}
            </a>

            {/* Instructions */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              After installing, run this in Terminal:
            </p>

            {/* Copy command button */}
            <button
              onClick={handleCopyCommand}
              className="w-full py-2 px-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-mono rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Command
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
