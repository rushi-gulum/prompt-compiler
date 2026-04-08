/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { installChromeMock, resetChromeMock, chromeMock } from '../mocks/chrome.js';

// Set up DOM and chrome mock before popup module import
installChromeMock();

// Mock DOM elements that popup.ts expects
function setupDOM(): void {
  document.body.innerHTML = `
    <div id="chat-messages" class="chat-messages">
      <div class="chat-welcome"><p class="welcome-text">What would you like to create today?</p></div>
    </div>
    <div id="input-section">
      <textarea id="input" maxlength="5000"></textarea>
      <button id="compile-btn"><span class="btn-icon">✦</span><span class="btn-text">Compile</span><span id="spinner" class="hidden"></span></button>
    </div>
    <div id="result-panel" class="hidden">
      <div id="output-section"></div>
      <div id="output"></div>
      <span id="quality-badge"></span>
      <div id="quality-breakdown" class="hidden"></div>
      <div id="tab-bar"><button class="tab active" data-tab="full">Full</button><button class="tab" data-tab="role">Role</button></div>
      <button id="copy-btn">Copy</button>
      <button id="insert-btn">Insert</button>
      <button id="export-json-btn">JSON</button>
      <button id="export-md-btn">MD</button>
      <svg><circle id="ring-fill" r="34"></circle></svg>
      <span id="ring-score"></span>
      <span id="meta-task"></span>
      <span id="meta-domain"></span>
      <span id="meta-complexity"></span>
      <span id="meta-time"></span>
      <button id="new-prompt-btn">New Prompt</button>
    </div>
    <span id="char-counter">0 / 5000</span>
    <div id="error-banner" class="hidden"></div>
    <div id="history-list" class="hidden"></div>
    <div id="history-toggle"><span id="history-count">0</span><span class="chevron">▸</span></div>
    <button id="theme-toggle">☀</button>
    <button id="settings-btn">⚙</button>
    <button id="sidepanel-btn">Side Panel</button>
    <div id="toast" class="hidden"></div>
    <div id="onboarding" class="hidden">
      <div class="onboard-step" data-step="1"></div>
      <div class="onboard-step hidden" data-step="2"></div>
      <div class="onboard-step hidden" data-step="3"></div>
      <button class="onboard-btn" data-step="2">Next</button>
      <button class="onboard-btn" data-step="3">Next</button>
      <button id="onboard-finish">Get Started</button>
      <span class="dot active" data-step="1"></span>
      <span class="dot" data-step="2"></span>
      <span class="dot" data-step="3"></span>
    </div>
    <div id="compare-view" class="hidden"><div id="compare-input"></div><div id="compare-output"></div></div>
    <span id="ring-quality-label"></span>
    <input id="history-search" type="text" />
    <input id="history-star-filter" type="checkbox" />
    <button id="clear-history-btn">Clear</button>
    <div id="view-chat"></div>
    <div id="view-history" class="hidden"></div>
    <!-- New UI elements mock -->
    <span id="offline-badge" class="hidden"></span>
    <button id="feedback-up"></button>
    <button id="feedback-down"></button>
    <button id="export-data-btn"></button>
    <button id="import-data-btn"></button>
    <input id="import-file-input" type="file" />
    <div id="update-banner" class="hidden"></div>
    <span id="update-version"></span>
    <button id="update-dismiss"></button>
  `;
}

// Mock chrome.runtime.openOptionsPage
(chromeMock.runtime as Record<string, unknown>).openOptionsPage = jest.fn();

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: jest.fn(async () => {}) },
  writable: true,
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:test');
global.URL.revokeObjectURL = jest.fn();

// Mock localStorage
const localStorageData: Record<string, string> = {};
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn((key: string) => localStorageData[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { localStorageData[key] = value; }),
    removeItem: jest.fn((key: string) => { delete localStorageData[key]; }),
    clear: jest.fn(() => { for (const k of Object.keys(localStorageData)) delete localStorageData[k]; }),
  },
  writable: true,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: jest.fn(() => ({
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
  writable: true,
});

setupDOM();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let popup: any;

beforeEach(async () => {
  // Reset and reinstall mocks
  resetChromeMock();
  installChromeMock();
  jest.resetModules();
  
  // Set up a fresh DOM for each test
  setupDOM();

  // Set defaults in storage for getSettings()
  await chromeMock.storage.local.set({
    prompt_compiler_settings: {
      defaultAudienceLevel: 'professional',
      preferredDomain: null,
      theme: 'system',
      enableContentScript: true,
      keyboardShortcut: 'Ctrl+Shift+P',
    },
  });

  // Dynamic import after DOM + chrome are ready
  popup = await import('../../src/extension/popup/popup.js');
  await popup.init();
});

describe('Popup Module', () => {
  test('exports expected functions', () => {
    expect(typeof popup.handleCompile).toBe('function');
    expect(typeof popup.updateCharCounter).toBe('function');
    expect(typeof popup.renderResult).toBe('function');
    expect(typeof popup.showError).toBe('function');
    expect(typeof popup.hideError).toBe('function');
    expect(typeof popup.copyToClipboard).toBe('function');
    expect(typeof popup.exportJSON).toBe('function');
    expect(typeof popup.exportMarkdown).toBe('function');
    expect(typeof popup.showToast).toBe('function');
  });

  test('state has correct initial structure', () => {
    expect(popup.state).toHaveProperty('currentResult');
    expect(popup.state).toHaveProperty('activeTab');
    expect(popup.state).toHaveProperty('historyEntries');
    expect(popup.state.activeTab).toBe('full');
    expect(Array.isArray(popup.state.historyEntries)).toBe(true);
  });

  test('MAX_INPUT is exported', () => {
    expect(popup.MAX_INPUT).toBe(5000);
  });

  test('MAX_INPUT is 5000', () => {
    expect(popup.MAX_INPUT).toBe(5000);
  });

  test('showError displays error banner', () => {
    popup.showError('Test error');
    const banner = document.getElementById('error-banner')!;
    expect(banner.textContent).toBe('Test error');
    expect(banner.classList.contains('hidden')).toBe(false);
  });

  test('hideError hides error banner', () => {
    popup.showError('visible');
    popup.hideError();
    const banner = document.getElementById('error-banner')!;
    expect(banner.classList.contains('hidden')).toBe(true);
  });

  test('updateCharCounter updates counter text', () => {
    const input = document.getElementById('input') as HTMLTextAreaElement;
    input.value = 'hello';
    popup.updateCharCounter();
    const counter = document.getElementById('char-counter')!;
    expect(counter.textContent).toBe('5 / 5000');
  });

  test('showToast displays a toast message', () => {
    popup.showToast('Copied!');
    const toastEl = document.getElementById('toast')!;
    expect(toastEl.textContent).toBe('Copied!');
    expect(toastEl.classList.contains('visible')).toBe(true);
  });
});
