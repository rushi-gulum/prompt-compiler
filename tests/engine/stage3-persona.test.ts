import { mapPersona } from '../../src/engine/stages/stage3-persona.js';
import type { IntentResult, DomainResult } from '../../src/engine/types.js';

function makeIntent(task_type: string): IntentResult {
  return {
    intent: 'test',
    task_type: task_type as IntentResult['task_type'],
    complexity: 'moderate',
    key_entities: [],
    secondary_types: [],
    confidence: 0.8,
  };
}

function makeDomain(domain: string): DomainResult {
  return {
    primary_domain: domain as DomainResult['primary_domain'],
    sub_domains: [],
    confidence: 0.8,
    ambiguous: false,
  };
}

describe('Stage 3 — Persona Mapping', () => {
  test('software + code_generation → library hit (Senior Software Engineer)', async () => {
    const result = await mapPersona(makeIntent('code_generation'), makeDomain('software'));
    expect(result.role_title).toMatch(/senior software engineer/i);
    expect(result.experience_years).toBeGreaterThan(5);
  });

  test('data_science + data_analysis → library hit (Senior Data Scientist)', async () => {
    const result = await mapPersona(makeIntent('data_analysis'), makeDomain('data_science'));
    expect(result.role_title).toMatch(/data scientist/i);
  });

  test('medical + education → library hit (Medical Educator)', async () => {
    const result = await mapPersona(makeIntent('education'), makeDomain('medical'));
    expect(result.role_title).toMatch(/medical|clinical/i);
  });

  test('software + translation → composed persona (base + modifier)', async () => {
    const result = await mapPersona(makeIntent('translation'), makeDomain('software'));
    expect(result.role_title).toBeDefined();
    expect(result.methodology).toBeDefined();
    expect(result.methodology.length).toBeGreaterThan(10);
  });

  test('general + any_task → generalist persona', async () => {
    const result = await mapPersona(makeIntent('code_generation'), makeDomain('general'));
    expect(result.role_title).toBeDefined();
    expect(result.experience_years).toBeGreaterThan(0);
  });

  test('legal + code_generation → composed persona', async () => {
    const result = await mapPersona(makeIntent('code_generation'), makeDomain('legal'));
    expect(result.role_title).toBeDefined();
    expect(result.expertise_areas.length).toBeGreaterThan(0);
  });

  test('creative + planning → composed persona', async () => {
    const result = await mapPersona(makeIntent('planning'), makeDomain('creative'));
    expect(result.role_title).toBeDefined();
  });

  test('education + classification → composed persona', async () => {
    const result = await mapPersona(makeIntent('classification'), makeDomain('education'));
    expect(result.role_title).toBeDefined();
  });

  test('marketing + qa_rag → composed persona', async () => {
    const result = await mapPersona(makeIntent('qa_rag'), makeDomain('marketing'));
    expect(result.role_title).toBeDefined();
  });

  test('science + code_generation → composed persona', async () => {
    const result = await mapPersona(makeIntent('code_generation'), makeDomain('science'));
    expect(result.role_title).toBeDefined();
  });

  test('result never returns undefined fields', async () => {
    const result = await mapPersona(makeIntent('general'), makeDomain('general'));
    expect(result.role_title).toBeDefined();
    expect(result.role_definition).toBeDefined();
    expect(result.expertise_areas).toBeDefined();
    expect(result.methodology).toBeDefined();
    expect(result.communication_style).toBeDefined();
    expect(typeof result.experience_years).toBe('number');
  });
});
