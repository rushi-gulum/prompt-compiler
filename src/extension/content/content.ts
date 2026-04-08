import { platforms, genericAdapter } from './platforms.js';

/**
 * Find an input element with retry using MutationObserver.
 * If the initial selector search fails, observe DOM mutations
 * for up to 3 seconds waiting for the element to appear.
 */
function findInputElementWithRetry(url: string): Promise<HTMLElement | null> {
  const adapter = platforms.find((p) => p.matchUrl(url)) ?? genericAdapter;
  const immediate = adapter.findInputElement();
  if (immediate) return Promise.resolve(immediate);

  return new Promise((resolve) => {
    const timeout = 3000;
    let resolved = false;
    const root = document.body ?? document.documentElement;

    if (!root) {
      resolve(null);
      return;
    }

    const observer = new MutationObserver(() => {
      const el = adapter.findInputElement();
      if (el && !resolved) {
        resolved = true;
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        observer.disconnect();
        // Final attempt
        resolve(adapter.findInputElement());
      }
    }, timeout);
  });
}

// ─── Message Listener (insert_prompt from popup/service-worker) ──
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'insert_prompt') {
    const { text, submit } = message.payload as { text: string; submit?: boolean };

    findInputElementWithRetry(window.location.href)
      .then((inputEl) => {
        if (!inputEl) {
          return reportContentScriptError('INPUT_NOT_FOUND', `No input element found on ${window.location.hostname}`, {
            url: window.location.href,
          }).then(() => {
            sendResponse({ success: false, error: 'No input element found' });
          });
        }

        const adapter = platforms.find((p) => p.matchUrl(window.location.href)) ?? genericAdapter;
        try {
          adapter.setInputText(inputEl, text);
          inputEl.focus();

          if (submit) {
            setTimeout(() => {
              const sendBtn =
                inputEl.closest('form')?.querySelector<HTMLButtonElement>('button[data-testid="send-button"], button[aria-label="Send"], button[type="submit"]') ??
                inputEl.parentElement?.querySelector<HTMLButtonElement>('button');
              if (sendBtn) sendBtn.click();
            }, 100);
          }

          sendResponse({ success: true });
        } catch (error) {
          void reportContentScriptError('INSERT_FAILED', error instanceof Error ? error.message : 'Failed to insert prompt', {
            url: window.location.href,
            adapter: adapter.name,
          }).finally(() => {
            sendResponse({ success: false, error: 'Failed to insert prompt' });
          });
        }
      })
      .catch((error) => {
        void reportContentScriptError('CONTENT_SCRIPT_ERROR', error instanceof Error ? error.message : 'Unexpected content script error', {
          url: window.location.href,
        }).finally(() => {
          sendResponse({ success: false, error: 'Unexpected content script error' });
        });
      });

    return true; // Keep channel open for async response
  }
});

async function reportContentScriptError(
  code: 'INPUT_NOT_FOUND' | 'INSERT_FAILED' | 'CONTENT_SCRIPT_ERROR',
  message: string,
  context: Record<string, unknown>,
): Promise<void> {
  try {
    await chrome.runtime.sendMessage({
      action: 'log_error',
      payload: {
        source: 'content_script',
        code,
        message,
        context,
      },
    });
  } catch {
    // Ignore logging failures in content scripts.
  }
}
