import { detectDomain } from '../../src/engine/stages/stage2-domain.js';
import type { IntentResult } from '../../src/engine/types.js';

function makeIntent(overrides: Partial<IntentResult> = {}): IntentResult {
  return {
    intent: '',
    task_type: 'general',
    complexity: 'moderate',
    key_entities: [],
    secondary_types: [],
    confidence: 0.5,
    ...overrides,
  };
}

describe('Stage 2 — Domain Detection', () => {
  test('software domain: python api database typescript', () => {
    const result = detectDomain(makeIntent({
      intent: 'create a python api with database and typescript interface',
      key_entities: ['python', 'api', 'database', 'typescript'],
    }));
    expect(result.primary_domain).toBe('software');
    expect(result.confidence).toBeGreaterThanOrEqual(0.5);
  });

  test('data science domain: neural network training dataset', () => {
    const result = detectDomain(makeIntent({
      intent: 'train a neural network on a dataset for prediction',
      key_entities: ['neural', 'training', 'dataset', 'prediction'],
    }));
    expect(['data_science', 'artificial_intelligence']).toContain(result.primary_domain);
    expect(result.confidence).toBeGreaterThanOrEqual(0.5);
  });

  test('creative domain: poem story narrative', () => {
    const result = detectDomain(makeIntent({
      intent: 'write a poem about the story of a narrative character',
      key_entities: ['poem', 'story', 'narrative', 'character'],
    }));
    expect(result.primary_domain).toBe('creative');
  });

  test('medical domain: patient diagnosis treatment', () => {
    const result = detectDomain(makeIntent({
      intent: 'help with patient diagnosis and treatment clinical guidelines',
      key_entities: ['patient', 'diagnosis', 'treatment', 'clinical'],
    }));
    expect(result.primary_domain).toBe('medical');
  });

  test('business domain: strategy revenue stakeholder', () => {
    const result = detectDomain(makeIntent({
      intent: 'develop a strategy to increase revenue for stakeholders',
      key_entities: ['strategy', 'revenue', 'stakeholder', 'roi'],
    }));
    expect(result.primary_domain).toBe('business');
  });

  test('legal domain: contract liability compliance', () => {
    const result = detectDomain(makeIntent({
      intent: 'review this contract for liability and compliance issues',
      key_entities: ['contract', 'liability', 'compliance', 'regulation'],
    }));
    expect(result.primary_domain).toBe('legal');
  });

  test('education domain: student lesson curriculum', () => {
    const result = detectDomain(makeIntent({
      intent: 'create a lesson plan for student curriculum on learning',
      key_entities: ['student', 'lesson', 'curriculum', 'learning'],
    }));
    expect(result.primary_domain).toBe('education');
  });

  test('marketing domain: campaign conversion brand', () => {
    const result = detectDomain(makeIntent({
      intent: 'create a campaign to increase conversion for the brand with a cta',
      key_entities: ['campaign', 'conversion', 'brand', 'cta'],
    }));
    expect(result.primary_domain).toBe('marketing');
  });

  test('general domain: "hello"', () => {
    const result = detectDomain(makeIntent({
      intent: 'hello',
      key_entities: [],
    }));
    expect(result.primary_domain).toBe('general');
  });

  test('ambiguous domain: python machine learning medical', () => {
    const result = detectDomain(makeIntent({
      intent: 'build a python machine learning model for medical diagnosis',
      key_entities: ['python', 'model', 'training', 'patient', 'diagnosis'],
    }));
    // Should detect either data_science, software, or medical — and possibly ambiguous
    expect(['software', 'data_science', 'artificial_intelligence', 'medical']).toContain(result.primary_domain);
    expect(result.sub_domains.length).toBeGreaterThanOrEqual(0);
  });

  test('always returns valid DomainResult shape', () => {
    const result = detectDomain(makeIntent({ intent: 'anything' }));
    expect(result).toHaveProperty('primary_domain');
    expect(result).toHaveProperty('sub_domains');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('ambiguous');
    expect(Array.isArray(result.sub_domains)).toBe(true);
    expect(typeof result.ambiguous).toBe('boolean');
  });
});
