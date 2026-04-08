import type {
  LLMConfig, LLMIntentResult, IntentResult, DomainResult,
  TaskType, DomainType, PipelineContext,
} from '../types.js';
import { extractIntent } from '../stages/stage1-intent.js';
import { detectDomain } from '../stages/stage2-domain.js';
import { analyzeLLMIntent } from './llm-intent.js';

/**
 * Run LLM analysis and rule-based Stage 1+2 in parallel, then merge.
 * If LLM fails or is disabled, returns pure rule-based results.
 */
export async function hybridAnalyze(
  rawInput: string,
  llmConfig: LLMConfig,
): Promise<{ intent: IntentResult; domain: DomainResult; llmIntent: LLMIntentResult | null }> {
  // Run rule-based and LLM in parallel
  const [ruleIntent, llmResult] = await Promise.all([
    Promise.resolve(extractIntent(rawInput)),
    analyzeLLMIntent(rawInput, llmConfig),
  ]);

  const ruleDomain = detectDomain(ruleIntent);

  if (!llmResult) {
    // LLM unavailable — pure rule-based fallback
    return { intent: ruleIntent, domain: ruleDomain, llmIntent: null };
  }

  // Merge results using confidence-weighted fusion
  const mergedIntent = mergeIntent(ruleIntent, llmResult);
  const mergedDomain = mergeDomain(ruleDomain, llmResult);

  return { intent: mergedIntent, domain: mergedDomain, llmIntent: llmResult };
}

/**
 * Enrich an existing PipelineContext with LLM intent data.
 * Called after hybridAnalyze to attach LLM metadata.
 */
export function enrichContext(
  ctx: PipelineContext,
  llmIntent: LLMIntentResult | null,
): void {
  if (llmIntent) {
    ctx.llm_intent = llmIntent;
  }
}

// ─── Merge Logic ─────────────────────────────────────────────────────────────

function mergeIntent(rule: IntentResult, llm: LLMIntentResult): IntentResult {
  // If both agree on task_type — boost confidence
  if (rule.task_type === llm.task_type) {
    return {
      ...rule,
      confidence: Math.min(Math.max(rule.confidence, llm.confidence) + 0.1, 1.0),
      key_entities: mergeEntities(rule.key_entities, llm.key_entities),
      complexity: llm.confidence > 0.7 ? llm.complexity : rule.complexity,
    };
  }

  // Disagreement — prefer the one with higher confidence
  if (llm.confidence > rule.confidence && llm.confidence >= 0.6) {
    return {
      intent: rule.intent,
      task_type: llm.task_type,
      complexity: llm.complexity,
      key_entities: mergeEntities(rule.key_entities, llm.key_entities),
      secondary_types: addSecondaryType(rule.secondary_types, rule.task_type),
      confidence: llm.confidence,
    };
  }

  // Rule-based wins, but add LLM's task as secondary
  return {
    ...rule,
    key_entities: mergeEntities(rule.key_entities, llm.key_entities),
    secondary_types: addSecondaryType(rule.secondary_types, llm.task_type),
  };
}

function mergeDomain(rule: DomainResult, llm: LLMIntentResult): DomainResult {
  // If both agree on domain
  if (rule.primary_domain === llm.domain) {
    return {
      ...rule,
      confidence: Math.min(Math.max(rule.confidence, llm.confidence) + 0.1, 1.0),
      ambiguous: false,
    };
  }

  // LLM disagrees — if LLM is highly confident, prefer LLM
  if (llm.confidence > rule.confidence && llm.confidence >= 0.7) {
    return {
      primary_domain: llm.domain,
      sub_domains: rule.primary_domain !== 'general'
        ? [rule.primary_domain, ...rule.sub_domains.filter(d => d !== llm.domain)].slice(0, 3)
        : rule.sub_domains,
      confidence: llm.confidence,
      ambiguous: true,
    };
  }

  // Rule-based wins, mark as ambiguous if LLM proposed something different
  return {
    ...rule,
    ambiguous: llm.domain !== 'general' && llm.domain !== rule.primary_domain,
    sub_domains: addSubDomain(rule.sub_domains, llm.domain, rule.primary_domain),
  };
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function mergeEntities(ruleEntities: string[], llmEntities: string[]): string[] {
  const set = new Set<string>();
  for (const e of ruleEntities) set.add(e.toLowerCase());
  for (const e of llmEntities) set.add(e.toLowerCase());
  return [...set].slice(0, 10);
}

function addSecondaryType(existing: TaskType[], newType: TaskType): TaskType[] {
  if (existing.includes(newType)) return existing.slice(0, 5);
  return [newType, ...existing].slice(0, 5);
}

function addSubDomain(
  existing: DomainType[],
  newDomain: DomainType,
  primary: DomainType,
): DomainType[] {
  if (newDomain === 'general' || newDomain === primary || existing.includes(newDomain)) {
    return existing.slice(0, 3);
  }
  return [newDomain, ...existing].slice(0, 3);
}
