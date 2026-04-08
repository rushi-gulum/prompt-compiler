import { scorePrompt, getQualityLabel } from '../../src/engine/scoring/quality-scorer.js';
import type { PromptSection, PipelineContext } from '../../src/engine/types.js';
import { ALL_QUALITY_CRITERIA } from '../../src/engine/types.js';

function emptySections(): Record<PromptSection, string> {
  return {
    role: '',
    mission: '',
    behavioral_rules: '',
    context: '',
    reasoning: '',
    instructions: '',
    output_format: '',
    quality_standard: '',
  };
}

const minimalCtx: PipelineContext = { raw_input: 'test' };

describe('Quality Scorer', () => {
  test('empty sections → score 0, label poor', () => {
    const result = scorePrompt(emptySections(), minimalCtx);
    expect(result.score).toBe(0);
    expect(result.label).toBe('poor');
  });

  test('role only populated → score 1-2, label poor', () => {
    const sections = emptySections();
    sections.role = 'You are a Senior Software Engineer.';
    const result = scorePrompt(sections, minimalCtx);
    expect(result.score).toBeGreaterThanOrEqual(1);
    expect(result.score).toBeLessThanOrEqual(4);
    expect(result.label).toBe('poor');
  });

  test('5/8 sections minimally populated → acceptable range', () => {
    const sections = emptySections();
    sections.role = 'You are a Senior Software Engineer with experience.';
    sections.mission = 'Perform code generation to create a function.';
    sections.behavioral_rules = 'DO: Use type safety\nDO NOT: Skip tests';
    sections.instructions = '1. Write the function\n2. Add tests\n3. Review';
    sections.context = 'Audience level: professional. Domain: software.';
    const result = scorePrompt(sections, minimalCtx);
    expect(result.score).toBeGreaterThanOrEqual(7);
    expect(result.score).toBeLessThanOrEqual(16);
  });

  test('all 8 sections well-populated → good range', () => {
    const sections: Record<PromptSection, string> = {
      role: 'You are a Senior Software Engineer with 12+ years of experience and methodology in TDD. Specialization in TypeScript.',
      mission: 'Perform code generation of a sorting function in the software domain with specific complexity constraints.',
      behavioral_rules: '## Rules\n\nDO:\n1. ALWAYS: Use type-safe patterns\n2. ALWAYS: Handle errors\n\nDO NOT:\n1. NEVER: Use deprecated APIs\n2. NEVER: Skip tests',
      context: 'Audience level: professional. Domain: software. Key topics: TypeScript, sorting algorithms.',
      reasoning: '## Reasoning\nThink step-by-step before answering. Show your reasoning. Verify your answer.',
      instructions: '## Instructions\n1. Clarify the input types\n2. Implement the solution\n3. Handle edge cases\n4. Add type annotations\n5. Verify logic',
      output_format: 'Format: code\nProvide working code with comments.',
      quality_standard: '## Quality\n- Ensure accuracy and verify all claims.\n- Cite sources for factual claims.',
    };
    const result = scorePrompt(sections, minimalCtx);
    expect(result.score).toBeGreaterThanOrEqual(14);
    expect(result.score).toBeLessThanOrEqual(22);
  });

  test('all sections excellently populated → excellent range', () => {
    const sections: Record<PromptSection, string> = {
      role: '<role>You are a Senior Software Engineer with 12+ years of experience. Methodology: TDD with Clean Architecture. Specialization in distributed systems.</role>',
      mission: '<mission>Perform code generation of a binary search function to create efficient search code in the software domain. Complexity: moderate. Focus on delivering quality actionable code.</mission>',
      behavioral_rules: '<behavioral_rules>## Rules\nDO:\n1. ALWAYS: Use type-safe patterns\n2. ALWAYS: Handle errors\n3. ALWAYS: Follow SOLID\nDO NOT:\n1. NEVER: Use deprecated APIs\n2. NEVER: Skip error handling\n3. NEVER: Use global state</behavioral_rules>',
      context: '<context>Audience level: professional expert. Domain: software. Key topics: TypeScript, search algorithms. Adjust depth accordingly.</context>',
      reasoning: '<reasoning>## Reasoning\nThink step-by-step before answering. Use scratchpad to verify your answer. Verify each key claim.</reasoning>',
      instructions: '<instructions>## Instructions\n1. Define the function signature\n2. Implement binary search\n3. Handle edge cases\n4. Add type annotations\n5. Verify with test cases\n6. Review for completeness</instructions>',
      output_format: '<output_format>Format: code\nProvide working TypeScript code with json schema adherence.\nInput: array + target\nOutput: index\nInput: empty array\nOutput: -1</output_format>',
      quality_standard: '<quality_standard>## Quality\n- Ensure accuracy and verify all claims and source citations.\n- All code must compile and include error handling.\n- Ground responses in verifiable evidence.</quality_standard>',
    };
    const result = scorePrompt(sections, minimalCtx);
    expect(result.score).toBeGreaterThanOrEqual(18);
  });

  test('score = 24 → excellent', () => {
    expect(getQualityLabel(24)).toBe('excellent');
  });

  test('score = 0 → poor', () => {
    expect(getQualityLabel(0)).toBe('poor');
  });

  test('score = 15 → good', () => {
    expect(getQualityLabel(15)).toBe('good');
  });

  test('score = 9 → acceptable', () => {
    expect(getQualityLabel(9)).toBe('acceptable');
  });

  test('breakdown has exactly 12 keys', () => {
    const result = scorePrompt(emptySections(), minimalCtx);
    expect(Object.keys(result.breakdown)).toHaveLength(12);
    for (const criterion of ALL_QUALITY_CRITERIA) {
      expect(result.breakdown).toHaveProperty(criterion);
    }
  });

  test('score is always in [0, 24]', () => {
    const sections = emptySections();
    sections.role = 'Expert engineer.';
    const result = scorePrompt(sections, minimalCtx);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(24);
  });
});
