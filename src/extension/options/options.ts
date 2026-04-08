import type { UserSettings } from '../shared/messages.js';
import { getSettings, updateSettings, resetToDefaults } from '../shared/settings.js';
import { applyTheme } from '../shared/theme.js';
import type { AudienceLevel, DomainType } from '../../engine/types.js';

// ─── DOM References ─────────────────────────────────────────────────────
const audienceSelect = document.getElementById('audience-level') as HTMLSelectElement;
const domainSelect = document.getElementById('preferred-domain') as HTMLSelectElement;
const themeSelect = document.getElementById('theme') as HTMLSelectElement;
const contentScriptCheckbox = document.getElementById('enable-content-script') as HTMLInputElement;
const contextMenuCheckbox = document.getElementById('enable-context-menu') as HTMLInputElement;
const sidePanelCheckbox = document.getElementById('enable-side-panel') as HTMLInputElement;
const timeoutInput = document.getElementById('compile-timeout') as HTMLInputElement;
const timeoutDisplay = document.getElementById('timeout-display') as HTMLSpanElement;
const resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
const exportErrorsBtn = document.getElementById('export-errors-btn') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLDivElement;

// LLM Settings
const llmEnabledCheckbox = document.getElementById('llm-enabled') as HTMLInputElement;
const groqApiKeyInput = document.getElementById('groq-api-key') as HTMLInputElement;
const llmModelSelect = document.getElementById('llm-model') as HTMLSelectElement;
const toggleKeyBtn = document.getElementById('toggle-key-visibility') as HTMLButtonElement;
const testConnectionBtn = document.getElementById('test-connection-btn') as HTMLButtonElement;
const connectionStatusEl = document.getElementById('connection-status') as HTMLDivElement;

// ─── Initialization ─────────────────────────────────────────────────────
async function init(): Promise<void> {
  const settings = await getSettings();
  populateForm(settings);
  applyTheme(settings.theme);
  attachListeners();
}

function populateForm(settings: UserSettings): void {
  audienceSelect.value = settings.defaultAudienceLevel;
  domainSelect.value = settings.preferredDomain ?? '';
  themeSelect.value = settings.theme;
  contentScriptCheckbox.checked = settings.enableContentScript;
  contextMenuCheckbox.checked = settings.enableContextMenu;
  sidePanelCheckbox.checked = settings.enableSidePanel;

  timeoutInput.value = String(settings.compileTimeoutMs || 10000);
  timeoutDisplay.textContent = `${(settings.compileTimeoutMs || 10000) / 1000}s`;
  llmEnabledCheckbox.checked = settings.llmEnabled;
  groqApiKeyInput.value = settings.groqApiKey;
  llmModelSelect.value = settings.llmModel;
  updateLlmVisibility(settings.llmEnabled);
}

// ─── Event Listeners ────────────────────────────────────────────────────
function attachListeners(): void {
  audienceSelect.addEventListener('change', () => {
    save({ defaultAudienceLevel: audienceSelect.value as AudienceLevel });
  });

  domainSelect.addEventListener('change', () => {
    const val = domainSelect.value;
    save({ preferredDomain: val ? (val as DomainType) : null });
  });

  themeSelect.addEventListener('change', () => {
    const theme = themeSelect.value as UserSettings['theme'];
    applyTheme(theme);
    save({ theme });
  });

  contentScriptCheckbox.addEventListener('change', () => {
    save({ enableContentScript: contentScriptCheckbox.checked });
  });

  contextMenuCheckbox.addEventListener('change', () => {
    save({ enableContextMenu: contextMenuCheckbox.checked });
  });

  sidePanelCheckbox.addEventListener('change', () => {
    save({ enableSidePanel: sidePanelCheckbox.checked });
  });

  timeoutInput.addEventListener('input', () => {
    const ms = Number(timeoutInput.value);
    timeoutDisplay.textContent = `${ms / 1000}s`;
  });

  timeoutInput.addEventListener('change', () => {
    save({ compileTimeoutMs: Number(timeoutInput.value) });
  });

  resetBtn.addEventListener('click', handleReset);
  exportErrorsBtn.addEventListener('click', handleExportErrors);

  // LLM listeners
  llmEnabledCheckbox.addEventListener('change', () => {
    const enabled = llmEnabledCheckbox.checked;
    save({ llmEnabled: enabled });
    updateLlmVisibility(enabled);
  });

  groqApiKeyInput.addEventListener('change', () => {
    save({ groqApiKey: groqApiKeyInput.value.trim() });
  });

  llmModelSelect.addEventListener('change', () => {
    save({ llmModel: llmModelSelect.value });
  });

  toggleKeyBtn.addEventListener('click', () => {
    const isPassword = groqApiKeyInput.type === 'password';
    groqApiKeyInput.type = isPassword ? 'text' : 'password';
    toggleKeyBtn.textContent = isPassword ? 'Hide' : 'Show';
  });

  testConnectionBtn.addEventListener('click', handleTestConnection);
}

// ─── Save Settings ──────────────────────────────────────────────────────
async function save(partial: Partial<UserSettings>): Promise<void> {
  await updateSettings(partial);
  showStatus();
}

function showStatus(): void {
  statusEl.classList.remove('hidden');
  setTimeout(() => statusEl.classList.add('hidden'), 2000);
}

// ─── Reset ──────────────────────────────────────────────────────────────
async function handleReset(): Promise<void> {
  if (!confirm('Reset all settings to defaults?')) return;
  await resetToDefaults();
  const settings = await getSettings();
  populateForm(settings);
  applyTheme(settings.theme);
  showStatus();
}

// ─── Export Errors ────────────────────────────────────────────────────────
async function handleExportErrors(): Promise<void> {
  const mod = await import('../shared/error-reporter.js');
  const log = await mod.exportErrorLog();
  const blob = new Blob([log], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'prompt-compiler-errors.json';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Boot ───────────────────────────────────────────────────────────────
init();

export { init, populateForm, save, handleReset };

// ─── LLM Helpers ────────────────────────────────────────────────────────
function updateLlmVisibility(enabled: boolean): void {
  const groups = [document.getElementById('llm-settings-group'), document.getElementById('llm-model-group')];
  for (const g of groups) {
    if (g) g.style.display = enabled ? '' : 'none';
  }
}

async function handleTestConnection(): Promise<void> {
  testConnectionBtn.disabled = true;
  testConnectionBtn.textContent = 'Testing...';
  connectionStatusEl.classList.remove('hidden');
  connectionStatusEl.textContent = 'Connecting to Groq...';
  connectionStatusEl.style.color = '';

  try {
    const response = await chrome.runtime.sendMessage({ action: 'test_groq_connection' });
    if (response?.connected) {
      connectionStatusEl.textContent = '✅ Connected successfully!';
      connectionStatusEl.style.color = '#16a34a';
    } else {
      connectionStatusEl.textContent = '❌ Connection failed. Check your API key.';
      connectionStatusEl.style.color = '#dc2626';
    }
  } catch {
    connectionStatusEl.textContent = '❌ Connection error.';
    connectionStatusEl.style.color = '#dc2626';
  } finally {
    testConnectionBtn.disabled = false;
    testConnectionBtn.textContent = 'Test Connection';
    setTimeout(() => connectionStatusEl.classList.add('hidden'), 5000);
  }
}
