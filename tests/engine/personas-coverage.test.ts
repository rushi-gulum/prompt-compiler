import { personaLibrary, domainBasePersonas, generalistPersona, taskModifiers } from '../../src/engine/data/personas.js';
import { ALL_DOMAIN_TYPES, ALL_TASK_TYPES } from '../../src/engine/types.js';
import type { PersonaResult } from '../../src/engine/types.js';

describe('Persona Library Coverage', () => {
  const allCuratedPersonas: { domain: string; taskType: string; persona: PersonaResult }[] = [];

  for (const [domain, tasks] of Object.entries(personaLibrary)) {
    if (!tasks) continue;
    for (const [taskType, persona] of Object.entries(tasks)) {
      if (!persona) continue;
      allCuratedPersonas.push({ domain, taskType, persona });
    }
  }

  test('has ≥110 curated personas in personaLibrary', () => {
    expect(allCuratedPersonas.length).toBeGreaterThanOrEqual(110);
  });

  test('all curated personas have all required fields', () => {
    for (const { domain, taskType, persona } of allCuratedPersonas) {
      const label = `${domain}.${taskType}`;
      expect(persona.role_title).toBeTruthy();
      expect(typeof persona.role_title).toBe('string');
      expect(persona.role_definition.length).toBeGreaterThanOrEqual(20);
      expect(persona.expertise_areas.length).toBeGreaterThanOrEqual(3);
      expect(persona.methodology.length).toBeGreaterThanOrEqual(10);
      expect(persona.communication_style.length).toBeGreaterThanOrEqual(5);
      expect(persona.experience_years).toBeGreaterThanOrEqual(4);
      expect(persona.experience_years).toBeLessThanOrEqual(20);
    }
  });

  test('no duplicate role_titles across the entire curated library', () => {
    const titles = allCuratedPersonas.map(p => p.persona.role_title);
    const duplicates = titles.filter((t, i) => titles.indexOf(t) !== i);
    expect(duplicates).toEqual([]);
  });

  test('all 16 domains have base personas in domainBasePersonas', () => {
    for (const domain of ALL_DOMAIN_TYPES) {
      expect(domainBasePersonas[domain]).toBeDefined();
      expect(domainBasePersonas[domain].role_title).toBeTruthy();
    }
  });

  test('all 24 task types have modifiers in taskModifiers', () => {
    for (const taskType of ALL_TASK_TYPES) {
      expect(taskModifiers[taskType]).toBeDefined();
      expect(taskModifiers[taskType].methodology).toBeTruthy();
      expect(taskModifiers[taskType].communication_style).toBeTruthy();
    }
  });

  test('generalistPersona exists and has all fields', () => {
    expect(generalistPersona.role_title).toBeTruthy();
    expect(generalistPersona.role_definition).toBeTruthy();
    expect(generalistPersona.expertise_areas.length).toBeGreaterThanOrEqual(3);
    expect(generalistPersona.methodology).toBeTruthy();
    expect(generalistPersona.communication_style).toBeTruthy();
    expect(generalistPersona.experience_years).toBeGreaterThanOrEqual(1);
  });

  test('each domain in personaLibrary uses only valid TaskTypes', () => {
    for (const { taskType } of allCuratedPersonas) {
      expect(ALL_TASK_TYPES).toContain(taskType);
    }
  });

  test('each domain in personaLibrary uses only valid DomainTypes', () => {
    for (const { domain } of allCuratedPersonas) {
      expect(ALL_DOMAIN_TYPES).toContain(domain);
    }
  });

  test('persona cache hit rate across 50 diverse inputs ≥85%', () => {
    // A "cache hit" means the (domain, task_type) pair exists in personaLibrary
    const testPairs: [string, string][] = [
      ['software', 'code_generation'], ['software', 'code_review'], ['software', 'debugging'],
      ['software', 'planning'], ['software', 'education'], ['software', 'architecture_design'],
      ['data_science', 'data_analysis'], ['data_science', 'code_generation'], ['data_science', 'extraction'],
      ['data_science', 'summarization'], ['data_science', 'research'],
      ['artificial_intelligence', 'code_generation'], ['artificial_intelligence', 'research'],
      ['artificial_intelligence', 'classification'], ['artificial_intelligence', 'education'],
      ['cybersecurity', 'code_review'], ['cybersecurity', 'planning'], ['cybersecurity', 'data_analysis'],
      ['cybersecurity', 'classification'], ['cybersecurity', 'extraction'],
      ['creative', 'creative_writing'], ['creative', 'translation'], ['creative', 'summarization'],
      ['creative', 'content_writing'],
      ['business', 'planning'], ['business', 'persuasion'], ['business', 'summarization'],
      ['business', 'data_analysis'], ['business', 'research'],
      ['finance', 'data_analysis'], ['finance', 'planning'], ['finance', 'research'],
      ['finance', 'extraction'],
      ['legal', 'summarization'], ['legal', 'extraction'], ['legal', 'classification'],
      ['legal', 'research'],
      ['medical', 'education'], ['medical', 'qa_rag'], ['medical', 'research'],
      ['medical', 'extraction'],
      ['education', 'education'], ['education', 'summarization'], ['education', 'planning'],
      ['education', 'qa_rag'],
      ['marketing', 'creative_writing'], ['marketing', 'persuasion'], ['marketing', 'data_analysis'],
      ['science', 'data_analysis'], ['science', 'research'],
      ['engineering', 'code_generation'], ['engineering', 'planning'],
    ];

    let hits = 0;
    for (const [domain, taskType] of testPairs) {
      const domainPersonas = personaLibrary[domain as keyof typeof personaLibrary];
      if (domainPersonas && domainPersonas[taskType as keyof typeof domainPersonas]) {
        hits++;
      }
    }

    const hitRate = hits / testPairs.length;
    expect(hitRate).toBeGreaterThanOrEqual(0.85);
  });
});
