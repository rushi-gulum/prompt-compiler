import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';

const manifestPath = resolve(process.argv[2] ?? 'src/extension/manifest.json');
const manifestDir = dirname(manifestPath);

const failures = [];

let manifest;
try {
  manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to read manifest at ${manifestPath}: ${message}`);
  process.exit(1);
}

function fail(message) {
  failures.push(message);
}

if (manifest.manifest_version !== 3) {
  fail('manifest_version must be 3');
}

if (typeof manifest.version !== 'string' || !manifest.version.trim()) {
  fail('version must be a non-empty string');
}

if (typeof manifest.name !== 'string' || !manifest.name.trim()) {
  fail('name must be a non-empty string');
}

if (typeof manifest.description !== 'string' || !manifest.description.trim()) {
  fail('description must be a non-empty string');
}

const minimumChromeVersion = Number.parseInt(manifest.minimum_chrome_version ?? '', 10);
if (!Number.isFinite(minimumChromeVersion) || minimumChromeVersion < 114) {
  fail('minimum_chrome_version must be set to 114 or newer for side panel support');
}

const extensionCsp = manifest.content_security_policy?.extension_pages;
if (typeof extensionCsp !== 'string' || !extensionCsp.includes("script-src 'self'")) {
  fail('extension_pages CSP must include script-src self');
}
if (typeof extensionCsp !== 'string' || !extensionCsp.includes("object-src 'none'")) {
  fail('extension_pages CSP must include object-src none');
}
if (typeof extensionCsp === 'string' && /https?:\/\//i.test(extensionCsp)) {
  fail('extension_pages CSP must not include a remote report URI or other remote origin');
}

if (!manifest.default_locale) {
  fail('default_locale is required');
} else {
  const localePath = join(manifestDir, '_locales', manifest.default_locale, 'messages.json');
  if (!existsSync(localePath)) {
    fail(`default locale file does not exist: ${localePath}`);
  }
}

if (!manifest.action?.default_popup) {
  fail('action.default_popup is required');
}

if (!manifest.side_panel?.default_path) {
  fail('side_panel.default_path is required');
}

if (!manifest.options_ui?.page) {
  fail('options_ui.page is required');
}

if (!Array.isArray(manifest.permissions) || manifest.permissions.length === 0) {
  fail('permissions must be a non-empty array');
}

if (failures.length > 0) {
  console.error(`Manifest validation failed for ${manifestPath}`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Manifest validation passed: ${manifestPath}`);