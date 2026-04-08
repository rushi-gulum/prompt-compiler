/**
 * Structured error reporter for production diagnostics.
 * Stores errors locally in chrome.storage.local with a cap.
 * Provides export capability for debugging.
 */

export interface ErrorLogEntry {
  id: string;
  timestamp: number;
  source: 'compile' | 'llm' | 'content_script' | 'settings' | 'unknown';
  code: string;
  message: string;
  context?: Record<string, unknown>;
}

const ERROR_LOG_KEY = 'prompt_compiler_error_log';
const MAX_ENTRIES = 50;

/** Log an error to local storage */
export async function logError(
  source: ErrorLogEntry['source'],
  code: string,
  message: string,
  context?: Record<string, unknown>,
): Promise<void> {
  try {
    const entries = await getErrorLog();
    const entry: ErrorLogEntry = {
      id: generateId(),
      timestamp: Date.now(),
      source,
      code,
      message,
      context,
    };
    entries.unshift(entry);
    if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
    await chrome.storage.local.set({ [ERROR_LOG_KEY]: entries });
  } catch {
    // Silently fail — we can't log errors about error logging
  }
}

/** Get all stored error logs */
export async function getErrorLog(): Promise<ErrorLogEntry[]> {
  const result = await chrome.storage.local.get(ERROR_LOG_KEY);
  return Array.isArray(result[ERROR_LOG_KEY]) ? result[ERROR_LOG_KEY] : [];
}

/** Export error log as JSON string */
export async function exportErrorLog(): Promise<string> {
  const entries = await getErrorLog();
  return JSON.stringify({
    exported_at: new Date().toISOString(),
    extension_version: chrome.runtime?.getManifest?.()?.version ?? 'unknown',
    entries,
  }, null, 2);
}

/** Clear all stored error logs */
export async function clearErrorLog(): Promise<void> {
  await chrome.storage.local.set({ [ERROR_LOG_KEY]: [] });
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export { MAX_ENTRIES, ERROR_LOG_KEY };
