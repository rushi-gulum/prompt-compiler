import { structureInstructions } from '../../src/engine/stages/stage5-structure.js';
import type { PipelineContext } from '../../src/engine/types.js';

function makeCtx(task_type: string, domain: string): PipelineContext {
  return {
    raw_input: 'test',
    intent: {
      intent: 'test',
      task_type: task_type as any,
      complexity: 'moderate',
      key_entities: [],
      secondary_types: [],
      confidence: 0.8,
    },
    domain: {
      primary_domain: domain as any,
      sub_domains: [],
      confidence: 0.8,
      ambiguous: false,
    },
    persona: {
      role_title: 'Test Expert',
      role_definition: 'A test expert.',
      expertise_areas: ['testing'],
      methodology: 'Test methodology.',
      communication_style: 'Direct.',
      experience_years: 10,
    },
  };
}

describe('Stage 5 — Instruction Structuring', () => {
  test('code_generation + software → code format, examples needed', () => {
    const result = structureInstructions(makeCtx('code_generation', 'software'));
    expect(result.output_format).toBe('code');
    expect(result.examples_needed).toBe(true);
    expect(result.instructions.length).toBeGreaterThanOrEqual(3);
    expect(result.instructions.length).toBeLessThanOrEqual(7);
  });

  test('data_analysis + data_science → mixed format', () => {
    const result = structureInstructions(makeCtx('data_analysis', 'data_science'));
    expect(result.output_format).toBe('mixed');
    expect(result.instructions.length).toBeGreaterThanOrEqual(3);
  });

  test('summarization + business → markdown format, no examples', () => {
    const result = structureInstructions(makeCtx('summarization', 'business'));
    expect(result.output_format).toBe('markdown');
    expect(result.examples_needed).toBe(false);
  });

  test('creative_writing + creative → examples needed', () => {
    const result = structureInstructions(makeCtx('creative_writing', 'creative'));
    expect(result.examples_needed).toBe(true);
    expect(result.instructions.length).toBeGreaterThanOrEqual(3);
  });

  test('education + education → professional audience', () => {
    const result = structureInstructions(makeCtx('education', 'education'));
    expect(result.audience_level).toBe('professional');
    expect(result.instructions.length).toBeGreaterThanOrEqual(3);
  });

  test('classification + general → list format, examples needed', () => {
    const result = structureInstructions(makeCtx('classification', 'general'));
    expect(result.output_format).toBe('list');
    expect(result.examples_needed).toBe(true);
  });

  test('qa_rag + medical → markdown format', () => {
    const result = structureInstructions(makeCtx('qa_rag', 'medical'));
    expect(result.output_format).toBe('markdown');
    expect(result.positive_constraints.length).toBeGreaterThan(0);
  });

  test('planning + business → markdown format', () => {
    const result = structureInstructions(makeCtx('planning', 'business'));
    expect(result.output_format).toBe('markdown');
    expect(result.instructions.length).toBeGreaterThanOrEqual(3);
  });

  test('translation + general → prose format, no examples', () => {
    const result = structureInstructions(makeCtx('translation', 'general'));
    expect(result.output_format).toBe('prose');
    expect(result.examples_needed).toBe(false);
  });

  test('persuasion + marketing → prose format', () => {
    const result = structureInstructions(makeCtx('persuasion', 'marketing'));
    expect(result.output_format).toBe('prose');
    expect(result.positive_constraints.length).toBeGreaterThan(0);
    expect(result.negative_constraints.length).toBeGreaterThan(0);
  });

  test('always includes positive and negative constraints', () => {
    const result = structureInstructions(makeCtx('general', 'software'));
    expect(result.positive_constraints.length).toBeGreaterThan(0);
    expect(result.negative_constraints.length).toBeGreaterThan(0);
  });
});
