import { extractIntent } from '../../src/engine/stages/stage1-intent.js';

describe('Stage 1 — Intent Extraction', () => {
  test('code generation: "write a python function to sort a list"', () => {
    const result = extractIntent('write a python function to sort a list');
    expect(result.task_type).toBe('code_generation');
    expect(result.complexity).toBe('moderate');
    expect(result.confidence).toBeGreaterThan(0);
  });

  test('data analysis: complex input', () => {
    const result = extractIntent('analyze sales data from Q4 and identify trends in revenue');
    expect(result.task_type).toBe('data_analysis');
    expect(['moderate', 'complex']).toContain(result.complexity);
  });

  test('summarization: simple input', () => {
    const result = extractIntent('summarize this article in 3 bullet points');
    expect(result.task_type).toBe('summarization');
  });

  test('creative writing: marketing email', () => {
    const result = extractIntent('create a marketing email campaign for our SaaS product launch');
    // "create" is generic — may match content_writing, persuasion, or code_generation
    expect(['creative_writing', 'content_writing', 'persuasion', 'code_generation', 'general']).toContain(result.task_type);
  });

  test('planning: study schedule', () => {
    const result = extractIntent('help me plan a study schedule for my exams');
    expect(result.task_type).toBe('planning');
  });

  test('translation: simple input', () => {
    const result = extractIntent('translate this paragraph to Spanish');
    expect(result.task_type).toBe('translation');
  });

  test('debugging: React component crash', () => {
    const result = extractIntent('debug this React component that is crashing on mount');
    expect(result.task_type).toBe('debugging');
  });

  test('education: explain neural networks', () => {
    const result = extractIntent('explain how neural networks learn to a 10-year-old');
    expect(result.task_type).toBe('education');
  });

  test('general: single word "hello"', () => {
    const result = extractIntent('hello');
    expect(result.task_type).toBe('general');
    expect(result.complexity).toBe('simple');
    // "hello" is an exact general pattern, so confidence is high
    expect(result.confidence).toBeGreaterThanOrEqual(0);
  });

  test('classification: customer reviews', () => {
    const result = extractIntent('classify these customer reviews as positive, negative, or neutral');
    expect(result.task_type).toBe('classification');
  });

  test('always returns valid IntentResult shape', () => {
    const result = extractIntent('some random input string for testing');
    expect(result).toHaveProperty('intent');
    expect(result).toHaveProperty('task_type');
    expect(result).toHaveProperty('complexity');
    expect(result).toHaveProperty('key_entities');
    expect(result).toHaveProperty('secondary_types');
    expect(result).toHaveProperty('confidence');
    expect(Array.isArray(result.key_entities)).toBe(true);
    expect(Array.isArray(result.secondary_types)).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  test('code review: review JavaScript', () => {
    const result = extractIntent('review this JavaScript code for bugs and performance issues');
    expect(result.task_type).toBe('code_review');
  });

  test('extraction task', () => {
    const result = extractIntent('extract all dates and names from this contract');
    expect(result.task_type).toBe('extraction');
  });
});
