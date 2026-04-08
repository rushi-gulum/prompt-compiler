import { jest } from '@jest/globals';
import { chromeMock, installChromeMock, resetChromeMock } from '../mocks/chrome.js';

// Setup chrome mock first
installChromeMock();

let handleMessage: any;

describe('E2E Compilation Flow', () => {
  beforeAll(async () => {
    // Import dynamically after chrome is mocked
    const mod = await import('../../src/extension/background/service-worker.js');
    handleMessage = mod.handleMessage;
  });
  beforeEach(() => {
    installChromeMock();
    resetChromeMock();
    
    // Setup typical settings
    chromeMock.storage.local.get.mockImplementation(async () => {
      return {
        prompt_compiler_settings: {
          defaultAudienceLevel: 'professional',
          theme: 'system',
          llmEnabled: false,
          groqApiKey: '',
          compileTimeoutMs: 10000,
        }
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('compiles a raw idea into a structured prompt completely offline', async () => {
    // 1. Simulate the compile message coming from the popup
    const payload = {
      rawIdea: 'Write a python script to process CSV files and summarize the data',
      audienceLevel: 'professional',
      preferredDomain: null,
    };

    // Spy on the global fetch to ensure it doesn't get called (offline mode)
    const fetchSpy = jest.spyOn(global, 'fetch');
    // But since persona gets fetched lazily through getURL in stage3, we need to mock it in node environment.
    // Wait, getLibrary handles node cleanly via fs.readFileSync.

    // 2. Call handler directly
    const result: any = await handleMessage({ action: 'compile', payload }, {}, jest.fn());
    
    // 3. Verify the output
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    // Check that it produced standard sections in the string output
    const prompt = result.data.assembled_prompt as string;
    expect(prompt.length).toBeGreaterThan(0);
    
    // Check for standard prompt compiler structural tags
    expect(prompt).toContain('<role>');
    
    expect(fetchSpy).not.toHaveBeenCalledWith(expect.stringContaining('api.groq.com'));
  });
});
