import type { LLMConfig, LLMIntentResult, TaskType, DomainType, Complexity } from '../types.js';
import { ALL_TASK_TYPES, ALL_DOMAIN_TYPES } from '../types.js';
import { callGroq, buildClientOptions, type GroqMessage } from './groq-client.js';

const SYSTEM_PROMPT = `You are an expert prompt analysis engine. Given a user's raw prompt idea, analyze it and return a JSON object with these exact fields:

{
  "task_type": one of [${ALL_TASK_TYPES.slice(0, 20).map(t => `"${t}"`).join(', ')}, ...and more],
  "domain": one of [${ALL_DOMAIN_TYPES.map(d => `"${d}"`).join(', ')}],
  "complexity": "simple" | "moderate" | "complex",
  "key_entities": ["entity1", "entity2", ...],
  "refined_intent": "A clear, one-sentence restatement of what the user actually wants",
  "suggested_persona_focus": "Brief note on what expertise to emphasize",
  "confidence": 0.0 to 1.0
}

Rules:
- task_type must be one of the predefined types. If uncertain, use "general".
- domain must be one of the predefined domains. If uncertain, use "general".
- key_entities should be 2-6 specific nouns/concepts from the input.
- refined_intent should clarify ambiguous inputs.
- confidence reflects how certain you are about the task_type and domain classification.
- Return ONLY valid JSON. No markdown, no explanation.`;

/**
 * Use the Groq LLM to analyze user intent from raw prompt text.
 * Returns null if the call fails (allows graceful fallback).
 */
export async function analyzeLLMIntent(
  rawInput: string,
  config: LLMConfig,
): Promise<LLMIntentResult | null> {
  if (!config.enabled || !config.apiKey) {
    return null;
  }

  const options = buildClientOptions(config);
  const messages: GroqMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: rawInput },
  ];

  try {
    const response = await callGroq(messages, options, true);
    const content = response.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return validateAndNormalize(parsed);
  } catch {
    // LLM failure — caller should fall back to rule-based
    return null;
  }
}

/** Validate and normalize the LLM JSON response into a typed result */
function validateAndNormalize(raw: Record<string, unknown>): LLMIntentResult | null {
  try {
    const taskType = normalizeTaskType(raw.task_type);
    const domain = normalizeDomain(raw.domain);
    const complexity = normalizeComplexity(raw.complexity);
    const keyEntities = normalizeStringArray(raw.key_entities);
    const refinedIntent = typeof raw.refined_intent === 'string' ? raw.refined_intent : '';
    const personaFocus = typeof raw.suggested_persona_focus === 'string'
      ? raw.suggested_persona_focus : '';
    const confidence = normalizeConfidence(raw.confidence);

    return {
      task_type: taskType,
      domain,
      complexity,
      key_entities: keyEntities,
      refined_intent: refinedIntent,
      suggested_persona_focus: personaFocus,
      confidence,
    };
  } catch {
    return null;
  }
}

function normalizeTaskType(value: unknown): TaskType {
  if (typeof value === 'string' && ALL_TASK_TYPES.includes(value as TaskType)) {
    return value as TaskType;
  }
  return 'general';
}

function normalizeDomain(value: unknown): DomainType {
  if (typeof value === 'string' && ALL_DOMAIN_TYPES.includes(value as DomainType)) {
    return value as DomainType;
  }
  return 'general';
}

function normalizeComplexity(value: unknown): Complexity {
  if (value === 'simple' || value === 'moderate' || value === 'complex') {
    return value;
  }
  return 'moderate';
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string').slice(0, 10);
  }
  return [];
}

function normalizeConfidence(value: unknown): number {
  if (typeof value === 'number' && value >= 0 && value <= 1) {
    return Math.round(value * 100) / 100;
  }
  return 0.5;
}
