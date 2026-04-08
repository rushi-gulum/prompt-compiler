import type { Complexity } from '../types.js';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'to', 'of', 'in', 'for', 'on',
  'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'about', 'against', 'between', 'above', 'below', 'after', 'before',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
  'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their',
  'this', 'that', 'these', 'those', 'and', 'but', 'or', 'nor', 'not',
  'so', 'if', 'then', 'than', 'too', 'very', 'can', 'just', 'don',
  'now', 'also', 'here', 'there', 'when', 'where', 'how', 'all',
  'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'only', 'own', 'same', 'up', 'out', 'off',
]);

/** Lowercase, strip punctuation, split into tokens */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-_+#]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0);
}

/** Extract meaningful keywords (removes stop words) */
export function extractKeywords(text: string): string[] {
  return tokenize(text).filter(t => !STOP_WORDS.has(t) && t.length > 1);
}

/** Lowercase + trim + collapse whitespace */
export function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

/** Estimate complexity from word count + technical term density */
export function detectComplexity(text: string, technicalTerms: string[]): Complexity {
  const tokens = tokenize(text);
  const wordCount = tokens.length;
  const techCount = countTechnicalTerms(tokens, technicalTerms);

  if (techCount >= 4) return 'complex';
  if (wordCount > 25) return 'complex';
  if (wordCount >= 8) return 'moderate';
  return 'simple';
}

/** Count how many tokens are technical/domain terms */
export function countTechnicalTerms(tokens: string[], termList: string[]): number {
  const termSet = new Set(termList.map(t => t.toLowerCase()));
  return tokens.filter(t => termSet.has(t)).length;
}

/** Strip HTML tags and control characters */
export function sanitizeInput(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
}

/** Truncate to maxLength, return { text, truncated } */
export function truncateInput(text: string, maxLength: number): { text: string; truncated: boolean } {
  if (text.length <= maxLength) {
    return { text, truncated: false };
  }
  return { text: text.slice(0, maxLength), truncated: true };
}
