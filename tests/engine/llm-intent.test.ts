import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { analyzeLLMIntent } from '../../src/engine/llm/llm-intent.js';
import type { LLMConfig, LLMIntentResult } from '../../src/engine/types.js';

// ─── Mock fetch ─────────────────────────────────────────────────────────────

const mockFetch = jest.fn() as jest.MockedFunction<typeof globalThis.fetch>;
(globalThis as any).fetch = mockFetch;

function groqJsonResponse(content: object): Response {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      choices: [{ message: { role: 'assistant', content: JSON.stringify(content) }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    }),
  } as Response;
}

const validConfig: LLMConfig = { apiKey: 'test-key', enabled: true };
const disabledConfig: LLMConfig = { apiKey: 'test-key', enabled: false };
const noKeyConfig: LLMConfig = { apiKey: '', enabled: true };

beforeEach(() => {
  mockFetch.mockReset();
});

describe('analyzeLLMIntent', () => {
  it('returns null when disabled', async () => {
    const result = await analyzeLLMIntent('write a poem', disabledConfig);
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns null when no API key', async () => {
    const result = await analyzeLLMIntent('write a poem', noKeyConfig);
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('parses valid LLM response correctly', async () => {
    mockFetch.mockResolvedValueOnce(groqJsonResponse({
      task_type: 'creative_writing',
      domain: 'creative',
      complexity: 'moderate',
      key_entities: ['poem', 'nature'],
      refined_intent: 'Write a creative poem about nature',
      suggested_persona_focus: 'Focus on literary techniques and imagery',
      confidence: 0.92,
    }));

    const result = await analyzeLLMIntent('write a poem about nature', validConfig);
    expect(result).not.toBeNull();
    expect(result!.task_type).toBe('creative_writing');
    expect(result!.domain).toBe('creative');
    expect(result!.complexity).toBe('moderate');
    expect(result!.key_entities).toEqual(['poem', 'nature']);
    expect(result!.confidence).toBe(0.92);
  });

  it('normalizes invalid task_type to general', async () => {
    mockFetch.mockResolvedValueOnce(groqJsonResponse({
      task_type: 'invalid_type',
      domain: 'software',
      complexity: 'simple',
      key_entities: [],
      refined_intent: 'test',
      suggested_persona_focus: '',
      confidence: 0.5,
    }));

    const result = await analyzeLLMIntent('test', validConfig);
    expect(result!.task_type).toBe('general');
  });

  it('normalizes invalid domain to general', async () => {
    mockFetch.mockResolvedValueOnce(groqJsonResponse({
      task_type: 'code_generation',
      domain: 'unknown_domain',
      complexity: 'complex',
      key_entities: ['api'],
      refined_intent: 'build something',
      suggested_persona_focus: '',
      confidence: 0.8,
    }));

    const result = await analyzeLLMIntent('build an api', validConfig);
    expect(result!.domain).toBe('general');
  });

  it('returns null on fetch failure (graceful degradation)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    const result = await analyzeLLMIntent('test input', validConfig);
    expect(result).toBeNull();
  });

  it('returns null on invalid JSON from LLM', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        choices: [{ message: { role: 'assistant', content: 'not valid json' } }],
      }),
    } as Response);

    const result = await analyzeLLMIntent('test', validConfig);
    expect(result).toBeNull();
  });

  it('clamps confidence to valid range', async () => {
    mockFetch.mockResolvedValueOnce(groqJsonResponse({
      task_type: 'code_generation',
      domain: 'software',
      complexity: 'simple',
      key_entities: [],
      refined_intent: 'test',
      suggested_persona_focus: '',
      confidence: 5.0, // out of range
    }));

    const result = await analyzeLLMIntent('test', validConfig);
    // normalizeConfidence returns 0.5 for out-of-range values
    expect(result!.confidence).toBe(0.5);
  });
});
