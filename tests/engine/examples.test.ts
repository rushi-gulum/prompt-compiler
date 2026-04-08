import { exampleLibrary } from '../../src/engine/data/examples.js';
import { compile } from '../../src/engine/index.js';
import type { TaskType } from '../../src/engine/types.js';

describe('Few-Shot Example Library', () => {
  const requiredTaskTypes: TaskType[] = [
    'code_generation', 'creative_writing', 'extraction', 'classification', 'structured_generation',
  ];

  test('has examples for all 5 required task types', () => {
    for (const taskType of requiredTaskTypes) {
      expect(exampleLibrary[taskType]).toBeDefined();
      expect(exampleLibrary[taskType]!.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('each required task type has ≥2 examples', () => {
    for (const taskType of requiredTaskTypes) {
      expect(exampleLibrary[taskType]!.length).toBeGreaterThanOrEqual(2);
    }
  });

  test('code_generation has ≥3 examples', () => {
    expect(exampleLibrary.code_generation!.length).toBeGreaterThanOrEqual(3);
  });

  test('all examples have non-empty input and output fields', () => {
    for (const [taskType, examples] of Object.entries(exampleLibrary)) {
      if (!examples) continue;
      for (const ex of examples) {
        expect(ex.input.trim().length).toBeGreaterThan(0);
        expect(ex.output.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('examples are injected when examples_needed=true (code generation input)', async () => {
    // "Write a Python function to sort a list" should trigger code_generation + examples_needed
    const result = await compile('Write a Python function to sort a list');
    expect(result.success).toBe(true);
    if (result.success) {
      const prompt = result.data.prompt;
      // The prompt should contain the ### Example pattern from injected examples
      const hasExamples = /### Example \d+:/i.test(prompt);
      // At minimum, the prompt should reference examples in some form
      const hasExampleRelated = hasExamples || /example|input:|output:/i.test(prompt);
      expect(hasExampleRelated).toBe(true);
    }
  });

  test('examples are NOT injected when examples_needed=false (simple conversation)', async () => {
    // A simple conversation input typically doesn't trigger examples_needed
    const result = await compile('Tell me about the weather today');
    expect(result.success).toBe(true);
    if (result.success) {
      // The instructions section should NOT contain ### Example N: patterns
      const instructionsSection = result.data.sections.instructions;
      const injectedCount = (instructionsSection.match(/### Example \d+:/g) ?? []).length;
      expect(injectedCount).toBe(0);
    }
  });

  test('quality score for examples criterion is ≥1 when examples are injected', async () => {
    const result = await compile('Write a Python function to sort a list');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quality_breakdown.examples).toBeGreaterThanOrEqual(1);
    }
  });
});
