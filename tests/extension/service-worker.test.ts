import { jest } from '@jest/globals';
import { installChromeMock, resetChromeMock, getMessageListeners, chromeMock } from '../mocks/chrome.js';

// Install chrome mock before importing service-worker (it accesses chrome at module level)
installChromeMock();

let handleMessage: typeof import('../../src/extension/background/service-worker.js')['handleMessage'];
let handleCompile: typeof import('../../src/extension/background/service-worker.js')['handleCompile'];

beforeAll(async () => {
  // Dynamic import to ensure chrome mock is installed first
  const mod = await import('../../src/extension/background/service-worker.js');
  handleMessage = mod.handleMessage;
  handleCompile = mod.handleCompile;
});

beforeEach(() => {
  resetChromeMock();
});

describe('Service Worker', () => {

  test('handleMessage routes compile action', async () => {
    const response = await handleMessage({
      action: 'compile',
      payload: { rawIdea: 'write a Python function to sort a list' },
    });
    expect(response).toHaveProperty('success');
    if (response.success && 'data' in response) {
      const data = response.data as any;
      expect(data).toHaveProperty('assembled_prompt');
      expect(data).toHaveProperty('quality_score');
    }
  });

  test('handleMessage returns data on successful compile', async () => {
    const response = await handleMessage({
      action: 'compile',
      payload: { rawIdea: 'Explain how a binary search works in detail' },
    });
    expect(response.success).toBe(true);
    if (response.success && 'data' in response) {
      const responseData = response.data as any;
      expect(typeof responseData.assembled_prompt).toBe('string');
      expect(responseData.assembled_prompt.length).toBeGreaterThan(0);
    }
  });

  test('handleMessage routes get_settings action', async () => {
    await chromeMock.storage.local.set({
      prompt_compiler_settings: {
        defaultAudienceLevel: 'professional',
        preferredDomain: null,
        theme: 'system',
        enableContentScript: true,
        keyboardShortcut: 'Ctrl+Shift+P',
      },
    });
    const response = await handleMessage({ action: 'get_settings' });
    expect(response.success).toBe(true);
    if ('settings' in response) {
      expect(response.settings).toHaveProperty('theme');
      expect(response.settings).toHaveProperty('defaultAudienceLevel');
    }
  });

  test('handleMessage routes update_settings action', async () => {
    await chromeMock.storage.local.set({
      prompt_compiler_settings: {
        defaultAudienceLevel: 'professional',
        preferredDomain: null,
        theme: 'system',
        enableContentScript: true,
        keyboardShortcut: 'Ctrl+Shift+P',
      },
    });
    const response = await handleMessage({
      action: 'update_settings',
      payload: { theme: 'dark' },
    });
    expect(response.success).toBe(true);
    if ('settings' in response) {
      expect(response.settings.theme).toBe('dark');
    }
  });

  test('handleCompile returns error for empty input', async () => {
    const response = await handleCompile('');
    expect(response.success).toBe(false);
    if (!response.success && 'error' in response) {
      expect(response.error).toHaveProperty('code');
      expect(response.error).toHaveProperty('message');
    }
  });

  test('compile response includes quality info', async () => {
    const response = await handleMessage({
      action: 'compile',
      payload: { rawIdea: 'Create a REST API with Node.js for a todo application' },
    });
    if (response.success && 'data' in response) {
      const data = response.data as any;
      expect(typeof data.quality_score).toBe('number');
      expect(typeof data.quality_label).toBe('string');
    }
  });
});
