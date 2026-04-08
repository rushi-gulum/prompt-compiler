import type { DomainResult, DomainType, IntentResult } from '../types.js';
import { domainKeywords } from '../data/domain-keywords.js';
import { ALL_DOMAIN_TYPES } from '../types.js';
import { tokenize } from '../utils/text-utils.js';

/** Stage 2: Detect the knowledge domain from intent and entities */
export function detectDomain(intent: IntentResult): DomainResult {
  // Combine intent text and key entities for matching
  const allText = [intent.intent, ...intent.key_entities].join(' ').toLowerCase();
  const tokens = tokenize(allText);
  const tokenSet = new Set(tokens);

  // Score each domain
  const scores = new Map<DomainType, number>();

  for (const domainType of ALL_DOMAIN_TYPES) {
    const keywords = domainKeywords[domainType];
    let score = 0;

    for (const { word, weight } of keywords) {
      // Multi-word keywords: check full text
      if (word.includes(' ')) {
        if (allText.includes(word.toLowerCase())) {
          score += weight;
        }
      } else {
        // Single-word: check token set
        if (tokenSet.has(word.toLowerCase())) {
          score += weight;
        }
      }
    }

    scores.set(domainType, score);
  }

  // Sort by score descending, excluding 'general' (it's a fallback)
  const sorted = [...scores.entries()]
    .filter(([type]) => type !== 'general')
    .sort((a, b) => b[1] - a[1]);

  const maxScore = sorted[0]?.[1] ?? 0;

  // Normalize scores
  const normalizedScores = new Map<DomainType, number>();
  for (const [type, score] of sorted) {
    normalizedScores.set(type, maxScore > 0 ? score / maxScore : 0);
  }

  // Determine primary domain
  let primaryDomain: DomainType;
  let confidence: number;

  if (maxScore < 0.5) {
    // Very low signal — fall back to general
    primaryDomain = 'general';
    confidence = maxScore > 0 ? Math.round((maxScore / 5) * 100) / 100 : 0;
  } else {
    primaryDomain = sorted[0][0];
    confidence = Math.round(Math.min(normalizedScores.get(primaryDomain)!, 1.0) * 100) / 100;
    // Scale confidence: 1.0 normalized → real confidence depends on absolute score
    const absConfidence = Math.min(maxScore / 5, 1.0);
    confidence = Math.round(Math.max(absConfidence, confidence * 0.7) * 100) / 100;
  }

  // Sub-domains: next domains with normalized score >= 0.3
  const subDomains: DomainType[] = sorted
    .filter(([type]) => type !== primaryDomain)
    .filter(([, score]) => maxScore > 0 && score / maxScore >= 0.3)
    .slice(0, 3)
    .map(([type]) => type);

  // Ambiguous: top two scores within 0.1 of each other (normalized)
  const topTwo = sorted.slice(0, 2);
  let ambiguous = false;
  if (topTwo.length >= 2 && maxScore > 0) {
    const diff = (topTwo[0][1] - topTwo[1][1]) / maxScore;
    ambiguous = diff < 0.1;
  }

  return {
    primary_domain: primaryDomain,
    sub_domains: subDomains,
    confidence,
    ambiguous,
  };
}
