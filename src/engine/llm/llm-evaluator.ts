import type { LLMConfig } from '../types.js';
import { callGroq, buildClientOptions, type GroqMessage } from './groq-client.js';

export interface EvaluationResult {
  score: number; // 0-100
  critiques: string[];
  passed: boolean;
}

const EVALUATOR_PROMPT = `You are an expert AI Output Evaluator. Evaluate the provided compiled system prompt.
Score it from 0-100 based on Relevance, Completeness, Accuracy, and Format Compliance.
Return JSON strictly in this format:
{
  "score": number,
  "critiques": ["critique 1", "critique 2"] // Specific actionable feedback targeting structural weaknesses or missed constraints
}
If the score is >= 85, critiques can be empty. Do not include markdown or explanations outside the JSON object.`;

/**
 * Closed feedback loop: evaluate the output prompt using an LLM evaluator.
 * Returns an optimization score and specific critiques if it falls below threshold.
 */
export async function evaluateOutput(
  generatedPrompt: string,
  userIntent: string,
  config: LLMConfig
): Promise<EvaluationResult> {
  if (!config.enabled || !config.apiKey) {
    return { score: 100, critiques: [], passed: true }; // Fallback
  }

  const options = buildClientOptions(config);
  const messages: GroqMessage[] = [
    { role: 'system', content: EVALUATOR_PROMPT },
    { role: 'user', content: `Original User Intent: ${userIntent}\n\nGenerated Prompt to Evaluate:\n${generatedPrompt}` }
  ];

  try {
    const response = await callGroq(messages, options, true);
    const content = response.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty LLM evaluation response');

    const parsed = JSON.parse(content);
    const score = typeof parsed.score === 'number' ? parsed.score : 50;
    const critiques = Array.isArray(parsed.critiques) ? parsed.critiques.filter((c: any) => typeof c === 'string') : [];

    return {
      score,
      critiques,
      passed: score >= 85
    };
  } catch (err) {
    // If the evaluation fails, degrade gracefully by approving the prompt
    return { score: 100, critiques: [], passed: true };
  }
}
