/**
 * UpdateModal Component
 *
 * Toast-style modal for the auto-update system.
 * Handles the full state machine: idle -> available -> downloading -> downloaded -> installing
 *
 * Uses SHA256 hash verification (self-signing) instead of code signing certificates.
 */

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlineXMark,
  HiOutlineArrowDownTray,
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineSparkles,
} from 'react-icons/hi2';

// ============================================
// Types
// ============================================

type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'installing' | 'error';

interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes: string;
  currentVersion: string;
  url: string;
  sha256: string;
  size: number;
}

interface DownloadProgress {
  percent: number;
  transferred: number;
  total: number;
  bytesPerSecond: number;
}

// ============================================
// Helper Functions
// ============================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatSpeed(bytesPerSecond: number): string {
  return formatBytes(bytesPerSecond) + '/s';
}

// ============================================
// Component
// ============================================

export function UpdateModal() {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Check if updater API is available
  const api = window.updater;

  // ============================================
  // Event Listeners
  // ============================================

  useEffect(() => {
    if (!api) return;

    const unsubscribers: (() => void)[] = [];

    // Update available
    unsubscribers.push(
      api.onUpdateAvailable((result: { updateAvailable: boolean; updateInfo?: unknown }) => {
        if (result.updateAvailable && result.updateInfo) {
          setUpdateInfo(result.updateInfo as UpdateInfo);
          setStatus('available');
          setIsOpen(true);
          setError(null);
        }
      })
    );

    // Download progress
    unsubscribers.push(
      api.onDownloadProgress((progress: DownloadProgress) => {
        setDownloadProgress(progress);
      })
    );

    // Update downloaded
    unsubscribers.push(
      api.onUpdateDownloaded(() => {
        setStatus('downloaded');
        setDownloadProgress(null);
      })
    );

    // Error
    unsubscribers.push(
      api.onUpdateError((info: { error: string }) => {
        setStatus('error');
        setError(info.error);
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [api]);

  // ============================================
  // Actions
  // ============================================

  const handleDownload = useCallback(async () => {
    if (!api) return;
    try {
      setStatus('downloading');
      setError(null);
      await api.downloadUpdate();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  }, [api]);

  const handleInstall = useCallback(async () => {
    if (!api) return;
    try {
      setStatus('installing');
      await api.installUpdate();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Installation failed');
    }
  }, [api]);

  const handleDismiss = useCallback(() => {
    api?.dismissUpdate();
    setIsOpen(false);
    // Reset state after animation
    setTimeout(() => {
      if (status !== 'downloading') {
        setStatus('idle');
      }
    }, 300);
  }, [api, status]);

  const handleRetry = useCallback(async () => {
    if (!api) return;
    setError(null);
    setStatus('checking');
    try {
      await api.checkForUpdates();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Check failed');
    }
  }, [api]);

  // ============================================
  // Render
  // ============================================

  // Don't render if no updater API or not open
  if (!api || !isOpen || status === 'idle') {
    return null;
  }

  const renderContent = () => {
    switch (status) {
      case 'checking':
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <HiOutlineArrowPath className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Checking for updates...
              </p>
            </div>
          </div>
        );

      case 'available':
        return (
          <>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <HiOutlineSparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Update Available
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Version {updateInfo?.version}
                </p>
                {updateInfo?.releaseNotes && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                    {updateInfo.releaseNotes}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <HiOutlineArrowDownTray className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={handleDismiss}
                className="py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
              >
                Later
              </button>
            </div>
          </>
        );

      case 'downloading':
        const percent = downloadProgress?.percent || 0;
        return (
          <>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <HiOutlineArrowDownTray className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Downloading Update
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {downloadProgress
                    ? `${formatBytes(downloadProgress.transferred)} / ${formatBytes(downloadProgress.total)} • ${formatSpeed(downloadProgress.bytesPerSecond)}`
                    : 'Starting download...'}
                </p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
              {Math.round(percent)}% complete
            </p>
          </>
        );

      case 'downloaded':
        return (
          <>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <HiOutlineCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Ready to Install
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Version {updateInfo?.version} downloaded and verified
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Install & Restart
              </button>
              <button
                onClick={handleDismiss}
                className="py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
              >
                Later
              </button>
            </div>
          </>
        );

      case 'installing':
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <HiOutlineArrowPath className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Installing Update...
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                The app will restart shortly
              </p>
            </div>
          </div>
        );

      case 'error':
        return (
          <>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <HiOutlineExclamationTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Update Failed
                </p>
                <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 line-clamp-2">
                  {error || 'An error occurred'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRetry}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Retry
              </button>
              <button
                onClick={handleDismiss}
                className="py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
              >
                Dismiss
              </button>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  // Toast element
  const toast = (
    <div className="fixed bottom-5 right-5 z-50 animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 w-80 relative">
        {/* Close button (only show when not downloading/installing) */}
        {status !== 'downloading' && status !== 'installing' && (
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <HiOutlineXMark className="w-4 h-4" />
          </button>
        )}

        {renderContent()}
      </div>
    </div>
  );

  return createPortal(toast, document.body);
}

export default UpdateModal;
