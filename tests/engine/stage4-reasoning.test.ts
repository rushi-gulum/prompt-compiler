import { selectReasoning } from '../../src/engine/stages/stage4-reasoning.js';
import type { IntentResult, PersonaResult } from '../../src/engine/types.js';

function makeIntent(complexity: string, task_type: string): IntentResult {
  return {
    intent: 'test',
    task_type: task_type as IntentResult['task_type'],
    complexity: complexity as IntentResult['complexity'],
    key_entities: [],
    secondary_types: [],
    confidence: 0.8,
  };
}

const mockPersona: PersonaResult = {
  role_title: 'Test Expert',
  role_definition: 'A test expert.',
  expertise_areas: ['testing'],
  methodology: 'Test methodology.',
  communication_style: 'Direct.',
  experience_years: 10,
};

describe('Stage 4 — Reasoning Strategy', () => {
  test('simple + code_generation → depth: none, verification: true', () => {
    const result = selectReasoning(makeIntent('simple', 'code_generation'), mockPersona);
    expect(result.depth_level).toBe('none');
    expect(result.verification_needed).toBe(true);
    expect(result.thinking_budget).toBe('minimal');
  });

  test('moderate + creative_writing → depth: standard, verification: false', () => {
    const result = selectReasoning(makeIntent('moderate', 'creative_writing'), mockPersona);
    expect(result.depth_level).toBe('standard');
    expect(result.verification_needed).toBe(false);
    expect(result.thinking_budget).toBe('standard');
  });

  test('complex + data_analysis → depth: deep, verification: true', () => {
    const result = selectReasoning(makeIntent('complex', 'data_analysis'), mockPersona);
    expect(result.depth_level).toBe('deep');
    expect(result.verification_needed).toBe(true);
    expect(result.thinking_budget).toBe('maximum');
  });

  test('simple + summarization → depth: none, verification: false', () => {
    const result = selectReasoning(makeIntent('simple', 'summarization'), mockPersona);
    expect(result.depth_level).toBe('none');
    expect(result.verification_needed).toBe(false);
    expect(result.thinking_budget).toBe('minimal');
  });

  test('moderate + planning → depth: standard, verification: true, budget: deep', () => {
    const result = selectReasoning(makeIntent('moderate', 'planning'), mockPersona);
    expect(result.depth_level).toBe('standard');
    expect(result.verification_needed).toBe(true);
    expect(result.thinking_budget).toBe('deep');
  });

  test('complex + education → depth: deep, verification: false', () => {
    const result = selectReasoning(makeIntent('complex', 'education'), mockPersona);
    expect(result.depth_level).toBe('deep');
    expect(result.verification_needed).toBe(false);
    expect(result.thinking_budget).toBe('maximum');
  });

  test('simple + planning → depth: none, verification: true', () => {
    const result = selectReasoning(makeIntent('simple', 'planning'), mockPersona);
    expect(result.depth_level).toBe('none');
    expect(result.verification_needed).toBe(true);
  });

  test('complex + code_review → depth: deep, verification: true', () => {
    const result = selectReasoning(makeIntent('complex', 'code_review'), mockPersona);
    expect(result.depth_level).toBe('deep');
    expect(result.verification_needed).toBe(true);
    expect(result.thinking_budget).toBe('maximum');
  });

  test('reasoning_approach is a non-empty string', () => {
    const result = selectReasoning(makeIntent('moderate', 'education'), mockPersona);
    expect(result.reasoning_approach).toBeDefined();
    expect(result.reasoning_approach.length).toBeGreaterThan(10);
  });

  test('deep reasoning includes scratchpad/structured', () => {
    const result = selectReasoning(makeIntent('complex', 'general'), mockPersona);
    expect(result.reasoning_approach).toMatch(/scratchpad|structured/i);
  });
});
