#!/usr/bin/env node

/**
 * Generate Release Hash Script
 *
 * Generates latest.json with SHA256 hashes for local testing.
 * Run this after building to test the auto-updater locally.
 *
 * Usage: node scripts/generate-release-hash.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const releaseDir = path.join(__dirname, '..', 'release');
const pkg = require(path.join(__dirname, '..', 'package.json'));

function calculateHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

async function main() {
  console.log('Generating release hashes...\n');

  if (!fs.existsSync(releaseDir)) {
    console.error('Error: release/ directory not found. Run `npm run build` first.');
    process.exit(1);
  }

  const files = fs.readdirSync(releaseDir);
  const platforms = {};

  // Process each release file
  for (const file of files) {
    const filePath = path.join(releaseDir, file);
    const stat = fs.statSync(filePath);

    if (!stat.isFile()) continue;

    let platformKey = null;

    if (file.endsWith('.dmg')) {
      if (file.includes('arm64')) {
        platformKey = 'mac-arm64';
      } else if (file.includes('x64')) {
        platformKey = 'mac-x64';
      } else {
        platformKey = 'mac';
      }
    } else if (file.endsWith('.exe')) {
      platformKey = 'win';
    } else if (file.endsWith('.AppImage')) {
      platformKey = 'linux';
    }

    if (platformKey) {
      const hash = await calculateHash(filePath);
      platforms[platformKey] = {
        sha256: hash,
        size: stat.size,
      };
      console.log(`${platformKey}: ${file}`);
      console.log(`  SHA256: ${hash}`);
      console.log(`  Size: ${(stat.size / 1024 / 1024).toFixed(2)} MB\n`);
    }
  }

  if (Object.keys(platforms).length === 0) {
    console.error('Error: No release files found (.dmg, .exe, .AppImage)');
    process.exit(1);
  }

  // Generate latest.json
  const latestJson = {
    version: pkg.version,
    releaseDate: new Date().toISOString(),
    releaseNotes: 'Local development build.',
    platforms,
  };

  const latestPath = path.join(releaseDir, 'latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(latestJson, null, 2));
  console.log(`Generated: ${latestPath}`);

  // Generate hashes.txt for manual verification
  const hashesPath = path.join(releaseDir, 'hashes.txt');
  const hashesContent = Object.entries(platforms)
    .map(([key, data]) => `${data.sha256}  ${key}`)
    .join('\n');
  fs.writeFileSync(hashesPath, hashesContent + '\n');
  console.log(`Generated: ${hashesPath}`);
}

main().catch(console.error);
