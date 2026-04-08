/**
 * Side panel entry point — reuses popup logic but adapted for full-height panel.
 * No onboarding overlay, no side-panel button (already in panel).
 */
import type { CompiledPrompt, PromptSection } from '../../engine/types.js';
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
} from '../shared/settings.js';
import { applyTheme, watchSystemTheme } from '../shared/theme.js';
import type { Theme } from '../shared/theme.js';

type ViewName = 'chat' | 'history';

interface PanelState {
  currentResult: CompiledPrompt | null;
  lastInput: string;
  activeTab: PromptSection | 'full' | 'compare';
  activeView: ViewName;
  historyEntries: HistoryEntry[];
}

const MAX_INPUT = 5000;
const TOAST_DURATION = 2000;
const WARN_THRESHOLD = 4500;
const RING_CIRCUMFERENCE = 2 * Math.PI * 34;

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
const copyBtn = $('copy-btn') as HTMLButtonElement;
const insertBtn = $('insert-btn') as HTMLButtonElement;
const exportJsonBtn = $('export-json-btn') as HTMLButtonElement;
const exportMdBtn = $('export-md-btn') as HTMLButtonElement;
const toast = $('toast') as HTMLDivElement;
const resultPanel = $('result-panel') as HTMLElement;
const chatMessages = $('chat-messages') as HTMLDivElement;
const inputSection = $('input-section') as HTMLDivElement;
const newPromptBtn = $('new-prompt-btn') as HTMLButtonElement;
const ringFill = $('ring-fill') as unknown as SVGCircleElement;
const ringScore = $('ring-score') as HTMLSpanElement;
const ringQualityLabel = $('ring-quality-label') as HTMLSpanElement;
const qualityBreakdown = $('quality-breakdown') as HTMLDivElement;
const metaTask = $('meta-task') as HTMLSpanElement;
const metaDomain = $('meta-domain') as HTMLSpanElement;
const metaComplexity = $('meta-complexity') as HTMLSpanElement;
const metaTime = $('meta-time') as HTMLSpanElement;
const compareView = $('compare-view') as HTMLDivElement;
const compareInput = $('compare-input') as HTMLDivElement;
const compareOutput = $('compare-output') as HTMLDivElement;
const historySearchInput = $('history-search') as HTMLInputElement;
const historyStarFilter = $('history-star-filter') as HTMLInputElement;
const historyListEl = $('history-list') as HTMLDivElement;
const historyCount = $('history-count') as HTMLSpanElement;
const clearHistoryBtn = $('clear-history-btn') as HTMLButtonElement;

const state: PanelState = {
  currentResult: null,
  lastInput: '',
  activeTab: 'full',
  activeView: 'chat',
  historyEntries: [],
};

let currentTheme: Theme = 'system';

async function init(): Promise<void> {
  const settings = await getSettings();
  currentTheme = settings.theme;
  applyTheme(currentTheme);
  updateThemeIcon();
  watchSystemTheme(() => { if (currentTheme === 'system') applyTheme('system'); });
  state.historyEntries = await getHistory();
  attachListeners();
}

function attachListeners(): void {
  inputArea.addEventListener('input', updateCharCounter);
  compileBtn.addEventListener('click', handleCompile);
  inputArea.addEventListener('keydown', (e) => { if (e.ctrlKey && e.key === 'Enter') handleCompile(); });
  tabBar.addEventListener('click', handleTabSwitch);
  document.querySelector('.quality-ring-container')?.addEventListener('click', () => qualityBreakdown.classList.toggle('hidden'));
  copyBtn.addEventListener('click', copyToClipboard);
  insertBtn.addEventListener('click', handleInsert);
  exportJsonBtn.addEventListener('click', exportJSON);
  exportMdBtn.addEventListener('click', exportMarkdown);
  newPromptBtn.addEventListener('click', handleNewPrompt);
  themeToggle.addEventListener('click', cycleTheme);
  settingsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());
  document.querySelectorAll('.view-tab').forEach((btn) => {
    btn.addEventListener('click', () => switchView((btn as HTMLElement).dataset.view as ViewName));
  });
  historySearchInput.addEventListener('input', debounce(handleHistorySearch, 300));
  historyStarFilter.addEventListener('change', handleHistorySearch);
  clearHistoryBtn.addEventListener('click', handleClearHistory);
}

function switchView(view: ViewName): void {
  state.activeView = view;
  document.querySelectorAll('.view-tab').forEach((b) => (b as HTMLElement).classList.toggle('active', (b as HTMLElement).dataset.view === view));
  (['chat', 'history'] as ViewName[]).forEach((v) => $(`view-${v}`).classList.toggle('hidden', v !== view));
  if (view === 'chat' && !state.currentResult) {
    chatMessages.classList.remove('hidden');
    inputSection.classList.remove('hidden');
    resultPanel.classList.add('hidden');
  }
  if (view === 'history') renderHistoryList();
}

function updateCharCounter(): void {
  const len = inputArea.value.length;
  charCounter.textContent = `${len} / ${MAX_INPUT}`;
  charCounter.className = len >= MAX_INPUT ? 'error' : len >= WARN_THRESHOLD ? 'warning' : '';
}

async function handleCompile(): Promise<void> {
  const rawIdea = inputArea.value.trim();
  if (!rawIdea) { showError('Please enter your idea.'); return; }
  state.lastInput = rawIdea;
  setCompiling(true);
  hideError();
  try {
    const response: ExtensionResponse = await chrome.runtime.sendMessage({ action: 'compile', payload: { rawIdea } });
    if (response.success && 'data' in response) {
      const data = (response as CompileSuccessResponse).data;
      state.currentResult = data;
      renderResult(data);
      await addHistoryEntry(rawIdea, data);
      state.historyEntries = await getHistory();
    } else if (!response.success && 'error' in response) {
      showError(response.error.message);
    }
  } catch { showError('Communication error.'); } finally { setCompiling(false); }
}

function setCompiling(active: boolean): void {
  compileBtn.disabled = active;
  spinner.classList.toggle('hidden', !active);
  btnIcon.classList.toggle('hidden', active);
}

function addChatBubble(text: string, type: 'user' | 'bot'): void {
  chatMessages.querySelector('.chat-welcome')?.remove();
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

function renderResult(data: CompiledPrompt): void {
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
    output.textContent = state.activeTab === 'full' ? data.assembled_prompt : (data.sections[state.activeTab as PromptSection] || '(empty)');
  }
}

function renderMetadata(data: CompiledPrompt): void {
  metaTask.textContent = data.metadata.task_type;
  metaDomain.textContent = data.metadata.domain;
  metaComplexity.textContent = data.metadata.complexity;
  metaTime.textContent = `${data.metadata.processing_time_ms}ms`;
}

function renderQualityRing(data: CompiledPrompt): void {
  const offset = RING_CIRCUMFERENCE - (data.quality_score / 24) * RING_CIRCUMFERENCE;
  ringFill.style.strokeDashoffset = String(offset);
  ringFill.style.stroke = `var(--ring-${data.quality_label})`;
  ringScore.textContent = String(data.quality_score);
  ringQualityLabel.textContent = data.quality_label;
  ringQualityLabel.className = `ring-quality-label ${data.quality_label}`;
  qualityBreakdown.innerHTML = Object.entries(data.quality_breakdown).map(([c, s]) =>
    `<div class="quality-row"><span class="criterion">${c.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())}</span><span class="score">${s}/2</span></div>`
  ).join('');
}

function handleTabSwitch(e: Event): void {
  const t = e.target as HTMLElement;
  if (!t.classList.contains('tab') || !t.dataset.tab) return;
  state.activeTab = t.dataset.tab as any;
  updateTabDisplay();
  if (state.currentResult) renderOutputForTab(state.currentResult);
}

function updateTabDisplay(): void {
  tabBar.querySelectorAll('.tab').forEach((t) => (t as HTMLElement).classList.toggle('active', (t as HTMLElement).dataset.tab === state.activeTab));
}

function showError(msg: string): void { errorBanner.textContent = msg; errorBanner.classList.remove('hidden'); }
function hideError(): void { errorBanner.classList.add('hidden'); }

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

async function handleInsert(): Promise<void> {
  if (!state.currentResult) return;
  const text = state.activeTab === 'full' || state.activeTab === 'compare' ? state.currentResult.assembled_prompt : (state.currentResult.sections[state.activeTab as PromptSection] || '');
  await chrome.storage.local.set({ lastCompiledPrompt: text });
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) { showToast('No active tab found'); return; }
    try {
      const resp = await chrome.tabs.sendMessage(tab.id, { action: 'insert_prompt', payload: { text, submit: false } });
      if (resp?.success) { showToast('Inserted!'); return; }
    } catch { /* content script not loaded — fall through */ }
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (t: string) => {
        const el = document.querySelector<HTMLElement>('textarea:not([hidden])') ?? document.querySelector<HTMLElement>('div[contenteditable="true"]') ?? document.querySelector<HTMLElement>('[contenteditable="true"]');
        if (!el) return;
        if (el.tagName === 'TEXTAREA') {
          const ns = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
          if (ns) ns.call(el, t); else (el as HTMLTextAreaElement).value = t;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          el.focus(); el.innerHTML = '';
          const p = document.createElement('p'); p.textContent = t; el.appendChild(p);
          el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
        }
        el.focus();
      },
      args: [text],
    });
    showToast('Inserted!');
  } catch { showToast('Could not insert'); }
}

async function copyToClipboard(): Promise<void> {
  if (!state.currentResult) return;
  const text = state.activeTab === 'full' || state.activeTab === 'compare' ? state.currentResult.assembled_prompt : (state.currentResult.sections[state.activeTab as PromptSection] || '');
  await navigator.clipboard.writeText(text);
  showToast('Copied!');
}

const WATERMARK = '\n\n---\nPowered by Prompt Compiler';

function exportJSON(): void {
  if (!state.currentResult) return;
  const payload = { ...state.currentResult, _watermark: 'Powered by Prompt Compiler' };
  downloadFile(JSON.stringify(payload, null, 2), 'prompt-compiled.json', 'application/json');
  showToast('Exported JSON');
}

function exportMarkdown(): void {
  if (!state.currentResult) return;
  const d = state.currentResult;
  downloadFile(d.assembled_prompt, 'prompt-compiled.md', 'text/markdown');
  showToast('Exported MD');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

async function renderHistoryList(): Promise<void> {
  historyCount.textContent = `${state.historyEntries.length} entries`;
  if (!state.historyEntries.length) { historyListEl.innerHTML = '<div class="empty-state">No history yet.</div>'; return; }
  historyListEl.innerHTML = state.historyEntries.map((e) => `<div class="history-item" data-id="${escapeAttr(e.id)}"><button class="star-btn ${e.starred ? 'starred' : ''}" data-action="star">★</button><span class="input-preview">${escapeHtml(e.input)}</span><div class="item-meta"><span class="item-badge" style="background:var(--badge-${e.result.quality_label})">${e.result.quality_score}</span><span class="item-date">${formatDate(e.timestamp)}</span></div></div>`).join('');
  historyListEl.querySelectorAll('.history-item').forEach((el) => {
    el.addEventListener('click', (ev) => {
      const id = (el as HTMLElement).dataset.id!;
      if ((ev.target as HTMLElement).dataset.action === 'star') { handleToggleStar(id); return; }
      const entry = state.historyEntries.find((h) => h.id === id);
      if (entry) { switchView('chat'); state.lastInput = entry.input; state.currentResult = entry.result; renderResult(entry.result); }
    });
  });
}

async function handleToggleStar(id: string): Promise<void> { await toggleStarHistory(id); state.historyEntries = await getHistory(); await renderHistoryList(); }
async function handleHistorySearch(): Promise<void> {
  const q = historySearchInput.value.trim();
  const s = historyStarFilter.checked;
  state.historyEntries = (!q && !s)
    ? await getHistory()
    : await searchHistory(q, undefined, s);
  await renderHistoryList();
}
async function handleClearHistory(): Promise<void> { await clearHistory(); state.historyEntries = []; await renderHistoryList(); showToast('Cleared'); }

function formatDate(ts: number): string {
  const d = new Date(ts); const now = new Date();
  return d.toDateString() === now.toDateString() ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function cycleTheme(): void {
  const order: Theme[] = ['light', 'dark', 'system'];
  currentTheme = order[(order.indexOf(currentTheme) + 1) % order.length];
  applyTheme(currentTheme);
  updateThemeIcon();
  updateSettings({ theme: currentTheme });
}

function updateThemeIcon(): void { themeToggle.textContent = ({ light: '☀', dark: '🌙', system: '🔄' } as Record<Theme, string>)[currentTheme]; }

function showToast(msg: string): void {
  toast.textContent = msg; toast.classList.remove('hidden'); toast.classList.add('visible');
  setTimeout(() => { toast.classList.remove('visible'); setTimeout(() => toast.classList.add('hidden'), 200); }, TOAST_DURATION);
}

function escapeHtml(t: string): string { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
function escapeAttr(t: string): string { return t.replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T { let timer: ReturnType<typeof setTimeout>; return ((...args: any[]) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); }) as T; }

init();
