import type { IntentResult, TaskType } from '../types.js';
import { taskPatterns } from '../data/task-patterns.js';
import { tokenize, extractKeywords, detectComplexity, normalizeText } from '../utils/text-utils.js';
import { ALL_TASK_TYPES } from '../types.js';

/** Stage 1: Extract intent, task type, complexity, entities, and confidence */
export function extractIntent(input: string): IntentResult {
  const normalized = normalizeText(input);
  const tokens = tokenize(normalized);
  const keywords = extractKeywords(normalized);

  // Score each task type by pattern matching
  const scores = new Map<TaskType, number>();

  for (const taskType of ALL_TASK_TYPES) {
    const patterns = taskPatterns[taskType];
    let score = 0;

    for (const pattern of patterns) {
      if (typeof pattern === 'string') {
        // Check if pattern (possibly multi-word) appears in normalized text
        if (normalized.includes(pattern.toLowerCase())) {
          score += 1;
        }
      } else {
        // RegExp match against full normalized text
        if (pattern.test(normalized)) {
          score += 1;
        }
      }
    }

    scores.set(taskType, score);
  }

  // Sort by score descending
  const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const topScore = sorted[0][1];
  const totalPatternMatches = [...scores.values()].reduce((a, b) => a + b, 0);

  // Determine primary task type
  let primary: TaskType = sorted[0][0];
  let confidence = totalPatternMatches > 0 ? topScore / Math.max(totalPatternMatches, 1) : 0;

  // Also compute confidence relative to input length
  const inputConfidence = topScore / Math.max(tokens.length, 1);
  confidence = Math.min(Math.max(confidence, inputConfidence), 1.0);

  // Low confidence fallback
  if (confidence < 0.4 && topScore <= 1) {
    primary = 'general';
    confidence = Math.min(confidence, 0.35);
  }

  // Secondary types: those with >= 50% of primary score
  const secondaryThreshold = topScore * 0.5;
  const secondary: TaskType[] = sorted
    .filter(([type, score]) => type !== primary && score >= secondaryThreshold && score > 0)
    .map(([type]) => type);

  // Collect all pattern signal words for entity filtering
  const allSignalWords = new Set<string>();
  for (const patterns of Object.values(taskPatterns)) {
    for (const p of patterns) {
      if (typeof p === 'string') {
        for (const word of p.toLowerCase().split(/\s+/)) {
          allSignalWords.add(word);
        }
      }
    }
  }

  // Key entities: meaningful keywords that aren't task signal words
  const entities = keywords.filter(
    k => k.length > 3 && !allSignalWords.has(k)
  );

  // Complexity detection using technical terms from entities
  const complexity = detectComplexity(normalized, entities);

  return {
    intent: normalized,
    task_type: primary,
    complexity,
    key_entities: [...new Set(entities)],
    secondary_types: secondary.slice(0, 5),
    confidence: Math.round(confidence * 100) / 100,
  };
}
