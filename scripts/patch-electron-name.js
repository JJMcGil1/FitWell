#!/usr/bin/env node
/**
 * Patches Electron's Info.plist to show "FitWell" in the macOS dock during development.
 *
 * This script runs after npm install to ensure the dock name is correct.
 * Without this patch, macOS shows "Electron" because it reads the name
 * from the Electron binary's bundle, not from app.setName().
 */

const fs = require('fs');
const path = require('path');

const plistPath = path.join(
  __dirname,
  '../node_modules/electron/dist/Electron.app/Contents/Info.plist'
);

// Only run on macOS
if (process.platform !== 'darwin') {
  console.log('Skipping Electron name patch (not macOS)');
  process.exit(0);
}

if (!fs.existsSync(plistPath)) {
  console.log('Electron Info.plist not found, skipping patch');
  process.exit(0);
}

try {
  let content = fs.readFileSync(plistPath, 'utf8');

  // Replace CFBundleDisplayName
  content = content.replace(
    /<key>CFBundleDisplayName<\/key>\s*<string>Electron<\/string>/,
    '<key>CFBundleDisplayName</key>\n\t<string>FitWell</string>'
  );

  // Replace CFBundleName
  content = content.replace(
    /<key>CFBundleName<\/key>\s*<string>Electron<\/string>/,
    '<key>CFBundleName</key>\n\t<string>FitWell</string>'
  );

  fs.writeFileSync(plistPath, content);
  console.log('✓ Patched Electron dock name to "FitWell"');
} catch (err) {
  console.error('Failed to patch Electron Info.plist:', err.message);
  process.exit(1);
}
