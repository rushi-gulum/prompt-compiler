import type { Complexity } from '../types.js';

const COMPLEXITY_KEYWORDS = [
  'format', 'json', 'markdown', 'xml', 'table', 'csv', 'schema',
  'rules', 'constraints', 'strict', 'always', 'never', 'must',
  'persona', 'expert', 'role', 'act as',
  'step', 'reasoning', 'scratchpad', 'think'
];

/**
 * Super-fast rule-based heuristic to determine input complexity.
 * Used for pre-processing routing (Fast Path vs Deep Path).
 */
export function classifyComplexity(text: string): Complexity {
  if (!text || text.trim().length === 0) return 'simple';

  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  const wordCount = words.length;

  let keywordHits = 0;
  for (const kw of COMPLEXITY_KEYWORDS) {
    if (lower.includes(kw)) {
      keywordHits++;
    }
  }

  // Fast Path condition: very short, no complex formatting/rules requested
  if (wordCount < 15 && keywordHits === 0) {
    return 'simple';
  }

  // Moderate condition: medium length or some structural hints
  if (wordCount < 40 && keywordHits <= 2) {
    return 'moderate';
  }

  // Complex condition: long text, explicit instructions, deep logic requested
  return 'complex';
}
