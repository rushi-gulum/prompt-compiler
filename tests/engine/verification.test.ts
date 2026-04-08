/**
 * Final Verification Checklist — tasks.md requirements
 */
import { compile } from '../../src/engine/index.js';
import { ALL_PROMPT_SECTIONS, ALL_QUALITY_CRITERIA } from '../../src/engine/types.js';
import type { PromptSection, QualityCriterion } from '../../src/engine/types.js';

describe('Final Verification Checklist', () => {
  test('compile("") → { success: false, error: { code: "INPUT_EMPTY" } }', async () => {
    const result = await compile('');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INPUT_EMPTY');
    }
  });

  test('compile("write a python sort function") → quality_score ≥ 12', async () => {
    const result = await compile('write a python sort function');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quality_score).toBeGreaterThanOrEqual(12);
    }
  });

  test('compile("<h1>test</h1>") sanitizes HTML and succeeds', async () => {
    const result = await compile('<h1>test</h1>');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.prompt).not.toContain('<h1>');
    }
  });

  test('all 8 PromptSection keys present in every result', async () => {
    const result = await compile('Design a REST API for a bookstore');
    expect(result.success).toBe(true);
    if (result.success) {
      for (const section of ALL_PROMPT_SECTIONS) {
        expect(result.data.sections).toHaveProperty(section);
        expect(result.data.sections[section as PromptSection].length).toBeGreaterThan(0);
      }
    }
  });

  test('all 12 QualityCriterion keys present in every quality_breakdown', async () => {
    const result = await compile('Analyze customer data for churn prediction');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Object.keys(result.data.quality_breakdown)).toHaveLength(ALL_QUALITY_CRITERIA.length);
      for (const criterion of ALL_QUALITY_CRITERIA) {
        expect(result.data.quality_breakdown).toHaveProperty(criterion);
      }
    }
  });

  test('metadata.processing_time_ms is positive', async () => {
    const result = await compile('Write a function to calculate Fibonacci numbers');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata.processing_time_ms).toBeGreaterThan(0);
    }
  });

  test('no external runtime dependencies (devDependencies only)', async () => {
    // This is a structural check — package.json should have no "dependencies" key with entries
    const pkg = await import('../../package.json', { with: { type: 'json' } });
    const deps = pkg.default.dependencies;
    expect(deps).toBeUndefined();
  });
});
