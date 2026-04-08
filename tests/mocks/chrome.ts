/** Chrome API mock for testing extension components */
import { jest } from '@jest/globals';

const storage: Record<string, unknown> = {};

const chromeStorageLocal = {
  get: jest.fn(async (key: string | string[]) => {
    if (typeof key === 'string') {
      return key in storage ? { [key]: storage[key] } : {};
    }
    const result: Record<string, unknown> = {};
    for (const k of key) {
      if (k in storage) result[k] = storage[k];
    }
    return result;
  }),
  set: jest.fn(async (items: Record<string, unknown>) => {
    Object.assign(storage, items);
  }),
  remove: jest.fn(async (keys: string | string[]) => {
    const arr = typeof keys === 'string' ? [keys] : keys;
    for (const k of arr) delete storage[k];
  }),
  clear: jest.fn(async () => {
    for (const k of Object.keys(storage)) delete storage[k];
  }),
};

const chromeStorageSession = {
  get: chromeStorageLocal.get,
  set: chromeStorageLocal.set,
  remove: chromeStorageLocal.remove,
  clear: chromeStorageLocal.clear,
};

type MessageListener = (
  message: unknown,
  sender: unknown,
  sendResponse: (response?: unknown) => void,
) => boolean | void;

const messageListeners: MessageListener[] = [];

const chromeRuntime = {
  onMessage: {
    addListener: jest.fn((fn: MessageListener) => {
      messageListeners.push(fn);
    }),
    removeListener: jest.fn((fn: MessageListener) => {
      const idx = messageListeners.indexOf(fn);
      if (idx >= 0) messageListeners.splice(idx, 1);
    }),
  },
  onInstalled: {
    addListener: jest.fn(),
  },
  getManifest: jest.fn(() => ({ version: '2.0.0' })),
  onUpdateAvailable: {
    addListener: jest.fn(),
  },
  sendMessage: jest.fn(async (message: unknown) => {
    return new Promise((resolve) => {
      for (const listener of messageListeners) {
        listener(message, {}, (response: unknown) => resolve(response));
      }
    });
  }),
};

export const chromeMock = {
  storage: {
    local: chromeStorageLocal,
    session: chromeStorageSession,
  },
  runtime: chromeRuntime,
  tabs: {
    query: jest.fn(async () => [{ id: 1, url: 'https://chatgpt.com/' }]),
    sendMessage: jest.fn(async () => ({ success: true })),
  },
  scripting: {
    executeScript: jest.fn(async () => []),
  },
  sidePanel: {
    open: jest.fn(async () => {}),
    setOptions: jest.fn(async () => {}),
  },
  contextMenus: {
    create: jest.fn(),
    removeAll: jest.fn(async () => {}),
    onClicked: { addListener: jest.fn() },
  },
  commands: {
    onCommand: { addListener: jest.fn() },
  },
};

/** Reset all mocks and clear storage */
export function resetChromeMock(): void {
  for (const k of Object.keys(storage)) delete storage[k];
  jest.clearAllMocks();
  messageListeners.length = 0;
}

/** Install the mock globally */
export function installChromeMock(): void {
  (globalThis as Record<string, unknown>).chrome = chromeMock;
}

/** Get current message listeners for testing */
export function getMessageListeners(): MessageListener[] {
  return messageListeners;
}
