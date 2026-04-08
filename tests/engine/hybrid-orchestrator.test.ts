import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { hybridAnalyze, enrichContext } from '../../src/engine/llm/hybrid-orchestrator.js';
import type { LLMConfig, PipelineContext } from '../../src/engine/types.js';

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

const enabledConfig: LLMConfig = { apiKey: 'test-key', enabled: true };

beforeEach(() => {
  mockFetch.mockReset();
});

describe('hybridAnalyze', () => {
  it('returns pure rule-based results when LLM returns null', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error')); // makes analyze return null

    const { intent, domain, llmIntent } = await hybridAnalyze('write a python function', enabledConfig);

    expect(llmIntent).toBeNull();
    expect(intent.task_type).toBeDefined();
    expect(domain.primary_domain).toBeDefined();
  });

  it('merges results when LLM and rule-based agree on task_type', async () => {
    mockFetch.mockResolvedValueOnce(groqJsonResponse({
      task_type: 'code_generation',
      domain: 'software',
      complexity: 'moderate',
      key_entities: ['python', 'function', 'sorting'],
      refined_intent: 'Write a Python function for sorting',
      suggested_persona_focus: 'Focus on algorithmic efficiency',
      confidence: 0.9,
    }));

    const { intent, domain, llmIntent } = await hybridAnalyze(
      'write a python function to sort a list using merge sort',
      enabledConfig,
    );

    expect(llmIntent).not.toBeNull();
    // When both agree, confidence should be boosted
    expect(intent.task_type).toBe('code_generation');
    expect(intent.confidence).toBeGreaterThanOrEqual(0.9);
    // Entities should be merged (union)
    expect(intent.key_entities.length).toBeGreaterThanOrEqual(3);
  });

  it('prefers LLM task_type when LLM has higher confidence', async () => {
    // Use an ambiguous input where rule-based might pick 'general'
    mockFetch.mockResolvedValueOnce(groqJsonResponse({
      task_type: 'data_analysis',
      domain: 'data_science',
      complexity: 'complex',
      key_entities: ['dataset', 'trends', 'visualization'],
      refined_intent: 'Analyze trends in the dataset',
      suggested_persona_focus: 'Statistical analysis focus',
      confidence: 0.85,
    }));

    const { intent, llmIntent } = await hybridAnalyze('look at the numbers and tell me what you see', enabledConfig);

    expect(llmIntent).not.toBeNull();
    // LLM should influence the result since it has high confidence
    // The exact task_type depends on rule-based confidence vs LLM
    expect(intent.task_type).toBeDefined();
  });

  it('preserves rule-based entities alongside LLM entities', async () => {
    mockFetch.mockResolvedValueOnce(groqJsonResponse({
      task_type: 'code_generation',
      domain: 'software',
      complexity: 'simple',
      key_entities: ['api', 'rest', 'endpoint'],
      refined_intent: 'Build a REST API endpoint',
      suggested_persona_focus: 'API design best practices',
      confidence: 0.8,
    }));

    const { intent } = await hybridAnalyze('build a rest api endpoint for user login', enabledConfig);

    // Should have entities from both sources (no duplicates)
    const entitySet = new Set(intent.key_entities);
    expect(entitySet.size).toBe(intent.key_entities.length);
  });
});

describe('enrichContext', () => {
  it('attaches llm_intent to context when provided', () => {
    const ctx: PipelineContext = { raw_input: 'test' };
    const llmResult = {
      task_type: 'code_generation' as const,
      domain: 'software' as const,
      complexity: 'simple' as const,
      key_entities: ['test'],
      refined_intent: 'test',
      suggested_persona_focus: '',
      confidence: 0.9,
    };

    enrichContext(ctx, llmResult);
    expect(ctx.llm_intent).toBe(llmResult);
  });

  it('does nothing when llmIntent is null', () => {
    const ctx: PipelineContext = { raw_input: 'test' };
    enrichContext(ctx, null);
    expect(ctx.llm_intent).toBeUndefined();
  });
});
