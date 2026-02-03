/**
 * Custom Auto-Updater with SHA256 Hash Verification
 *
 * Self-signing approach: Instead of code signing certificates ($$$),
 * we verify downloaded files using SHA256 hashes generated during build.
 *
 * Flow:
 * 1. Fetch latest release from GitHub API
 * 2. Compare versions
 * 3. Download update file
 * 4. Verify SHA256 hash matches latest.json
 * 5. Install update
 */

import { app, BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as https from 'https';
import * as http from 'http';
import { spawn, execSync } from 'child_process';

// ============================================
// Configuration
// ============================================

const UPDATE_CONFIG = {
  owner: 'JJMcGil1',
  repo: 'FitWell',
  checkInterval: 5 * 60 * 1000, // Check every 5 minutes
  autoCheck: true,
};

// ============================================
// Types
// ============================================

export interface GitHubAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

export interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  assets: GitHubAsset[];
}

export interface PlatformHash {
  sha256: string;
  size: number;
}

export interface LatestJson {
  version: string;
  releaseDate: string;
  releaseNotes: string;
  platforms: {
    mac?: PlatformHash;
    'mac-arm64'?: PlatformHash;
    'mac-x64'?: PlatformHash;
    win?: PlatformHash;
    linux?: PlatformHash;
  };
}

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes: string;
  currentVersion: string;
  url: string;
  sha256: string;
  size: number;
}

export interface UpdateCheckResult {
  updateAvailable: boolean;
  updateInfo?: UpdateInfo;
  error?: string;
}

export interface DownloadProgress {
  percent: number;
  transferred: number;
  total: number;
  bytesPerSecond: number;
}

// ============================================
// State
// ============================================

let mainWindow: BrowserWindow | null = null;
let currentUpdateInfo: UpdateInfo | null = null;
let downloadedFilePath: string | null = null;
let isDownloading = false;
let checkInterval: ReturnType<typeof setInterval> | null = null;

// ============================================
// Helper Functions
// ============================================

function getCurrentVersion(): string {
  return app.getVersion();
}

function compareVersions(a: string, b: string): number {
  const partsA = a.replace(/^v/, '').split('.').map(Number);
  const partsB = b.replace(/^v/, '').split('.').map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }
  return 0;
}

function fetchJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const options = {
      headers: {
        'User-Agent': `FitWell/${getCurrentVersion()}`,
        Accept: 'application/json',
      },
    };

    protocol
      .get(url, options, (res) => {
        // Handle redirects
        if (res.statusCode === 301 || res.statusCode === 302) {
          if (res.headers.location) {
            fetchJson<T>(res.headers.location).then(resolve).catch(reject);
            return;
          }
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }

        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

function downloadFile(
  url: string,
  destPath: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const startTime = Date.now();
    let downloadedBytes = 0;

    const options = {
      headers: {
        'User-Agent': `FitWell/${getCurrentVersion()}`,
        Accept: 'application/octet-stream',
      },
    };

    const handleResponse = (res: http.IncomingMessage) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        if (res.headers.location) {
          downloadFile(res.headers.location, destPath, onProgress)
            .then(resolve)
            .catch(reject);
          return;
        }
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
      const file = fs.createWriteStream(destPath);

      res.on('data', (chunk: Buffer) => {
        downloadedBytes += chunk.length;
        const elapsed = (Date.now() - startTime) / 1000;
        const bytesPerSecond = downloadedBytes / elapsed;

        if (onProgress) {
          onProgress({
            percent: totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0,
            transferred: downloadedBytes,
            total: totalBytes,
            bytesPerSecond,
          });
        }
      });

      res.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });

      file.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    };

    protocol.get(url, options, handleResponse).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

function calculateFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

function getPlatformKey(): string {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === 'darwin') {
    return arch === 'arm64' ? 'mac-arm64' : 'mac-x64';
  } else if (platform === 'win32') {
    return 'win';
  } else {
    return 'linux';
  }
}

function getPlatformAsset(assets: GitHubAsset[]): GitHubAsset | null {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === 'darwin') {
    // Prefer architecture-specific DMG
    const armDmg = assets.find(
      (a) => a.name.endsWith('.dmg') && a.name.includes('arm64')
    );
    const x64Dmg = assets.find(
      (a) => a.name.endsWith('.dmg') && a.name.includes('x64')
    );
    const genericDmg = assets.find(
      (a) => a.name.endsWith('.dmg') && !a.name.includes('arm64') && !a.name.includes('x64')
    );

    if (arch === 'arm64') {
      return armDmg || genericDmg || null;
    } else {
      return x64Dmg || genericDmg || null;
    }
  } else if (platform === 'win32') {
    return assets.find((a) => a.name.endsWith('.exe')) || null;
  } else {
    return assets.find((a) => a.name.endsWith('.AppImage')) || null;
  }
}

// ============================================
// Core Functions
// ============================================

export async function checkForUpdates(): Promise<UpdateCheckResult> {
  try {
    console.log('[AutoUpdater] Checking for updates...');

    // 1. Fetch latest release from GitHub
    const release = await fetchJson<GitHubRelease>(
      `https://api.github.com/repos/${UPDATE_CONFIG.owner}/${UPDATE_CONFIG.repo}/releases/latest`
    );

    const latestVersion = release.tag_name.replace(/^v/, '');
    const currentVersion = getCurrentVersion();

    console.log(`[AutoUpdater] Current: ${currentVersion}, Latest: ${latestVersion}`);

    // 2. Check if update is available
    if (compareVersions(latestVersion, currentVersion) <= 0) {
      console.log('[AutoUpdater] No update available');
      return { updateAvailable: false };
    }

    // 3. Find the right asset for this platform
    const asset = getPlatformAsset(release.assets);
    if (!asset) {
      console.log('[AutoUpdater] No compatible asset found');
      return { updateAvailable: false, error: 'No compatible download found' };
    }

    // 4. Fetch latest.json for hash verification
    const latestJsonAsset = release.assets.find((a) => a.name === 'latest.json');
    if (!latestJsonAsset) {
      console.log('[AutoUpdater] No latest.json found - falling back to no verification');
      // Proceed without hash verification (less secure but functional)
      const updateInfo: UpdateInfo = {
        version: latestVersion,
        releaseDate: release.published_at,
        releaseNotes: release.body || 'Bug fixes and improvements.',
        currentVersion,
        url: asset.browser_download_url,
        sha256: '', // No verification
        size: asset.size,
      };

      currentUpdateInfo = updateInfo;
      mainWindow?.webContents.send('update:available', { updateAvailable: true, updateInfo });

      return { updateAvailable: true, updateInfo };
    }

    const latestJson = await fetchJson<LatestJson>(latestJsonAsset.browser_download_url);
    const platformKey = getPlatformKey();

    // Try platform-specific key first, then fall back to generic
    const platformHash = latestJson.platforms[platformKey as keyof typeof latestJson.platforms]
      || latestJson.platforms.mac
      || latestJson.platforms.win
      || latestJson.platforms.linux;

    if (!platformHash) {
      console.log('[AutoUpdater] No hash found for platform:', platformKey);
      return { updateAvailable: false, error: 'No hash found for platform' };
    }

    // 5. Build update info
    const updateInfo: UpdateInfo = {
      version: latestVersion,
      releaseDate: release.published_at,
      releaseNotes: release.body || latestJson.releaseNotes || 'Bug fixes and improvements.',
      currentVersion,
      url: asset.browser_download_url,
      sha256: platformHash.sha256,
      size: platformHash.size || asset.size,
    };

    currentUpdateInfo = updateInfo;
    console.log('[AutoUpdater] Update available:', updateInfo.version);

    // Notify renderer
    mainWindow?.webContents.send('update:available', { updateAvailable: true, updateInfo });

    return { updateAvailable: true, updateInfo };
  } catch (error) {
    console.error('[AutoUpdater] Check failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    mainWindow?.webContents.send('update:error', { error: errorMessage });
    return { updateAvailable: false, error: errorMessage };
  }
}

export async function downloadUpdate(): Promise<string> {
  if (!currentUpdateInfo) {
    throw new Error('No update available to download');
  }

  if (isDownloading) {
    throw new Error('Download already in progress');
  }

  isDownloading = true;

  try {
    console.log('[AutoUpdater] Starting download:', currentUpdateInfo.url);

    // Create downloads directory
    const downloadDir = path.join(app.getPath('temp'), 'fitwell-updates');
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }

    const fileName = path.basename(currentUpdateInfo.url);
    const downloadPath = path.join(downloadDir, fileName);

    // Download with progress
    await downloadFile(currentUpdateInfo.url, downloadPath, (progress) => {
      mainWindow?.webContents.send('update:download-progress', progress);
    });

    console.log('[AutoUpdater] Download complete, verifying hash...');

    // Verify hash if we have one
    if (currentUpdateInfo.sha256) {
      const fileHash = await calculateFileHash(downloadPath);
      console.log('[AutoUpdater] Expected hash:', currentUpdateInfo.sha256);
      console.log('[AutoUpdater] Actual hash:', fileHash);

      if (fileHash.toLowerCase() !== currentUpdateInfo.sha256.toLowerCase()) {
        fs.unlinkSync(downloadPath);
        throw new Error('Hash verification failed! File may be corrupted or tampered.');
      }

      console.log('[AutoUpdater] Hash verified!');
    } else {
      console.log('[AutoUpdater] Skipping hash verification (no hash provided)');
    }

    downloadedFilePath = downloadPath;
    mainWindow?.webContents.send('update:downloaded', { path: downloadPath });

    return downloadPath;
  } finally {
    isDownloading = false;
  }
}

export async function installUpdate(): Promise<void> {
  if (!downloadedFilePath || !fs.existsSync(downloadedFilePath)) {
    throw new Error('No downloaded update to install');
  }

  console.log('[AutoUpdater] Installing update from:', downloadedFilePath);

  const platform = process.platform;

  if (platform === 'darwin') {
    await installMacUpdate(downloadedFilePath);
  } else if (platform === 'win32') {
    await installWindowsUpdate(downloadedFilePath);
  } else {
    await installLinuxUpdate(downloadedFilePath);
  }
}

async function installMacUpdate(dmgPath: string): Promise<void> {
  const mountPoint = '/Volumes/FitWell-Update';
  const appPath = '/Applications/FitWell.app';

  try {
    // Clean up any existing mount
    try {
      execSync(`hdiutil detach "${mountPoint}" -force 2>/dev/null || true`);
    } catch {
      // Ignore errors
    }

    // Mount DMG silently
    console.log('[AutoUpdater] Mounting DMG...');
    execSync(`hdiutil attach "${dmgPath}" -mountpoint "${mountPoint}" -nobrowse -quiet`);

    // Find the .app in mounted volume
    const files = fs.readdirSync(mountPoint);
    const appName = files.find((f) => f.endsWith('.app'));

    if (!appName) {
      execSync(`hdiutil detach "${mountPoint}" -quiet`);
      throw new Error('No .app found in DMG');
    }

    const newAppPath = path.join(mountPoint, appName);

    // Create update script that runs after app quits
    const scriptPath = path.join(app.getPath('temp'), 'fitwell-update.sh');
    const script = `#!/bin/bash
# Wait for app to quit
sleep 2

# Remove old app
rm -rf "${appPath}"

# Copy new app
cp -R "${newAppPath}" "${appPath}"

# Clear quarantine
xattr -cr "${appPath}" 2>/dev/null || true

# Unmount DMG
hdiutil detach "${mountPoint}" -quiet 2>/dev/null || true

# Clean up downloaded file
rm -f "${dmgPath}"

# Relaunch app
open "${appPath}"

# Clean up this script
rm -f "${scriptPath}"
`;

    fs.writeFileSync(scriptPath, script);
    fs.chmodSync(scriptPath, '755');

    // Run script detached and quit
    console.log('[AutoUpdater] Running update script and quitting...');
    spawn('/bin/bash', [scriptPath], {
      detached: true,
      stdio: 'ignore',
    }).unref();

    // Quit the app
    app.quit();
  } catch (error) {
    console.error('[AutoUpdater] macOS install failed:', error);
    try {
      execSync(`hdiutil detach "${mountPoint}" -quiet 2>/dev/null || true`);
    } catch {
      // Ignore
    }
    throw error;
  }
}

async function installWindowsUpdate(installerPath: string): Promise<void> {
  console.log('[AutoUpdater] Running Windows installer...');

  // Run NSIS installer with /S for silent mode
  spawn(installerPath, ['/S'], {
    detached: true,
    shell: true,
    stdio: 'ignore',
  }).unref();

  // Quit the app
  app.quit();
}

async function installLinuxUpdate(appImagePath: string): Promise<void> {
  const currentAppImage = process.env.APPIMAGE;

  if (!currentAppImage) {
    throw new Error('Not running from AppImage');
  }

  console.log('[AutoUpdater] Replacing AppImage...');

  // Make new AppImage executable
  fs.chmodSync(appImagePath, '755');

  // Create update script
  const scriptPath = path.join(app.getPath('temp'), 'fitwell-update.sh');
  const script = `#!/bin/bash
sleep 2
cp "${appImagePath}" "${currentAppImage}"
chmod +x "${currentAppImage}"
rm -f "${appImagePath}"
"${currentAppImage}" &
rm -f "${scriptPath}"
`;

  fs.writeFileSync(scriptPath, script);
  fs.chmodSync(scriptPath, '755');

  spawn('/bin/bash', [scriptPath], {
    detached: true,
    stdio: 'ignore',
  }).unref();

  app.quit();
}

// ============================================
// Public API
// ============================================

export function initAutoUpdater(window: BrowserWindow): void {
  mainWindow = window;

  // Don't run in dev mode
  if (!app.isPackaged) {
    console.log('[AutoUpdater] Skipping in dev mode');
    return;
  }

  console.log('[AutoUpdater] Initializing...');

  // Auto-check after 5 seconds
  if (UPDATE_CONFIG.autoCheck) {
    setTimeout(() => {
      checkForUpdates().catch(console.error);
    }, 5000);
  }

  // Periodic checks
  if (UPDATE_CONFIG.checkInterval > 0) {
    checkInterval = setInterval(() => {
      checkForUpdates().catch(console.error);
    }, UPDATE_CONFIG.checkInterval);
  }
}

export function stopAutoUpdater(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}

export function getUpdateInfo(): UpdateInfo | null {
  return currentUpdateInfo;
}

export function getDownloadedPath(): string | null {
  return downloadedFilePath;
}

export { getCurrentVersion };
