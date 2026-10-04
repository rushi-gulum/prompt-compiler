// scripts/create-dist-zip.mjs
// Creates dist.zip without external dependencies using Node.js built-in APIs
import { readdirSync, statSync, createReadStream, createWriteStream, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execSync } from 'node:child_process';

const distDir = 'dist';
const zipOutput = 'dist.zip';

if (!existsSync(distDir)) {
  console.error('Error: dist directory does not exist. Run "npm run build:ext" first.');
  process.exit(1);
}

try {
  // Use PowerShell on Windows or zip on Unix/macOS
  if (process.platform === 'win32') {
    execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${zipOutput}' -Force"`, {
      stdio: 'inherit',
    });
  } else {
    execSync(`cd ${distDir} && zip -r ../${zipOutput} .`, { stdio: 'inherit' });
  }
  console.log(`✓ Successfully created ${zipOutput}`);
} catch (err) {
  console.error(`Failed to package ${zipOutput}:`, err);
  process.exit(1);
}
