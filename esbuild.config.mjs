// esbuild.config.mjs — Chrome Extension build configuration
import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, cpSync, existsSync } from 'fs';

const isDev = process.argv.includes('--dev');

// ─── Common options ──────────────────────────────────────────
const common = {
  bundle: true,
  minify: !isDev,
  sourcemap: isDev,
  target: 'chrome116',
  logLevel: 'info',
};

// ─── Background (service worker — ESM for MV3) ──────────────
await esbuild.build({
  ...common,
  entryPoints: ['src/extension/background/service-worker.ts'],
  outfile: 'dist/background.js',
  format: 'esm',
});

// ─── Popup ───────────────────────────────────────────────────
await esbuild.build({
  ...common,
  entryPoints: ['src/extension/popup/popup.ts'],
  outfile: 'dist/popup/popup.js',
  format: 'iife',
});

// ─── Content Script ──────────────────────────────────────────
await esbuild.build({
  ...common,
  entryPoints: ['src/extension/content/content.ts'],
  outfile: 'dist/content.js',
  format: 'iife',
});

// ─── Options ─────────────────────────────────────────────────
await esbuild.build({
  ...common,
  entryPoints: ['src/extension/options/options.ts'],
  outfile: 'dist/options/options.js',
  format: 'iife',
});

// ─── Side Panel ──────────────────────────────────────────────
await esbuild.build({
  ...common,
  entryPoints: ['src/extension/sidepanel/sidepanel.ts'],
  outfile: 'dist/sidepanel/sidepanel.js',
  format: 'iife',
});

// ─── Static Assets ───────────────────────────────────────────
mkdirSync('dist/popup', { recursive: true });
mkdirSync('dist/options', { recursive: true });
mkdirSync('dist/sidepanel', { recursive: true });
mkdirSync('dist/icons', { recursive: true });

copyFileSync('src/extension/manifest.json', 'dist/manifest.json');
copyFileSync('src/extension/popup/popup.html', 'dist/popup/popup.html');
copyFileSync('src/extension/popup/popup.css', 'dist/popup/popup.css');
copyFileSync('src/extension/options/options.html', 'dist/options/options.html');
copyFileSync('src/extension/options/options.css', 'dist/options/options.css');
copyFileSync('src/extension/sidepanel/sidepanel.html', 'dist/sidepanel/sidepanel.html');

if (existsSync('src/extension/icons')) {
  cpSync('src/extension/icons', 'dist/icons', { recursive: true });
}
if (existsSync('src/extension/_locales')) {
  cpSync('src/extension/_locales', 'dist/_locales', { recursive: true });
}

console.log('✓ Build complete');
