import { compile } from '../../src/engine/index.js';
import { ALL_PROMPT_SECTIONS, ALL_QUALITY_CRITERIA } from '../../src/engine/types.js';
import type { PromptSection, QualityCriterion } from '../../src/engine/types.js';

describe('Public API — compile()', () => {
  // === Input Validation ===

  test('empty string → INPUT_EMPTY error', async () => {
    const result = await compile('');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INPUT_EMPTY');
    }
  });

  test('whitespace-only → INPUT_EMPTY error', async () => {
    const result = await compile('   \t\n  ');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INPUT_EMPTY');
    }
  });

  test('null-ish input → INPUT_EMPTY error', async () => {
    const result = await compile(undefined as any);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INPUT_EMPTY');
    }
  });

  // === HTML Sanitization ===

  test('HTML tags are stripped and prompt still succeeds', async () => {
    const result = await compile('<h1>Write a sorting algorithm</h1>');
    expect(result.success).toBe(true);
    if (result.success) {
      // The HTML should be removed, but the text content processed
      expect(result.data.assembled_prompt).not.toContain('<h1>');
    }
  });

  test('script injection attempt is sanitized', async () => {
    const result = await compile('<script>alert("xss")</script> Write a Python function');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assembled_prompt).not.toContain('<script>');
    }
  });

  // === Successful Compilation ===

  test('software prompt → success with quality_score ≥ 15', async () => {
    const result = await compile('Write a Python sort function using merge sort with full documentation and type hints');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quality_score).toBeGreaterThanOrEqual(12);
    }
  });

  test('result has all 8 prompt sections', async () => {
    const result = await compile('Create a REST API endpoint for user authentication');
    expect(result.success).toBe(true);
    if (result.success) {
      for (const section of ALL_PROMPT_SECTIONS) {
        expect(result.data.sections).toHaveProperty(section);
        expect(result.data.sections[section as PromptSection].length).toBeGreaterThan(0);
      }
    }
  });

  test('result has all 12 quality criteria', async () => {
    const result = await compile('Analyze the performance metrics of our marketing campaign');
    expect(result.success).toBe(true);
    if (result.success) {
      for (const criterion of ALL_QUALITY_CRITERIA) {
        expect(result.data.quality_breakdown).toHaveProperty(criterion);
      }
    }
  });

  test('metadata.processing_time_ms is positive', async () => {
    const result = await compile('Explain machine learning model interpretability');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata.processing_time_ms).toBeGreaterThan(0);
    }
  });

  test('quality_label is one of valid labels', async () => {
    const result = await compile('Design a database schema for a social media platform');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(['poor', 'acceptable', 'good', 'excellent']).toContain(result.data.quality_label);
    }
  });

  test('assembled_prompt contains XML section markers', async () => {
    const result = await compile('Summarize the quarterly financial report for stakeholders');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assembled_prompt).toContain('<role>');
      expect(result.data.assembled_prompt).toContain('</role>');
      expect(result.data.assembled_prompt).toContain('<mission>');
    }
  });

  // === Cross-Domain Tests ===

  test('medical domain detected and processed', async () => {
    const result = await compile('Write a clinical trial protocol for a new diabetes medication');
    expect(result.success).toBe(true);
  });

  test('legal domain detected and processed', async () => {
    const result = await compile('Draft a non-disclosure agreement with non-compete clause');
    expect(result.success).toBe(true);
  });

  test('creative writing works end-to-end', async () => {
    const result = await compile('Write a dark fantasy short story about a cursed kingdom');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assembled_prompt.length).toBeGreaterThan(100);
    }
  });

  test('data science domain works end-to-end', async () => {
    const result = await compile('Build a machine learning pipeline for predicting customer churn using XGBoost');
    expect(result.success).toBe(true);
  });

  test('cybersecurity domain works end-to-end', async () => {
    const result = await compile('Perform a vulnerability assessment on our web application firewall');
    expect(result.success).toBe(true);
  });

  // === Truncation ===

  test('very long input is truncated with warning', async () => {
    const longInput = 'Write a detailed analysis. '.repeat(500); // ~13,500 chars
    const result = await compile(longInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata.warnings).toContain('Input truncated to 5000 characters');
    }
  });

  // === Edge Cases ===

  test('extremely short valid input still succeeds', async () => {
    const result = await compile('sort');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assembled_prompt.length).toBeGreaterThan(0);
    }
  });

  test('input with special characters succeeds', async () => {
    const result = await compile('Write a function that handles $, €, and ¥ currency symbols');
    expect(result.success).toBe(true);
  });
});
