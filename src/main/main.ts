/**
 * Electron Main Process
 *
 * Entry point for the desktop application.
 * Handles window creation, lifecycle, and process coordination.
 */

import { app, BrowserWindow, shell, nativeImage, ipcMain } from 'electron';
import path from 'path';
import { initDatabase, closeDatabase } from './database';
import { registerIpcHandlers } from './ipc/handlers';
import {
  initAutoUpdater,
  stopAutoUpdater,
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  getCurrentVersion,
} from './auto-updater';

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

  // Initialize auto-updater after window is ready
  initAutoUpdater(mainWindow);
}

// ============================================
// IPC Handlers for Updater
// ============================================

ipcMain.handle('updater:check', async () => {
  if (isDev) {
    return { updateAvailable: false };
  }
  return checkForUpdates();
});

ipcMain.handle('updater:download', async () => {
  return downloadUpdate();
});

ipcMain.handle('updater:install', async () => {
  return installUpdate();
});

ipcMain.handle('updater:getVersion', () => {
  return getCurrentVersion();
});

ipcMain.handle('updater:dismiss', () => {
  console.log('[Updater] Update dismissed by user');
  return true;
});

// App info handler
ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

// ============================================
// App Lifecycle
// ============================================

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
});

app.on('window-all-closed', () => {
  stopAutoUpdater();
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
