import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { callGroq, buildClientOptions, testConnection, GroqApiError } from '../../src/engine/llm/groq-client.js';
import type { LLMConfig } from '../../src/engine/types.js';

// ─── Mock fetch ─────────────────────────────────────────────────────────────

const mockFetch = jest.fn() as jest.MockedFunction<typeof globalThis.fetch>;
(globalThis as any).fetch = mockFetch;

function mockResponse(body: object, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
    json: () => Promise.resolve(body),
  } as Response;
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('buildClientOptions', () => {
  it('uses defaults when optional fields missing', () => {
    const config: LLMConfig = { apiKey: 'test-key', enabled: true };
    const opts = buildClientOptions(config);
    expect(opts.apiKey).toBe('test-key');
    expect(opts.model).toBe('llama-3.3-70b-versatile');
    expect(opts.timeoutMs).toBe(4000);
  });

  it('respects overrides', () => {
    const config: LLMConfig = { apiKey: 'k', model: 'custom', timeoutMs: 2000, enabled: true };
    const opts = buildClientOptions(config);
    expect(opts.model).toBe('custom');
    expect(opts.timeoutMs).toBe(2000);
  });
});

describe('callGroq', () => {
  const opts = { apiKey: 'test-key', model: 'test-model', timeoutMs: 5000 };

  it('sends correct request and parses response', async () => {
    const body = {
      id: 'chatcmpl-1',
      choices: [{ message: { role: 'assistant', content: '{"ok":true}' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    };
    mockFetch.mockResolvedValueOnce(mockResponse(body));

    const result = await callGroq([{ role: 'user', content: 'hi' }], opts);
    expect(result.choices[0].message.content).toBe('{"ok":true}');

    // Verify fetch was called with correct headers
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect((init as RequestInit).headers).toEqual(
      expect.objectContaining({
        'Authorization': 'Bearer test-key',
        'Content-Type': 'application/json',
      }),
    );
  });

  it('includes json mode when requested', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ choices: [{ message: { content: '{}' } }] }));
    await callGroq([{ role: 'user', content: 'hi' }], opts, true);

    const requestBody = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    expect(requestBody.response_format).toEqual({ type: 'json_object' });
  });

  it('throws GroqApiError on non-200 response', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ error: 'bad key' }, 401));
    await expect(callGroq([{ role: 'user', content: 'hi' }], opts))
      .rejects.toThrow(GroqApiError);
  });

  it('throws GroqApiError on fetch failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(callGroq([{ role: 'user', content: 'hi' }], opts))
      .rejects.toThrow(GroqApiError);
  });
});

describe('testConnection', () => {
  const opts = { apiKey: 'test-key', model: 'test-model', timeoutMs: 5000 };

  it('returns true on successful response', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      choices: [{ message: { content: '{"status":"ok"}' } }],
    }));
    expect(await testConnection(opts)).toBe(true);
  });

  it('returns false on failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fail'));
    expect(await testConnection(opts)).toBe(false);
  });
});
