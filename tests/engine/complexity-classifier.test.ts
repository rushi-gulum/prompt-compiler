import { classifyComplexity } from '../../src/engine/scoring/complexity-classifier.js';

describe('Complexity Classifier', () => {
  it('identifies simple prompts correctly (Fast Path)', () => {
    expect(classifyComplexity('fix typo')).toBe('simple');
    expect(classifyComplexity('translate to french')).toBe('simple');
    expect(classifyComplexity('')).toBe('simple');
  });

  it('identifies moderate prompts (Deep Path)', () => {

    expect(classifyComplexity('create a python script with constraints')).toBe('moderate');
  });

  it('identifies complex prompts based on length (Deep Path)', () => {
    const longPrompt = Array(50).fill('some word').join(' ');
    expect(classifyComplexity(longPrompt)).toBe('complex');
  });
});
