/** Platform adapter interface and implementations for AI chat platforms */

export interface PlatformAdapter {
  name: string;
  matchUrl: (url: string) => boolean;
  findInputElement: () => HTMLElement | null;
  getInputText: (el: HTMLElement) => string;
  setInputText: (el: HTMLElement, text: string) => void;
  getButtonAnchor: (inputEl: HTMLElement) => HTMLElement;
}

/**
 * Universal approach to inserting text into modern web app inputs (React, ProseMirror, Draft.js)
 * Using execCommand correctly delegates the event cycle to the framework's internal synthetic event buses.
 */
export function insertTextUniversally(el: HTMLElement, text: string): void {
  el.focus();

  if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
    const nativeSetter = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(el),
      'value'
    )?.set;
    if (nativeSetter) {
      nativeSetter.call(el, text);
    } else {
      (el as HTMLTextAreaElement).value = text;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }

  // ContentEditable environments (ProseMirror, Lexical, Draft.js)
  try {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    // Natively replaces the selected text and fires internal tracking events
    const success = document.execCommand('insertText', false, text);
    if (success) {
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
      return;
    }
  } catch (e) {
    // Ignore exceptions in restricted contexts or JSDOM
  }

  // Fallback for environments where execCommand fails (e.g. Jest/JSDOM tests)
  el.innerHTML = `<p>${text.replace(/\n/g, '<br>')}</p>`;
  el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
}

export const platforms: PlatformAdapter[] = [
  {
    name: 'ChatGPT',
    matchUrl: (url) => /chat\.openai\.com|chatgpt\.com/.test(url),
    findInputElement: () =>
      document.querySelector<HTMLElement>('#prompt-textarea') ??
      document.querySelector<HTMLElement>('div[contenteditable="true"][id="prompt-textarea"]') ??
      document.querySelector<HTMLElement>('textarea[data-id]'),
    getInputText: (el) => {
      if (el.tagName === 'TEXTAREA') return (el as HTMLTextAreaElement).value;
      return el.innerText || el.textContent || '';
    },
    setInputText: insertTextUniversally,
    getButtonAnchor: (el) => el.closest('form') ?? el.parentElement!,
  },
  {
    name: 'Claude',
    matchUrl: (url) => /claude\.ai/.test(url),
    findInputElement: () =>
      document.querySelector<HTMLElement>('div.ProseMirror[contenteditable="true"]') ??
      document.querySelector<HTMLElement>('div.ProseMirror[contenteditable]') ??
      document.querySelector<HTMLElement>('[contenteditable="true"].ProseMirror') ??
      document.querySelector<HTMLElement>('div[contenteditable="true"][translate="no"]') ??
      document.querySelector<HTMLElement>('fieldset textarea') ??
      document.querySelector<HTMLElement>('div[contenteditable="true"][data-placeholder]') ??
      document.querySelector<HTMLElement>('footer textarea') ??
      document.querySelector<HTMLElement>('footer div[contenteditable="true"]'),
    getInputText: (el) =>
      el.tagName === 'TEXTAREA' ? (el as HTMLTextAreaElement).value : el.innerText || el.textContent || '',
    setInputText: insertTextUniversally,
    getButtonAnchor: (el) => el.closest('fieldset') ?? el.closest('form') ?? el.closest('[class*="input" i]') ?? el.parentElement!,
  },
  {
    name: 'Gemini',
    matchUrl: (url) => /gemini\.google\.com/.test(url),
    findInputElement: () => {
      // Try known selectors from most specific to broadest
      const selectors = [
        'rich-textarea .ql-editor[contenteditable="true"]',
        'rich-textarea .ql-editor[contenteditable]',
        'rich-textarea div[contenteditable="true"]',
        'rich-textarea [contenteditable]',
        'rich-textarea p',
        '.text-input-field textarea',
        '.input-area textarea',
        'div[contenteditable="true"][aria-label*="prompt" i]',
        'div[contenteditable="true"][aria-label*="Gemini" i]',
        'div[contenteditable="true"][aria-label]',
        '.input-area div[contenteditable="true"]',
        // Broad fallbacks for Gemini's evolving DOM
        'textarea[aria-label]',
        'textarea:not([hidden])',
        'div[contenteditable="true"][role="textbox"]',
        'div[contenteditable="plaintext-only"]',
        'div[contenteditable="true"]',
      ];
      for (const sel of selectors) {
        const el = document.querySelector<HTMLElement>(sel);
        if (el && el.offsetParent !== null) return el;
      }
      // Last resort: any visible contenteditable
      for (const el of document.querySelectorAll<HTMLElement>('[contenteditable="true"]')) {
        if (el.offsetParent !== null && el.clientHeight > 20) return el;
      }
      return null;
    },
    getInputText: (el) =>
      el.tagName === 'TEXTAREA' ? (el as HTMLTextAreaElement).value : el.innerText || el.textContent || '',
    setInputText: insertTextUniversally,
    getButtonAnchor: (el) => el.closest('rich-textarea') ?? el.closest('form') ?? el.closest('[class*="input" i]') ?? el.parentElement!,
  },
  {
    name: 'Perplexity',
    matchUrl: (url) => /perplexity\.ai/.test(url),
    findInputElement: () => {
      const selectors = [
        'textarea[placeholder*="Ask" i]',
        'textarea[placeholder*="Type" i]',
        'textarea[placeholder*="connectors" i]',
        'textarea[placeholder]',
        'textarea:not([hidden])',
        'div[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"][data-placeholder]',
        'div[contenteditable="true"]',
      ];
      for (const sel of selectors) {
        const el = document.querySelector<HTMLElement>(sel);
        if (el && el.offsetParent !== null) return el;
      }
      return null;
    },
    getInputText: (el) =>
      el.tagName === 'TEXTAREA' ? (el as HTMLTextAreaElement).value : el.innerText || el.textContent || '',
    setInputText: insertTextUniversally,
    getButtonAnchor: (el) => el.parentElement!,
  },
  {
    name: 'Grok',
    matchUrl: (url) => /grok\.com/.test(url),
    findInputElement: () => {
      const selectors = [
        'textarea[placeholder*="want to know" i]',
        'textarea[placeholder]',
        'textarea:not([hidden])',
        'div[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"][data-placeholder]',
        'div[contenteditable="true"]',
      ];
      for (const sel of selectors) {
        const el = document.querySelector<HTMLElement>(sel);
        if (el && el.offsetParent !== null) return el;
      }
      return null;
    },
    getInputText: (el) =>
      el.tagName === 'TEXTAREA' ? (el as HTMLTextAreaElement).value : el.innerText || el.textContent || '',
    setInputText: insertTextUniversally,
    getButtonAnchor: (el) => el.closest('form') ?? el.parentElement!,
  },
];

/** Generic fallback adapter — works on any page with a textarea or contenteditable */
export const genericAdapter: PlatformAdapter = {
  name: 'Generic',
  matchUrl: () => true,
  findInputElement: () =>
    document.querySelector<HTMLElement>('textarea:not([hidden])') ??
    document.querySelector<HTMLElement>('div[contenteditable="true"]') ??
    document.querySelector<HTMLElement>('[contenteditable="true"]'),
  getInputText: (el) =>
    el.tagName === 'TEXTAREA' ? (el as HTMLTextAreaElement).value : el.innerText || el.textContent || '',
  setInputText: insertTextUniversally,
  getButtonAnchor: (el) => el.parentElement!,
};
