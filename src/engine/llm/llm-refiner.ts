import type { LLMConfig } from '../types.js';
import { callUnifiedLLM, buildUnifiedClientOptions, type UnifiedMessage } from './unified-client.js';

const REFINER_PROMPT = `You are an expert AI Prompt Engineer. Your task is to refine a generated prompt based on the provided critiques.
Return the improved prompt strictly as raw text. Do NOT wrap it in markdown code blocks.
Do NOT include any conversational pleasantries.
The output must be the complete, improved prompt text ready for use.`;

/**
 * Self-critique engine loop: Refines a prompt given specific critique guidance.
 */
export async function refineOutput(
  originalPrompt: string,
  critiques: string[],
  config: LLMConfig
): Promise<string> {
  if (!config.enabled || !config.apiKey || critiques.length === 0) {
    return originalPrompt;
  }

  const options = buildUnifiedClientOptions(config);
  const messages: UnifiedMessage[] = [
    { role: 'system', content: REFINER_PROMPT },
    { role: 'user', content: `Original Prompt:\n${originalPrompt}\n\nCritiques to Address:\n- ${critiques.join('\n- ')}\n\nPlease provide the complete revised prompt.` }
  ];

  try {
    // Note: jsonMode is false because we want raw text back
    const response = await callUnifiedLLM(messages, options, false);
    const content = response.content;
    if (!content) return originalPrompt;
    
    // Attempt to strip basic markdown block wrappers if LLM still includes them
    let refined = content.trim();
    if (refined.startsWith('```') && refined.endsWith('```')) {
      const firstNewline = refined.indexOf('\n');
      const lastTick = refined.lastIndexOf('```');
      if (firstNewline !== -1 && lastTick !== -1) {
        refined = refined.substring(firstNewline + 1, lastTick).trim();
      }
    }
    return refined;
  } catch (err) {
    return originalPrompt; // Fallback to original prompt if refinement fails
  }
}
