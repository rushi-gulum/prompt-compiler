import type { UserSettings, HistoryEntry, FeedbackEntry } from './messages.js';

export const DEFAULT_SETTINGS: UserSettings = {
  defaultAudienceLevel: 'professional',
  defaultCompilationLevel: 'auto',
  preferredDomain: null,
  theme: 'system',
  enableContentScript: true,
  keyboardShortcut: 'Ctrl+Shift+P',
  onboardingComplete: false,
  enableContextMenu: true,
  enableSidePanel: false,
  llmProvider: 'groq',
  groqApiKey: '',
  geminiApiKey: '',
  openaiApiKey: '',
  llmEnabled: false,
  llmModel: 'llama-3.3-70b-versatile',
  compileTimeoutMs: 10000,
};

const STORAGE_KEY = 'prompt_compiler_settings';
const HISTORY_KEY = 'prompt_compiler_history';
const FEEDBACK_KEY = 'prompt_compiler_feedback';
const SECURE_KEY_STORAGE = 'prompt_compiler_secure_key';
const SECURE_GEMINI_KEY_STORAGE = 'prompt_compiler_secure_gemini_key';
const SECURE_OPENAI_KEY_STORAGE = 'prompt_compiler_secure_openai_key';
const MAX_HISTORY = 200;

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<UserSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const settings = result[STORAGE_KEY]
    ? { ...DEFAULT_SETTINGS, ...result[STORAGE_KEY] }
    : { ...DEFAULT_SETTINGS };

  // Read API keys securely
  settings.groqApiKey = await getSecureKey(SECURE_KEY_STORAGE);
  settings.geminiApiKey = await getSecureKey(SECURE_GEMINI_KEY_STORAGE);
  settings.openaiApiKey = await getSecureKey(SECURE_OPENAI_KEY_STORAGE);
  return settings;
}

export async function updateSettings(partial: Partial<UserSettings>): Promise<void> {
  const cleanPartial = { ...partial };

  // Handle API keys separately — store in session/secure storage
  if (cleanPartial.groqApiKey !== undefined) {
    await setSecureKey(SECURE_KEY_STORAGE, cleanPartial.groqApiKey);
    cleanPartial.groqApiKey = '';
  }
  if (cleanPartial.geminiApiKey !== undefined) {
    await setSecureKey(SECURE_GEMINI_KEY_STORAGE, cleanPartial.geminiApiKey);
    cleanPartial.geminiApiKey = '';
  }
  if (cleanPartial.openaiApiKey !== undefined) {
    await setSecureKey(SECURE_OPENAI_KEY_STORAGE, cleanPartial.openaiApiKey);
    cleanPartial.openaiApiKey = '';
  }

  const current = await chrome.storage.local.get(STORAGE_KEY);
  const existing = current[STORAGE_KEY] ?? DEFAULT_SETTINGS;
  const updated = { ...existing, ...cleanPartial };
  await chrome.storage.local.set({ [STORAGE_KEY]: updated });
}

export async function initDefaults(): Promise<void> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  if (!result[STORAGE_KEY]) {
    await chrome.storage.local.set({ [STORAGE_KEY]: { ...DEFAULT_SETTINGS } });
  }
}

export async function resetToDefaults(): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: { ...DEFAULT_SETTINGS } });
  await setSecureKey(SECURE_KEY_STORAGE, '');
  await setSecureKey(SECURE_GEMINI_KEY_STORAGE, '');
  await setSecureKey(SECURE_OPENAI_KEY_STORAGE, '');
}

// ─── Secure Key Storage (session-scoped, encrypted) ─────────────────────────

/** Store API key in chrome.storage.session (encrypted, session-scoped) */
async function setSecureKey(storageKey: string, key: string): Promise<void> {
  try {
    if (chrome.storage?.session) {
      await chrome.storage.session.set({ [storageKey]: key });
    } else {
      await chrome.storage.local.set({ [storageKey]: key });
    }
  } catch {
    await chrome.storage.local.set({ [storageKey]: key });
  }
}

/** Read API key from chrome.storage.session */
async function getSecureKey(storageKey: string): Promise<string> {
  try {
    if (chrome.storage?.session) {
      const result = await chrome.storage.session.get(storageKey);
      if (result[storageKey]) return result[storageKey];
    }
  } catch {
    // Fall through to local storage
  }
  const result = await chrome.storage.local.get(storageKey);
  return result[storageKey] ?? '';
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

export interface FeedbackStats {
  totalRatings: number;
  positiveRatings: number;
  negativeRatings: number;
  satisfactionRate: number; // 0 to 1
  taskPerformance: Record<string, { positive: number; total: number }>;
}

/** Aggregate ratings by task type to close the feedback loop */
export async function getFeedbackStats(): Promise<FeedbackStats> {
  const result = await chrome.storage.local.get([FEEDBACK_KEY, HISTORY_KEY]);
  const feedback: FeedbackEntry[] = result[FEEDBACK_KEY] ?? [];
  const history: HistoryEntry[] = result[HISTORY_KEY] ?? [];

  const historyMap = new Map(history.map(h => [h.id, h]));
  let positive = 0;
  const taskPerformance: Record<string, { positive: number; total: number }> = {};

  for (const f of feedback) {
    if (f.isPositive) positive++;
    const h = historyMap.get(f.historyId);
    if (h) {
      const task = h.result.metadata.task_type;
      if (!taskPerformance[task]) {
        taskPerformance[task] = { positive: 0, total: 0 };
      }
      taskPerformance[task].total++;
      if (f.isPositive) {
        taskPerformance[task].positive++;
      }
    }
  }

  const total = feedback.length;
  return {
    totalRatings: total,
    positiveRatings: positive,
    negativeRatings: total - positive,
    satisfactionRate: total > 0 ? positive / total : 1.0,
    taskPerformance,
  };
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
