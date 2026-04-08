import type { UserSettings, HistoryEntry, FeedbackEntry } from './messages.js';

export const DEFAULT_SETTINGS: UserSettings = {
  defaultAudienceLevel: 'professional',
  preferredDomain: null,
  theme: 'system',
  enableContentScript: true,
  keyboardShortcut: 'Ctrl+Shift+P',
  onboardingComplete: false,
  enableContextMenu: true,
  enableSidePanel: false,
  groqApiKey: '',
  llmEnabled: false,
  llmModel: 'llama-3.3-70b-versatile',
  compileTimeoutMs: 10000,
};

const STORAGE_KEY = 'prompt_compiler_settings';
const HISTORY_KEY = 'prompt_compiler_history';
const FEEDBACK_KEY = 'prompt_compiler_feedback';
const SECURE_KEY_STORAGE = 'prompt_compiler_secure_key';
const MAX_HISTORY = 200;

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<UserSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const settings = result[STORAGE_KEY]
    ? { ...DEFAULT_SETTINGS, ...result[STORAGE_KEY] }
    : { ...DEFAULT_SETTINGS };

  // Migrate API key from local to session storage if present
  if (settings.groqApiKey) {
    await setSecureKey(settings.groqApiKey);
    settings.groqApiKey = '';
    await chrome.storage.local.set({ [STORAGE_KEY]: settings });
  }

  // Read API key from session storage
  settings.groqApiKey = await getSecureKey();
  return settings;
}

export async function updateSettings(partial: Partial<UserSettings>): Promise<void> {
  // Handle API key separately — store in session storage
  if (partial.groqApiKey !== undefined) {
    await setSecureKey(partial.groqApiKey);
    partial = { ...partial, groqApiKey: '' }; // Don't persist key in local storage
  }

  const current = await chrome.storage.local.get(STORAGE_KEY);
  const existing = current[STORAGE_KEY] ?? DEFAULT_SETTINGS;
  const updated = { ...existing, ...partial };
  await chrome.storage.local.set({ [STORAGE_KEY]: updated });
}

export async function initDefaults(): Promise<void> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  if (!result[STORAGE_KEY]) {
    await chrome.storage.local.set({ [STORAGE_KEY]: { ...DEFAULT_SETTINGS, groqApiKey: '' } });
  }
}

export async function resetToDefaults(): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: { ...DEFAULT_SETTINGS, groqApiKey: '' } });
  await setSecureKey('');
}

// ─── Secure Key Storage (session-scoped, encrypted) ─────────────────────────

/** Store API key in chrome.storage.session (encrypted, session-scoped) */
async function setSecureKey(key: string): Promise<void> {
  try {
    if (chrome.storage.session) {
      await chrome.storage.session.set({ [SECURE_KEY_STORAGE]: key });
    } else {
      // Fallback for environments without session storage (e.g., tests)
      await chrome.storage.local.set({ [SECURE_KEY_STORAGE]: key });
    }
  } catch {
    // Fallback to local storage if session storage fails
    await chrome.storage.local.set({ [SECURE_KEY_STORAGE]: key });
  }
}

/** Read API key from chrome.storage.session */
async function getSecureKey(): Promise<string> {
  try {
    if (chrome.storage.session) {
      const result = await chrome.storage.session.get(SECURE_KEY_STORAGE);
      if (result[SECURE_KEY_STORAGE]) return result[SECURE_KEY_STORAGE];
    }
  } catch {
    // Fall through to local storage
  }
  // Fallback: check local storage
  const result = await chrome.storage.local.get(SECURE_KEY_STORAGE);
  return result[SECURE_KEY_STORAGE] ?? '';
}

// ─── History ─────────────────────────────────────────────────────────────────

export async function getHistory(): Promise<HistoryEntry[]> {
  const result = await chrome.storage.local.get(HISTORY_KEY);
  return result[HISTORY_KEY] ?? [];
}

export async function addHistoryEntry(input: string, result: import('../../engine/types.js').CompiledPrompt): Promise<void> {
  const history = await getHistory();
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    input,
    result,
    timestamp: Date.now(),
    starred: false,
  };
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  await chrome.storage.local.set({ [HISTORY_KEY]: history });
}

export async function toggleStarHistory(id: string): Promise<void> {
  const history = await getHistory();
  const entry = history.find((h) => h.id === id);
  if (entry) {
    entry.starred = !entry.starred;
    await chrome.storage.local.set({ [HISTORY_KEY]: history });
  }
}

export async function searchHistory(
  query: string,
  domain: string | undefined,
  starredOnly?: boolean,
): Promise<HistoryEntry[]> {
  let history = await getHistory();
  if (starredOnly) {
    history = history.filter((h) => h.starred);
  }
  if (domain) {
    history = history.filter((h) => h.result.metadata.domain === domain);
  }
  if (query) {
    const q = query.toLowerCase();
    history = history.filter(
      (h) =>
        h.input.toLowerCase().includes(q) ||
        h.result.assembled_prompt.toLowerCase().includes(q),
    );
  }
  return history;
}

export async function clearHistory(): Promise<void> {
  await chrome.storage.local.set({ [HISTORY_KEY]: [] });
}

// ─── Feedback ────────────────────────────────────────────────────────────────

export async function submitFeedback(historyId: string, isPositive: boolean): Promise<void> {
  const result = await chrome.storage.local.get(FEEDBACK_KEY);
  const feedback: FeedbackEntry[] = result[FEEDBACK_KEY] ?? [];
  // Remove existing feedback for this entry
  const filtered = feedback.filter(f => f.historyId !== historyId);
  filtered.unshift({
    historyId,
    isPositive,
    timestamp: Date.now(),
  });
  if (filtered.length > MAX_HISTORY) filtered.length = MAX_HISTORY;
  await chrome.storage.local.set({ [FEEDBACK_KEY]: filtered });
}

export async function getFeedback(historyId: string): Promise<FeedbackEntry | null> {
  const result = await chrome.storage.local.get(FEEDBACK_KEY);
  const feedback: FeedbackEntry[] = result[FEEDBACK_KEY] ?? [];
  return feedback.find(f => f.historyId === historyId) ?? null;
}

// ─── Import / Export ─────────────────────────────────────────────────────────

export async function exportAllData(): Promise<string> {
  const settings = await getSettings();
  const history = await getHistory();
  return JSON.stringify({
    version: '2.0.0',
    exported_at: new Date().toISOString(),
    settings: { ...settings, groqApiKey: '' }, // Never export API key
    history,
  }, null, 2);
}
