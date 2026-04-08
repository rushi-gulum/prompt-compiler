import { compile } from '../../engine/index.js';
import type { LLMConfig } from '../../engine/types.js';
import type { ExtensionRequest, ExtensionResponse } from '../shared/messages.js';
import {
  getSettings,
  updateSettings,
  initDefaults,
  getHistory,
  searchHistory,
  toggleStarHistory,
  clearHistory,
  submitFeedback,
  exportAllData,
} from '../shared/settings.js';
import { canCompile, recordCompile, getResetTimeMs } from '../shared/rate-limiter.js';
import { logError } from '../shared/error-reporter.js';

const CONTEXT_MENU_ID = 'compile-selection';

// ─── Initialization ─────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  void (async () => {
    try {
      await initDefaults();
      const settings = await getSettings();
      await syncContextMenu(settings.enableContextMenu);
    } catch (error) {
      await logBackgroundError('settings', 'INSTALL_INIT_FAILED', error, { phase: 'onInstalled' });
    }
  })();
});

// ─── Version Update Handler ─────────────────────────────────────
chrome.runtime.onUpdateAvailable.addListener((details) => {
  void chrome.storage.local.set({
    prompt_compiler_update: {
      version: details.version,
      timestamp: Date.now(),
    },
  }).catch((error) => logBackgroundError('settings', 'UPDATE_BANNER_STORE_FAILED', error, { version: details.version }));
});

// ─── Context Menu Handler ───────────────────────────────────────
chrome.contextMenus.onClicked.addListener((info, tab) => {
  void (async () => {
    try {
      if (info.menuItemId !== CONTEXT_MENU_ID || !info.selectionText) {
        return;
      }

      const result = await handleCompile(info.selectionText);
      if (result.success && 'data' in result && typeof result.data !== 'string' && tab?.id) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'insert_prompt',
          payload: { text: result.data.assembled_prompt, submit: false },
        });
      }
    } catch (error) {
      await logBackgroundError('unknown', 'CONTEXT_MENU_HANDLER_FAILED', error, {
        menuItemId: info.menuItemId,
        hasSelectionText: Boolean(info.selectionText),
        tabId: tab?.id ?? null,
      });
    }
  })();
});

// ─── Message Handler ────────────────────────────────────────────
chrome.runtime.onMessage.addListener(
  (request: ExtensionRequest, _sender, sendResponse) => {
    void handleMessage(request)
      .then(sendResponse)
      .catch(async (error) => {
        await logBackgroundError('unknown', 'MESSAGE_HANDLER_FAILED', error, {
          action: (request as { action?: string }).action ?? 'unknown',
        });
        sendResponse({ success: false, error: { code: 'UNKNOWN_ERROR', message: 'Unexpected error' } });
      });
    return true; // Keep channel open for async response
  },
);

async function handleMessage(req: ExtensionRequest): Promise<ExtensionResponse> {
  switch (req.action) {
    case 'compile':
      return handleCompile(req.payload.rawIdea);

    case 'get_settings':
      return { success: true, settings: await getSettings() };

    case 'update_settings':
      await updateSettings(req.payload);
      const updatedSettings = await getSettings();
      await syncContextMenu(updatedSettings.enableContextMenu);
      return { success: true, settings: updatedSettings };

    case 'get_history':
      return { success: true, history: await getHistory() };

    case 'search_history':
      return { success: true, history: await searchHistory(req.payload.query, req.payload.domain, req.payload.starredOnly) };

    case 'toggle_star_history':
      await toggleStarHistory(req.payload.id);
      return { success: true };

    case 'clear_history':
      await clearHistory();
      return { success: true };

    case 'insert_prompt': {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'insert_prompt',
          payload: req.payload,
        });
      }
      return { success: true };
    }

    case 'compile_context_menu':
      return handleCompile(req.payload.text);

    case 'test_groq_connection': {
      const settings = await getSettings();
      if (!settings.groqApiKey) {
        return { success: true, connected: false } as ExtensionResponse;
      }
      try {
        const { testConnection, buildClientOptions } = await import('../../engine/llm/groq-client.js');
        const opts = buildClientOptions({
          apiKey: settings.groqApiKey,
          model: settings.llmModel,
          enabled: true,
        });
        const connected = await testConnection(opts);
        return { success: true, connected } as ExtensionResponse;
      } catch {
        return { success: true, connected: false } as ExtensionResponse;
      }
    }

    case 'export_data': {
      const data = await exportAllData();
      return { success: true, data } as ExtensionResponse;
    }


    case 'submit_feedback': {
      await submitFeedback(req.payload.historyId, req.payload.isPositive);
      return { success: true };
    }

    case 'log_error': {
      await logError(
        req.payload.source as any,
        req.payload.code,
        req.payload.message,
        req.payload.context,
      );
      return { success: true };
    }

    default:
      throw new Error(`Unknown action: ${(req as any).action}`);
  }
}

async function handleCompile(rawIdea: string): Promise<ExtensionResponse> {
  // Rate limit check
  if (!(await canCompile())) {
    const resetMs = await getResetTimeMs();
    const resetSec = Math.ceil(resetMs / 1000);
    await logError('compile', 'RATE_LIMITED', `Rate limit exceeded. Try again in ${resetSec}s`);
    return {
      success: false,
      error: { code: 'RATE_LIMITED', message: `Too many requests. Please wait ${resetSec} seconds.` },
    };
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  let timeoutMs = 10000;
  try {
    // Record this compile attempt
    await recordCompile();

    // Build LLM config from user settings
    const settings = await getSettings();
    const llmConfig: LLMConfig = {
      apiKey: settings.groqApiKey,
      model: settings.llmModel,
      enabled: settings.llmEnabled,
    };

    timeoutMs = settings.compileTimeoutMs || 10000;

    const result = await Promise.race([
      compile(rawIdea, llmConfig),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('STAGE_TIMEOUT')), timeoutMs);
      }),
    ]);

    if (result.success) {
      // Store last compiled prompt for keyboard-shortcut insert
      await chrome.storage.local.set({ lastCompiledPrompt: result.data.assembled_prompt });
      return { success: true, data: result.data };
    }

    await logError('compile', result.error.code, result.error.message);
    return { success: false, error: { code: result.error.code, message: result.error.message } };
  } catch (err) {
    const isTimeout = err instanceof Error && err.message === 'STAGE_TIMEOUT';
    const code = isTimeout ? 'STAGE_TIMEOUT' : 'COMPILATION_FAILED';
    const message = isTimeout
      ? `Compilation timed out after ${timeoutMs}ms`
      : err instanceof Error
        ? err.message
        : 'Compilation failed';
    await logError('compile', code, message);
    return { success: false, error: { code, message } };
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

async function syncContextMenu(enabled: boolean): Promise<void> {
  try {
    await chrome.contextMenus.removeAll();

    if (!enabled) {
      return;
    }

    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: 'Compile with Prompt Compiler',
      contexts: ['selection'],
    });
  } catch (error) {
    await logBackgroundError('settings', 'CONTEXT_MENU_SYNC_FAILED', error, { enabled });
  }
}

async function logBackgroundError(
  source: 'compile' | 'llm' | 'content_script' | 'settings' | 'unknown',
  code: string,
  error: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const errorContext = error instanceof Error
    ? { ...context, error: { name: error.name, message: error.message, stack: error.stack ?? undefined } }
    : { ...context, error: { message } };
  await logError(source, code, message, errorContext);
}

export { handleMessage, handleCompile };
