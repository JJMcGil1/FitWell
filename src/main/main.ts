/**
 * Electron Main Process
 *
 * Entry point for the desktop application.
 * Handles window creation, lifecycle, and process coordination.
 */

import { app, BrowserWindow, shell, nativeImage, ipcMain } from 'electron';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { initDatabase, closeDatabase } from './database';
import { registerIpcHandlers } from './ipc/handlers';
import { autoUpdater } from 'electron-updater';

const execAsync = promisify(exec);

// Set app name for dock display (critical for dev mode where Electron binary is used)
app.setName('FitWell');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// Note: Only needed if using Squirrel installer
try {
  if (require('electron-squirrel-startup')) {
    app.quit();
  }
} catch {
  // electron-squirrel-startup not installed, ignore
}

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

async function createWindow(): Promise<void> {
  // Initialize database before window creation
  initDatabase();
  registerIpcHandlers();

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset', // macOS: sleek integrated title bar
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#f9fafb', // Matches Tailwind gray-50
    show: false, // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true, // Security: isolate renderer from Node
      sandbox: true,
    },
  });

  // Graceful show after content loads (prevents flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Load the app
  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

// Auto-updater setup
function setupAutoUpdater(): void {
  // Don't check for updates in dev mode
  if (isDev) return;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    mainWindow?.webContents.send('updater:checking');
  });

  autoUpdater.on('update-available', (info: { version: string }) => {
    mainWindow?.webContents.send('updater:available', info);
  });

  autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('updater:not-available');
  });

  autoUpdater.on('download-progress', (progress: { percent: number }) => {
    mainWindow?.webContents.send('updater:progress', progress);
  });

  autoUpdater.on('update-downloaded', (info: { version: string }) => {
    mainWindow?.webContents.send('updater:downloaded', info);
  });

  autoUpdater.on('error', (error: Error) => {
    mainWindow?.webContents.send('updater:error', error.message);
  });

  // Check for updates after a short delay
  setTimeout(() => {
    autoUpdater.checkForUpdates();
  }, 3000);

  // Also check periodically every 30 minutes while app is running
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 30 * 60 * 1000);
}

// IPC handlers for updater
ipcMain.handle('updater:check', async () => {
  if (isDev) return { updateAvailable: false };
  return autoUpdater.checkForUpdates();
});

ipcMain.handle('updater:download', async () => {
  return autoUpdater.downloadUpdate();
});

ipcMain.handle('updater:install', async () => {
  // On macOS, clear quarantine attribute before installing
  if (process.platform === 'darwin') {
    try {
      // Clear quarantine on the app and the update cache
      const appPath = app.getPath('exe').replace(/\/Contents\/MacOS\/.*$/, '');
      const cachePath = app.getPath('userData').replace(/\/Application Support\/.*$/, '/Caches');

      console.log('Clearing quarantine for update...');
      console.log('App path:', appPath);
      console.log('Cache path:', cachePath);

      // Clear quarantine on common update locations
      await execAsync(`xattr -cr "${appPath}" 2>/dev/null || true`);
      await execAsync(`xattr -cr "${cachePath}" 2>/dev/null || true`);
      await execAsync(`xattr -cr ~/Library/Caches/com.fitwell* 2>/dev/null || true`);
      await execAsync(`xattr -cr /tmp/com.fitwell* 2>/dev/null || true`);

      console.log('Quarantine cleared, proceeding with install');
    } catch (err) {
      console.error('Error clearing quarantine:', err);
      // Continue anyway - might still work
    }
  }

  autoUpdater.quitAndInstall();
});

// App lifecycle
app.whenReady().then(() => {
  // Set dock icon on macOS (both dev and prod)
  if (process.platform === 'darwin' && app.dock) {
    const iconPath = path.join(__dirname, '../../assets/fitwell-desktop.png');
    const icon = nativeImage.createFromPath(iconPath);
    if (!icon.isEmpty()) {
      app.dock.setIcon(icon);
    }
  }

  createWindow();
  setupAutoUpdater();
});

app.on('window-all-closed', () => {
  closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent navigation away from app
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event) => {
    event.preventDefault();
  });
});
