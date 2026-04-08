/**
 * Client-side token-bucket rate limiter for compile requests.
 * Prevents abuse and excessive API calls.
 */

const MAX_COMPILES = 10;
const WINDOW_MS = 60_000; // 1 minute

interface RateLimitState {
  timestamps: number[];
}

const RATE_LIMIT_KEY = 'prompt_compiler_rate_limit';

/** Check if a new compile is allowed */
export async function canCompile(): Promise<boolean> {
  const state = await getState();
  const now = Date.now();
  // Remove expired entries
  state.timestamps = state.timestamps.filter(t => now - t < WINDOW_MS);
  return state.timestamps.length < MAX_COMPILES;
}

/** Record a compile attempt */
export async function recordCompile(): Promise<void> {
  const state = await getState();
  const now = Date.now();
  state.timestamps = state.timestamps.filter(t => now - t < WINDOW_MS);
  state.timestamps.push(now);
  await chrome.storage.local.set({ [RATE_LIMIT_KEY]: state });
}

/** Get remaining compile quota */
export async function getRemainingQuota(): Promise<number> {
  const state = await getState();
  const now = Date.now();
  const active = state.timestamps.filter(t => now - t < WINDOW_MS);
  return Math.max(0, MAX_COMPILES - active.length);
}

/** Get seconds until next available slot */
export async function getResetTimeMs(): Promise<number> {
  const state = await getState();
  const now = Date.now();
  const active = state.timestamps.filter(t => now - t < WINDOW_MS);
  if (active.length < MAX_COMPILES) return 0;
  const oldest = Math.min(...active);
  return Math.max(0, WINDOW_MS - (now - oldest));
}

async function getState(): Promise<RateLimitState> {
  const result = await chrome.storage.local.get(RATE_LIMIT_KEY);
  if (result[RATE_LIMIT_KEY] && Array.isArray(result[RATE_LIMIT_KEY].timestamps)) {
    return result[RATE_LIMIT_KEY];
  }
  return { timestamps: [] };
}

export { MAX_COMPILES, WINDOW_MS };
