import { runPipeline } from '../../src/engine/pipeline.js';
import { ALL_PROMPT_SECTIONS, ALL_QUALITY_CRITERIA } from '../../src/engine/types.js';
import type { PromptSection, QualityCriterion } from '../../src/engine/types.js';

describe('Pipeline Orchestrator', () => {
  test('produces complete context for a software prompt', async () => {
    const ctx = await runPipeline('Write a Python function to sort a list using merge sort');
    expect(ctx.raw_input).toBe('Write a Python function to sort a list using merge sort');
    expect(ctx.intent).toBeDefined();
    expect(ctx.domain).toBeDefined();
    expect(ctx.persona).toBeDefined();
    expect(ctx.reasoning).toBeDefined();
    expect(ctx.structure).toBeDefined();
    expect(ctx.result).toBeDefined();
  });

  test('intent stage extracts a valid task_type', async () => {
    const ctx = await runPipeline('Summarize this quarterly earnings report');
    expect(['summarization', 'general', 'content_writing']).toContain(ctx.intent!.task_type);
  });

  test('domain detection identifies correct primary domain', async () => {
    const ctx = await runPipeline('Analyze the ROI of our marketing campaign using regression analysis');
    expect(['data_science', 'marketing', 'business', 'finance']).toContain(ctx.domain!.primary_domain);
  });

  test('persona has meaningful role_title', async () => {
    const ctx = await runPipeline('Write a legal brief for a patent infringement case');
    expect(ctx.persona!.role_title.length).toBeGreaterThan(0);
  });

  test('reasoning produces valid depth and budget', async () => {
    const ctx = await runPipeline('Debug this complex memory leak in the C++ allocator');
    expect(['none', 'standard', 'deep']).toContain(ctx.reasoning!.depth_level);
    expect(['minimal', 'light', 'standard', 'deep', 'maximum']).toContain(ctx.reasoning!.thinking_budget);
  });

  test('structure produces valid output_format', async () => {
    const ctx = await runPipeline('Create an API endpoint for user authentication in Node.js');
    expect(['prose', 'list', 'table', 'code', 'json', 'markdown', 'diagram', 'mixed']).toContain(ctx.structure!.output_format);
  });

  test('result contains all 8 prompt sections', async () => {
    const ctx = await runPipeline('Design a database schema for an e-commerce platform');
    for (const section of ALL_PROMPT_SECTIONS) {
      expect(ctx.result!.sections).toHaveProperty(section);
      expect(ctx.result!.sections[section as PromptSection].length).toBeGreaterThan(0);
    }
  });

  test('result has quality_breakdown with all 12 criteria', async () => {
    const ctx = await runPipeline('Explain quantum computing to a beginner audience');
    for (const criterion of ALL_QUALITY_CRITERIA) {
      expect(ctx.result!.quality_breakdown).toHaveProperty(criterion);
    }
  });

  test('quality_score is in valid range', async () => {
    const ctx = await runPipeline('Build a machine learning model to predict housing prices');
    expect(ctx.result!.quality_score).toBeGreaterThanOrEqual(0);
    expect(ctx.result!.quality_score).toBeLessThanOrEqual(24);
  });

  test('assembled_prompt is non-empty with XML markers', async () => {
    const ctx = await runPipeline('Write a marketing email for a new SaaS product launch');
    expect(ctx.result!.prompt.length).toBeGreaterThan(100);
    expect(ctx.result!.prompt).toContain('<role>');
    expect(ctx.result!.prompt).toContain('</role>');
  });

  test('handles creative writing input', async () => {
    const ctx = await runPipeline('Write a short science fiction story about AI consciousness');
    expect(['creative_writing', 'code_generation']).toContain(ctx.intent!.task_type);
    expect(ctx.result).toBeDefined();
    expect(ctx.result!.quality_score).toBeGreaterThanOrEqual(0);
  });

  test('handles data science input', async () => {
    const ctx = await runPipeline('Create a data pipeline for ETL processing of clickstream data');
    expect(['data_science', 'software', 'engineering']).toContain(ctx.domain!.primary_domain);
    expect(ctx.result).toBeDefined();
  });

  test('handles medical domain input', async () => {
    const ctx = await runPipeline('Summarize the clinical trial results for the new cancer drug treatment');
    expect(['medical', 'science']).toContain(ctx.domain!.primary_domain);
    expect(ctx.result).toBeDefined();
  });

  test('handles legal domain input', async () => {
    const ctx = await runPipeline('Draft a non-disclosure agreement template with arbitration clause');
    expect(ctx.domain!.primary_domain).toBe('legal');
    expect(ctx.result).toBeDefined();
  });

  test('handles ambiguous or general input gracefully', async () => {
    const ctx = await runPipeline('help me with this thing');
    expect(ctx.intent).toBeDefined();
    expect(ctx.domain).toBeDefined();
    expect(ctx.persona).toBeDefined();
    expect(ctx.result).toBeDefined();
    expect(ctx.result!.prompt.length).toBeGreaterThan(0);
  });
});
