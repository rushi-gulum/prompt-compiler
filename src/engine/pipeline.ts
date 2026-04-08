import type { PipelineContext, IntentResult, DomainResult, LLMIntentResult } from './types.js';
import { wrapError } from './utils/error.js';
import { extractIntent } from './stages/stage1-intent.js';
import { detectDomain } from './stages/stage2-domain.js';
import { mapPersona } from './stages/stage3-persona.js';
import { selectReasoning } from './stages/stage4-reasoning.js';
import { structureInstructions } from './stages/stage5-structure.js';
import { synthesizePrompt } from './stages/stage6-synthesis.js';

export interface PipelineOptions {
  /** Pre-computed intent (from hybrid orchestrator) — skips Stage 1 */
  intent?: IntentResult;
  /** Pre-computed domain (from hybrid orchestrator) — skips Stage 2 */
  domain?: DomainResult;
  /** LLM intent result to attach to context metadata */
  llmIntent?: LLMIntentResult | null;
}

/** Run all 6 pipeline stages in sequence, accumulating context */
export async function runPipeline(input: string, options?: PipelineOptions): Promise<PipelineContext> {
  const ctx: PipelineContext = { raw_input: input };

  // Use pre-computed results from hybrid orchestrator, or run stages normally
  ctx.intent = options?.intent ?? await runStage(1, () => extractIntent(input), ctx);
  ctx.domain = options?.domain ?? await runStage(2, () => detectDomain(ctx.intent!), ctx);

  // Attach LLM intent if available
  if (options?.llmIntent) {
    ctx.llm_intent = options.llmIntent;
  }

  ctx.persona = await runStage(3, () => mapPersona(ctx.intent!, ctx.domain!), ctx);
  ctx.reasoning = await runStage(4, () => selectReasoning(ctx.intent!, ctx.persona!), ctx);
  ctx.structure = await runStage(5, () => structureInstructions(ctx), ctx);
  ctx.result = await runStage(6, () => synthesizePrompt(ctx), ctx);

  return ctx;
}

async function runStage<T>(
  stage: number,
  fn: () => T | Promise<T>,
  _ctx: PipelineContext,
): Promise<T> {
  try {
    return await Promise.resolve(fn());
  } catch (e) {
    throw wrapError(e, stage);
  }
}
