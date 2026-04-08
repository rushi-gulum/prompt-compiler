import type { CompiledPrompt, PromptSection, QualityLabel } from '../../engine/types.js';
import type {
  ExtensionResponse,
  CompileSuccessResponse,
  HistoryEntry,
} from '../shared/messages.js';
import {
  getSettings,
  updateSettings,
  getHistory,
  addHistoryEntry,
  toggleStarHistory,
  searchHistory,
  clearHistory,
  submitFeedback,
  getFeedback,
  exportAllData,
} from '../shared/settings.js';
import { applyTheme, watchSystemTheme } from '../shared/theme.js';
import type { Theme } from '../shared/theme.js';

// ─── Types ──────────────────────────────────────────────────────────────
type ViewName = 'chat' | 'history';

interface PopupState {
  currentResult: CompiledPrompt | null;
  lastInput: string;
  lastHistoryId: string | null;
  activeTab: PromptSection | 'full' | 'compare';
  activeView: ViewName;
  historyEntries: HistoryEntry[];
  onboardingComplete: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────────
const MAX_INPUT = 5000;
const TOAST_DURATION = 2000;
const WARN_THRESHOLD = 4500;
const RING_CIRCUMFERENCE = 2 * Math.PI * 34; // ≈ 213.6

// ─── DOM References ─────────────────────────────────────────────────────
const $ = (id: string) => document.getElementById(id)!;

const inputArea = $('input') as HTMLTextAreaElement;
const compileBtn = $('compile-btn') as HTMLButtonElement;
const btnIcon = compileBtn.querySelector('.btn-icon') as HTMLSpanElement;
const spinner = $('spinner') as HTMLSpanElement;
const output = $('output') as HTMLDivElement;
const charCounter = $('char-counter') as HTMLSpanElement;
const errorBanner = $('error-banner') as HTMLDivElement;
const tabBar = $('tab-bar') as HTMLDivElement;
const themeToggle = $('theme-toggle') as HTMLButtonElement;
const settingsBtn = $('settings-btn') as HTMLButtonElement;
const sidepanelBtn = $('sidepanel-btn') as HTMLButtonElement;
const copyBtn = $('copy-btn') as HTMLButtonElement;
const insertBtn = $('insert-btn') as HTMLButtonElement;
const exportJsonBtn = $('export-json-btn') as HTMLButtonElement;
const exportMdBtn = $('export-md-btn') as HTMLButtonElement;
const toast = $('toast') as HTMLDivElement;
const resultPanel = $('result-panel') as HTMLElement;
const chatMessages = $('chat-messages') as HTMLDivElement;
const inputSection = $('input-section') as HTMLDivElement;
const newPromptBtn = $('new-prompt-btn') as HTMLButtonElement;

// Quality ring
const ringFill = $('ring-fill') as unknown as SVGCircleElement;
const ringScore = $('ring-score') as HTMLSpanElement;
const ringQualityLabel = $('ring-quality-label') as HTMLSpanElement;
const qualityBreakdown = $('quality-breakdown') as HTMLDivElement;

// Metadata
const metaTask = $('meta-task') as HTMLSpanElement;
const metaDomain = $('meta-domain') as HTMLSpanElement;
const metaComplexity = $('meta-complexity') as HTMLSpanElement;
const metaTime = $('meta-time') as HTMLSpanElement;

// Compare
const compareView = $('compare-view') as HTMLDivElement;
const compareInput = $('compare-input') as HTMLDivElement;
const compareOutput = $('compare-output') as HTMLDivElement;

// Onboarding
const onboarding = $('onboarding') as HTMLDivElement;

// History
const historySearchInput = $('history-search') as HTMLInputElement;
const historyStarFilter = $('history-star-filter') as HTMLInputElement;
const historyListEl = $('history-list') as HTMLDivElement;
const historyCount = $('history-count') as HTMLSpanElement;
const clearHistoryBtn = $('clear-history-btn') as HTMLButtonElement;

// New UI elements
const offlineBadge = $('offline-badge') as HTMLSpanElement;
const feedbackUp = $('feedback-up') as HTMLButtonElement;
const feedbackDown = $('feedback-down') as HTMLButtonElement;
const exportDataBtn = $('export-data-btn') as HTMLButtonElement;
const updateBanner = $('update-banner') as HTMLDivElement;
const updateVersion = $('update-version') as HTMLSpanElement;
const updateDismiss = $('update-dismiss') as HTMLButtonElement;

// ─── State ──────────────────────────────────────────────────────────────
const state: PopupState = {
  currentResult: null,
  lastInput: '',
  lastHistoryId: null,
  activeTab: 'full',
  activeView: 'chat',
  historyEntries: [],
  onboardingComplete: true,
};

let currentTheme: Theme = 'system';

// ─── Initialization ─────────────────────────────────────────────────────
/**
 * Initializes the popup, sets up themes, and attaches event listeners.
 * This function should be called once the DOM is fully loaded.
 */
async function init(): Promise<void> {
  const settings = await getSettings();
  currentTheme = settings.theme;
  applyTheme(currentTheme);
  updateThemeIcon();

  state.onboardingComplete = settings.onboardingComplete;
  if (!state.onboardingComplete) {
    onboarding.classList.remove('hidden');
  }

  watchSystemTheme(() => {
    if (currentTheme === 'system') applyTheme('system');
  });

  state.historyEntries = await getHistory();

  attachListeners();

  // Check offline status and update banner
  checkOfflineStatus();
  checkUpdateBanner();
}

/**
 * Attaches all necessary event listeners to the DOM elements.
 */
function attachListeners(): void {
  // Chat
  inputArea.addEventListener('input', updateCharCounter);
  compileBtn.addEventListener('click', handleCompile);
  inputArea.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') handleCompile();
  });

  // Tabs & result
  tabBar.addEventListener('click', handleTabSwitch);
  document.querySelector('.quality-ring-container')?.addEventListener('click', toggleQualityBreakdown);
  copyBtn.addEventListener('click', () => copyToClipboard());
  insertBtn.addEventListener('click', handleInsert);
  exportJsonBtn.addEventListener('click', exportJSON);
  exportMdBtn.addEventListener('click', exportMarkdown);
  newPromptBtn.addEventListener('click', handleNewPrompt);

  // Header
  themeToggle.addEventListener('click', cycleTheme);
  settingsBtn.addEventListener('click', openOptions);
  sidepanelBtn.addEventListener('click', openSidePanel);

  // View navigation
  document.querySelectorAll('.view-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      switchView((btn as HTMLElement).dataset.view as ViewName);
    });
  });

  // Onboarding
  onboarding.querySelectorAll('.onboard-btn[data-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      goToOnboardStep(Number((btn as HTMLElement).dataset.step));
    });
  });
  $('onboard-finish')?.addEventListener('click', finishOnboarding);

  // History
  historySearchInput.addEventListener('input', debounce(handleHistorySearch, 300));
  historyStarFilter.addEventListener('change', handleHistorySearch);
  clearHistoryBtn.addEventListener('click', handleClearHistory);

  // Feedback
  feedbackUp.addEventListener('click', () => handleFeedback(true));
  feedbackDown.addEventListener('click', () => handleFeedback(false));

  // Import/Export
  exportDataBtn.addEventListener('click', handleExportData);

  // Update banner
  updateDismiss.addEventListener('click', dismissUpdateBanner);
}

// ─── Utils ──────────────────────────────────────────────────────────────
/**
 * Debounce a function call.
 * @param func The function to debounce.
 * @param delay The delay in milliseconds.
 * @returns The debounced function.
 */
function debounce<T extends (...args: unknown[]) => void>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timeout: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), delay);
  };
}

// ─── View Switching ─────────────────────────────────────────────────────
function switchView(view: ViewName): void {
  state.activeView = view;
  document.querySelectorAll('.view-tab').forEach((btn) => {
    (btn as HTMLElement).classList.toggle('active', (btn as HTMLElement).dataset.view === view);
  });
  (['chat', 'history'] as ViewName[]).forEach((v) => {
    $(`view-${v}`).classList.toggle('hidden', v !== view);
  });

  if (view === 'chat') {
    if (state.currentResult) {
      chatMessages.classList.add('hidden');
      inputSection.classList.add('hidden');
      resultPanel.classList.remove('hidden');
    } else {
      chatMessages.classList.remove('hidden');
      inputSection.classList.remove('hidden');
      resultPanel.classList.add('hidden');
    }
  }
  if (view === 'history') {
    resultPanel.classList.add('hidden');
    chatMessages.classList.add('hidden');
    inputSection.classList.add('hidden');
    renderHistoryList();
  }
}

// ─── Onboarding ─────────────────────────────────────────────────────────
function goToOnboardStep(step: number): void {
  onboarding.querySelectorAll('.onboard-step').forEach((el) => el.classList.add('hidden'));
  $(`onboard-step-${step}`)?.classList.remove('hidden');
  onboarding.querySelectorAll('.dot').forEach((dot) => {
    (dot as HTMLElement).classList.toggle('active', (dot as HTMLElement).dataset.dot === String(step));
  });
}

async function finishOnboarding(): Promise<void> {
  state.onboardingComplete = true;
  onboarding.classList.add('hidden');
  await updateSettings({ onboardingComplete: true });
}

// ─── Character Counter ──────────────────────────────────────────────────
function updateCharCounter(): void {
  const len = inputArea.value.length;
  charCounter.textContent = `${len} / ${MAX_INPUT}`;
  charCounter.className = '';
  if (len >= MAX_INPUT) {
    charCounter.className = 'error';
  } else if (len >= WARN_THRESHOLD) {
    charCounter.className = 'warning';
  }
}

// ─── Compile ────────────────────────────────────────────────────────────
async function handleCompile(): Promise<void> {
  const rawIdea = inputArea.value.trim();
  if (!rawIdea) {
    showError('Please enter your idea before compiling.');
    return;
  }

  state.lastInput = rawIdea;
  setCompiling(true);
  hideError();

  try {
    const response: ExtensionResponse = await chrome.runtime.sendMessage({
      action: 'compile',
      payload: { rawIdea },
    });

    if (response.success && 'data' in response) {
      const data = (response as CompileSuccessResponse).data;
      state.currentResult = data;
      renderResult(data);
      await addHistoryEntry(rawIdea, data);
      state.historyEntries = await getHistory();
      // Set last history ID for feedback
      state.lastHistoryId = state.historyEntries.length > 0 ? state.historyEntries[0].id : null;
      resetFeedbackButtons();
    } else if (!response.success && 'error' in response) {
      showError(response.error.message);
    }
  } catch {
    showError('Failed to communicate with the extension. Please try again.');
  } finally {
    setCompiling(false);
  }
}

function setCompiling(active: boolean): void {
  compileBtn.disabled = active;
  spinner.classList.toggle('hidden', !active);
  btnIcon.classList.toggle('hidden', active);
}

// ─── Chat Bubbles ───────────────────────────────────────────────────────
function addChatBubble(text: string, type: 'user' | 'bot'): void {
  // Remove welcome message if present
  const welcome = chatMessages.querySelector('.chat-welcome');
  if (welcome) welcome.remove();

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${type}`;
  const label = document.createElement('div');
  label.className = 'bubble-label';
  label.textContent = type === 'user' ? 'You' : 'Prompt Compiler';
  bubble.appendChild(label);
  const content = document.createElement('div');
  content.textContent = text;
  bubble.appendChild(content);
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ─── Render Result ──────────────────────────────────────────────────────
function renderResult(data: CompiledPrompt): void {
  // Hide input area, show result only
  chatMessages.classList.add('hidden');
  inputSection.classList.add('hidden');
  state.activeTab = 'full';
  updateTabDisplay();
  renderOutputForTab(data);
  renderMetadata(data);
  renderQualityRing(data);
  resultPanel.classList.remove('hidden');
}

function renderOutputForTab(data: CompiledPrompt): void {
  if (state.activeTab === 'compare') {
    output.classList.add('hidden');
    compareView.classList.remove('hidden');
    compareInput.textContent = state.lastInput;
    compareOutput.textContent = data.assembled_prompt;
  } else {
    output.classList.remove('hidden');
    compareView.classList.add('hidden');
    if (state.activeTab === 'full') {
      output.textContent = data.assembled_prompt;
    } else {
      output.textContent = data.sections[state.activeTab as PromptSection] || '(empty section)';
    }
  }
}

function renderMetadata(data: CompiledPrompt): void {
  metaTask.textContent = data.metadata.task_type;
  metaDomain.textContent = data.metadata.domain;
  metaComplexity.textContent = data.metadata.complexity;
  metaTime.textContent = `${data.metadata.processing_time_ms}ms`;
}

// ─── Quality Ring ───────────────────────────────────────────────────────
function renderQualityRing(data: CompiledPrompt): void {
  const score = data.quality_score;
  const label = data.quality_label;
  const offset = RING_CIRCUMFERENCE - (score / 24) * RING_CIRCUMFERENCE;

  ringFill.style.strokeDashoffset = String(offset);
  ringFill.style.stroke = `var(--ring-${label})`;
  ringScore.textContent = String(score);
  ringQualityLabel.textContent = label;
  ringQualityLabel.className = `ring-quality-label ${label}`;

  renderQualityBreakdown(data);
}

function renderQualityBreakdown(data: CompiledPrompt): void {
  const rows = Object.entries(data.quality_breakdown)
    .map(
      ([criterion, score]) =>
        `<div class="quality-row"><span class="criterion">${formatCriterion(criterion)}</span><span class="score">${score}/2</span></div>`,
    )
    .join('');
  qualityBreakdown.innerHTML = rows;
}

function formatCriterion(criterion: string): string {
  return criterion.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Tab Switching ──────────────────────────────────────────────────────
function handleTabSwitch(e: Event): void {
  const target = e.target as HTMLElement;
  if (!target.classList.contains('tab') || !target.dataset.tab) return;

  state.activeTab = target.dataset.tab as PromptSection | 'full' | 'compare';
  updateTabDisplay();
  if (state.currentResult) renderOutputForTab(state.currentResult);
}

function updateTabDisplay(): void {
  tabBar.querySelectorAll('.tab').forEach((tab) => {
    const el = tab as HTMLElement;
    el.classList.toggle('active', el.dataset.tab === state.activeTab);
  });
}

// ─── Quality Breakdown Toggle ───────────────────────────────────────────
function toggleQualityBreakdown(): void {
  qualityBreakdown.classList.toggle('hidden');
}

// ─── Error Display ──────────────────────────────────────────────────────
function showError(msg: string): void {
  errorBanner.textContent = msg;
  errorBanner.classList.remove('hidden');
}

function hideError(): void {
  errorBanner.classList.add('hidden');
}

// ─── New Prompt ───────────────────────────────────────────────────────────
function handleNewPrompt(): void {
  state.currentResult = null;
  state.lastInput = '';
  state.activeTab = 'full';
  inputArea.value = '';
  updateCharCounter();
  resultPanel.classList.add('hidden');
  chatMessages.innerHTML = '<div class="chat-welcome"><p class="welcome-text">How Can I Help You?</p><div class="shortcut-hints"><span class="shortcut-hint"><kbd>Ctrl</kbd>+<kbd>Enter</kbd> Compile</span></div></div>';
  chatMessages.classList.remove('hidden');
  inputSection.classList.remove('hidden');
  hideError();
  inputArea.focus();
}

// ─── Insert Prompt ──────────────────────────────────────────────────────
async function handleInsert(): Promise<void> {
  if (!state.currentResult) return;
  const text =
    state.activeTab === 'full' || state.activeTab === 'compare'
      ? state.currentResult.assembled_prompt
      : state.currentResult.sections[state.activeTab as PromptSection] || '';

  // Save for keyboard-shortcut insert
  await chrome.storage.local.set({ lastCompiledPrompt: text });

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) { showToast('No active tab found'); return; }
    try {
      const resp = await chrome.tabs.sendMessage(tab.id, {
        action: 'insert_prompt',
        payload: { text, submit: false },
      });
      if (resp?.success) { showToast('Inserted into page!'); return; }
    } catch { /* content script not loaded — fall through */ }
    // Fallback: inject directly into the page
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (t: string) => {
        const el =
          document.querySelector<HTMLElement>('textarea:not([hidden])') ??
          document.querySelector<HTMLElement>('div[contenteditable="true"]') ??
          document.querySelector<HTMLElement>('[contenteditable="true"]');
        if (!el) return;
        if (el.tagName === 'TEXTAREA') {
          const ns = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
          if (ns) ns.call(el, t); else (el as HTMLTextAreaElement).value = t;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          el.focus();
          el.innerHTML = '';
          const p = document.createElement('p');
          p.textContent = t;
          el.appendChild(p);
          el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
        }
        el.focus();
      },
      args: [text],
    });
    showToast('Inserted into page!');
  } catch {
    showToast('Could not insert — is the page an AI chat?');
  }
}

// ─── Clipboard ──────────────────────────────────────────────────────────
async function copyToClipboard(): Promise<void> {
  if (!state.currentResult) return;
  const text =
    state.activeTab === 'full' || state.activeTab === 'compare'
      ? state.currentResult.assembled_prompt
      : state.currentResult.sections[state.activeTab as PromptSection] || '';
  await navigator.clipboard.writeText(text);
  showToast('Copied to clipboard!');
}

// ─── Export ─────────────────────────────────────────────────────────────
const WATERMARK = '\n\n---\nPowered by Prompt Compiler';

function exportJSON(): void {
  if (!state.currentResult) return;
  const payload = { ...state.currentResult, _watermark: 'Powered by Prompt Compiler' };
  downloadFile(
    JSON.stringify(payload, null, 2),
    'prompt-compiled.json',
    'application/json',
  );
  showToast('Exported as JSON');
}

function exportMarkdown(): void {
  if (!state.currentResult) return;
  const data = state.currentResult;
  const md = data.assembled_prompt;
  downloadFile(md, 'prompt-compiled.md', 'text/markdown');
  showToast('Exported as Markdown');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── History ────────────────────────────────────────────────────────────
async function renderHistoryList(): Promise<void> {
  const entries = state.historyEntries;
  historyCount.textContent = `${entries.length} entries`;
  if (entries.length === 0) {
    historyListEl.innerHTML = '<div class="empty-state">No history yet. Compile your first prompt!</div>';
    return;
  }
  historyListEl.innerHTML = entries
    .map(
      (entry) => `<div class="history-item" data-id="${escapeAttr(entry.id)}">
        <button class="star-btn ${entry.starred ? 'starred' : ''}" data-action="star" title="Star">★</button>
        <span class="input-preview">${escapeHtml(entry.input)}</span>
        <div class="item-meta">
          <span class="item-badge" style="background:var(--badge-${entry.result.quality_label})">${entry.result.quality_score}</span>
          <span class="item-date">${formatDate(entry.timestamp)}</span>
        </div>
      </div>`,
    )
    .join('');

  historyListEl.querySelectorAll('.history-item').forEach((el) => {
    el.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const id = (el as HTMLElement).dataset.id!;
      if (target.dataset.action === 'star') return handleToggleStar(id);
      loadHistoryEntry(id);
    });
  });
}

function loadHistoryEntry(id: string): void {
  const entry = state.historyEntries.find((h) => h.id === id);
  if (!entry) return;
  switchView('chat');
  state.lastInput = entry.input;
  state.currentResult = entry.result;
  renderResult(entry.result);
}

async function handleToggleStar(id: string): Promise<void> {
  await toggleStarHistory(id);
  state.historyEntries = await getHistory();
  await renderHistoryList();
}

async function handleHistorySearch(): Promise<void> {
  const query = historySearchInput.value.trim();
  const starredOnly = historyStarFilter.checked;

  if (!query && !starredOnly) {
    state.historyEntries = await getHistory();
  } else {
    state.historyEntries = await searchHistory(query, undefined, starredOnly);
  }
  await renderHistoryList();
}

async function handleClearHistory(): Promise<void> {
  await clearHistory();
  state.historyEntries = [];
  await renderHistoryList();
  showToast('History cleared');
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ─── Theme ──────────────────────────────────────────────────────────────
function cycleTheme(): void {
  const order: Theme[] = ['light', 'dark', 'system'];
  const idx = order.indexOf(currentTheme);
  currentTheme = order[(idx + 1) % order.length];
  applyTheme(currentTheme);
  updateThemeIcon();
  updateSettings({ theme: currentTheme });
}

function updateThemeIcon(): void {
  const icons: Record<Theme, string> = { light: '☀', dark: '🌙', system: '🔄' };
  themeToggle.textContent = icons[currentTheme];
}

// ─── Side Panel ─────────────────────────────────────────────────────────
async function openSidePanel(): Promise<void> {
  try {
    // Chrome Side Panel API
    if (chrome.sidePanel) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await (chrome.sidePanel as any).open({ tabId: tab.id });
        window.close();
      }
    }
  } catch {
    showToast('Side panel not supported');
  }
}

// ─── Settings ───────────────────────────────────────────────────────────
function openOptions(): void {
  chrome.runtime.openOptionsPage();
}

// ─── Toast ──────────────────────────────────────────────────────────────
function showToast(msg: string): void {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  toast.classList.add('visible');
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.classList.add('hidden'), 200);
  }, TOAST_DURATION);
}

// ─── Utilities ──────────────────────────────────────────────────────────
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttr(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

// ─── Offline Status ─────────────────────────────────────────────────────
async function checkOfflineStatus(): Promise<void> {
  try {
    const settings = await getSettings();
    if (!settings.llmEnabled || !settings.groqApiKey) {
      offlineBadge.classList.remove('hidden');
      return;
    }
    const response = await chrome.runtime.sendMessage({ action: 'test_groq_connection' });
    if (response?.connected) {
      offlineBadge.classList.add('hidden');
    } else {
      offlineBadge.classList.remove('hidden');
    }
  } catch {
    offlineBadge.classList.remove('hidden');
  }
}

// ─── Feedback ───────────────────────────────────────────────────────────
async function handleFeedback(isPositive: boolean): Promise<void> {
  if (!state.lastHistoryId) return;
  await submitFeedback(state.lastHistoryId, isPositive);
  feedbackUp.classList.toggle('selected', isPositive);
  feedbackDown.classList.toggle('selected', !isPositive);
  showToast(isPositive ? 'Thanks for the feedback!' : 'We\'ll improve!');
}

function resetFeedbackButtons(): void {
  feedbackUp.classList.remove('selected');
  feedbackDown.classList.remove('selected');
}

// ─── Import/Export ──────────────────────────────────────────────────────
async function handleExportData(): Promise<void> {
  try {
    const data = await exportAllData();
    downloadFile(data, 'prompt-compiler-backup.json', 'application/json');
    showToast('Data exported!');
  } catch {
    showToast('Export failed');
  }
}


// ─── Update Banner ──────────────────────────────────────────────────────
async function checkUpdateBanner(): Promise<void> {
  try {
    const result = await chrome.storage.local.get('prompt_compiler_update');
    const update = result.prompt_compiler_update;
    if (update && update.version) {
      updateVersion.textContent = update.version;
      updateBanner.classList.remove('hidden');
    }
  } catch {
    // Ignore
  }
}

async function dismissUpdateBanner(): Promise<void> {
  updateBanner.classList.add('hidden');
  await chrome.storage.local.remove('prompt_compiler_update');
}

// ─── Boot ───────────────────────────────────────────────────────────────
const isTestEnvironment = typeof (globalThis as { jest?: unknown }).jest !== 'undefined';
if (!isTestEnvironment) {
  void init();
}

// Export for testing
export {
  init,
  handleCompile,
  updateCharCounter,
  renderResult,
  showError,
  hideError,
  copyToClipboard,
  exportJSON,
  exportMarkdown,
  showToast,
  switchView,
  renderHistoryList,
  checkOfflineStatus,
  handleFeedback,
  handleExportData,
  state,
  MAX_INPUT,
};
