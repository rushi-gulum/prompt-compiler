import type { UserSettings } from '../shared/messages.js';
import { getSettings, updateSettings, resetToDefaults } from '../shared/settings.js';
import { applyTheme } from '../shared/theme.js';
import type { AudienceLevel, DomainType, LLMProvider } from '../../engine/types.js';

// ─── Model presets per provider ───────────────────────────────────────────
const PROVIDER_MODELS: Record<LLMProvider, { label: string; value: string }[]> = {
  groq: [
    { label: 'Llama 3.3 70B (recommended)', value: 'llama-3.3-70b-versatile' },
    { label: 'Llama 3.1 8B Instant (faster)', value: 'llama-3.1-8b-instant' },
    { label: 'Mixtral 8x7B', value: 'mixtral-8x7b-32768' },
  ],
  gemini: [
    { label: 'Gemini 1.5 Flash (fast & smart)', value: 'gemini-1.5-flash' },
    { label: 'Gemini 1.5 Pro (deep reasoning)', value: 'gemini-1.5-pro' },
    { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
  ],
  openai: [
    { label: 'GPT-4o Mini (cost-effective)', value: 'gpt-4o-mini' },
    { label: 'GPT-4o (high intelligence)', value: 'gpt-4o' },
    { label: 'o3-mini (reasoning model)', value: 'o3-mini' },
  ],
};

// ─── DOM References ─────────────────────────────────────────────────────
const audienceSelect = document.getElementById('audience-level') as HTMLSelectElement;
const compilationLevelSelect = document.getElementById('compilation-level') as HTMLSelectElement;
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
const llmProviderSelect = document.getElementById('llm-provider') as HTMLSelectElement;
const groqApiKeyInput = document.getElementById('groq-api-key') as HTMLInputElement;
const geminiApiKeyInput = document.getElementById('gemini-api-key') as HTMLInputElement;
const openaiApiKeyInput = document.getElementById('openai-api-key') as HTMLInputElement;
const llmModelSelect = document.getElementById('llm-model') as HTMLSelectElement;
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
  if (compilationLevelSelect) {
    compilationLevelSelect.value = settings.defaultCompilationLevel || 'auto';
  }
  domainSelect.value = settings.preferredDomain ?? '';
  themeSelect.value = settings.theme;
  contentScriptCheckbox.checked = settings.enableContentScript;
  contextMenuCheckbox.checked = settings.enableContextMenu;
  sidePanelCheckbox.checked = settings.enableSidePanel;

  timeoutInput.value = String(settings.compileTimeoutMs || 10000);
  timeoutDisplay.textContent = `${(settings.compileTimeoutMs || 10000) / 1000}s`;

  llmEnabledCheckbox.checked = settings.llmEnabled;
  if (llmProviderSelect) {
    llmProviderSelect.value = settings.llmProvider || 'groq';
  }
  groqApiKeyInput.value = settings.groqApiKey;
  if (geminiApiKeyInput) geminiApiKeyInput.value = settings.geminiApiKey;
  if (openaiApiKeyInput) openaiApiKeyInput.value = settings.openaiApiKey;

  updateProviderModels(settings.llmProvider || 'groq', settings.llmModel);
  updateLlmVisibility(settings.llmEnabled, settings.llmProvider || 'groq');
}

function updateProviderModels(provider: LLMProvider, selectedModel?: string): void {
  llmModelSelect.innerHTML = '';
  const models = PROVIDER_MODELS[provider] || PROVIDER_MODELS.groq;
  for (const m of models) {
    const opt = document.createElement('option');
    opt.value = m.value;
    opt.textContent = m.label;
    llmModelSelect.appendChild(opt);
  }
  if (selectedModel && models.some(m => m.value === selectedModel)) {
    llmModelSelect.value = selectedModel;
  } else {
    llmModelSelect.value = models[0].value;
  }
}

// ─── Event Listeners ────────────────────────────────────────────────────
function attachListeners(): void {
  audienceSelect.addEventListener('change', () => {
    save({ defaultAudienceLevel: audienceSelect.value as AudienceLevel });
  });

  if (compilationLevelSelect) {
    compilationLevelSelect.addEventListener('change', () => {
      save({ defaultCompilationLevel: compilationLevelSelect.value as import('../../engine/types.js').CompilationLevel });
    });
  }

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
    updateLlmVisibility(enabled, (llmProviderSelect?.value as LLMProvider) || 'groq');
  });

  if (llmProviderSelect) {
    llmProviderSelect.addEventListener('change', () => {
      const provider = llmProviderSelect.value as LLMProvider;
      updateProviderModels(provider);
      save({ llmProvider: provider, llmModel: llmModelSelect.value });
      updateLlmVisibility(llmEnabledCheckbox.checked, provider);
    });
  }

  groqApiKeyInput.addEventListener('change', () => {
    save({ groqApiKey: groqApiKeyInput.value.trim() });
  });

  if (geminiApiKeyInput) {
    geminiApiKeyInput.addEventListener('change', () => {
      save({ geminiApiKey: geminiApiKeyInput.value.trim() });
    });
  }

  if (openaiApiKeyInput) {
    openaiApiKeyInput.addEventListener('change', () => {
      save({ openaiApiKey: openaiApiKeyInput.value.trim() });
    });
  }

  llmModelSelect.addEventListener('change', () => {
    save({ llmModel: llmModelSelect.value });
  });

  document.querySelectorAll('.toggle-key-visibility').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = (btn as HTMLElement).dataset.target;
      if (!targetId) return;
      const input = document.getElementById(targetId) as HTMLInputElement;
      if (!input) return;
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.textContent = isPassword ? 'Hide' : 'Show';
    });
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
function updateLlmVisibility(enabled: boolean, provider: LLMProvider): void {
  const providerGroup = document.getElementById('llm-provider-group');
  const modelGroup = document.getElementById('llm-model-group');
  const testGroup = testConnectionBtn?.parentElement;

  if (providerGroup) providerGroup.style.display = enabled ? '' : 'none';
  if (modelGroup) modelGroup.style.display = enabled ? '' : 'none';
  if (testGroup) testGroup.style.display = enabled ? '' : 'none';

  // Toggle provider-specific key fields
  const groqGroup = document.getElementById('groq-key-group');
  const geminiGroup = document.getElementById('gemini-key-group');
  const openaiGroup = document.getElementById('openai-key-group');

  if (groqGroup) groqGroup.style.display = enabled && provider === 'groq' ? '' : 'none';
  if (geminiGroup) geminiGroup.style.display = enabled && provider === 'gemini' ? '' : 'none';
  if (openaiGroup) openaiGroup.style.display = enabled && provider === 'openai' ? '' : 'none';
}

async function handleTestConnection(): Promise<void> {
  testConnectionBtn.disabled = true;
  testConnectionBtn.textContent = 'Testing...';
  connectionStatusEl.classList.remove('hidden');
  const provider = (llmProviderSelect?.value as LLMProvider) || 'groq';
  connectionStatusEl.textContent = `Connecting to ${provider.toUpperCase()}...`;
  connectionStatusEl.style.color = '';

  try {
    const response = await chrome.runtime.sendMessage({ action: 'test_groq_connection' });
    if (response?.connected) {
      connectionStatusEl.textContent = '✅ Connected successfully!';
      connectionStatusEl.style.color = '#16a34a';
    } else {
      connectionStatusEl.textContent = '❌ Connection failed. Check your API key and network.';
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
