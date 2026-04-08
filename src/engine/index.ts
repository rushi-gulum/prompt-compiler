import { runPipeline } from './pipeline.js';
import { sanitizeInput, truncateInput } from './utils/text-utils.js';
import { createError } from './utils/error.js';
import type { CompilationResult, LLMConfig } from './types.js';
import { hybridAnalyze, enrichContext } from './llm/hybrid-orchestrator.js';
import { classifyComplexity } from './scoring/complexity-classifier.js';
import { evaluateOutput } from './llm/llm-evaluator.js';
import { refineOutput } from './llm/llm-refiner.js';

/** Public API: compile a raw idea string into an expert-level prompt.
 *  When llmConfig is provided and enabled, runs hybrid LLM + rule-based analysis. */
export async function compile(rawIdea: string, llmConfig?: LLMConfig): Promise<CompilationResult> {
  // 1. Type check + empty check
  if (!rawIdea || typeof rawIdea !== 'string' || rawIdea.trim().length === 0) {
    return {
      success: false,
      error: createError(0, 'INPUT_EMPTY', 'Input is empty or null', false),
    };
  }

  // 2. Sanitize (strip HTML + control chars)
  const sanitized = sanitizeInput(rawIdea.trim());

  // 3. Check if sanitization emptied the input
  if (sanitized.length === 0) {
    return {
      success: false,
      error: createError(0, 'INPUT_EMPTY', 'Input is empty after sanitization', false),
    };
  }

  // 4. Truncate if needed
  const { text, truncated } = truncateInput(sanitized, 5000);

  // 5. Run pipeline (hybrid or rule-based)
  const start = Date.now();
  const isHybrid = !!(llmConfig && llmConfig.enabled && llmConfig.apiKey);

  try {
    let ctx;
    const inputComplexity = classifyComplexity(text);
    const takeDeepPath = isHybrid && (inputComplexity === 'moderate' || inputComplexity === 'complex');

    if (takeDeepPath) {
      // Deep Path: run LLM + rule-based Stage 1+2 in parallel, then pipeline
      const { intent, domain, llmIntent } = await hybridAnalyze(text, llmConfig);
      ctx = await runPipeline(text, { intent, domain, llmIntent });
      enrichContext(ctx, llmIntent);
      
      // Outcome Optimizer: Evaluation and Refinement Loop
      let currentResult = ctx.result!;
      let attempts = 0;
      const MAX_RETRIES = 1;
      let evalPass = false;

      while (attempts <= MAX_RETRIES && !evalPass) {
        const evaluation = await evaluateOutput(currentResult.prompt, text, llmConfig);
        if (typeof evaluation.score === 'number') {
          currentResult.metadata.llm_confidence = evaluation.score / 100;
        }
        
        if (evaluation.passed) {
          evalPass = true;
          break;
        }

        if (attempts < MAX_RETRIES) {
          const refinedPrompt = await refineOutput(currentResult.prompt, evaluation.critiques, llmConfig);
          currentResult.prompt = refinedPrompt;
          currentResult.assembled_prompt = refinedPrompt;
          currentResult.metadata.enhanced = true;
          currentResult.metadata.warnings.push(`LLM Refinement Loop applied (Outcome Score: ${evaluation.score})`);
        }
        attempts++;
      }
    } else {
      // Fast Path: Pure rule-based flow (skips LLM overhead)
      ctx = await runPipeline(text);
    }

    const result = ctx.result!;
    if (truncated) {
      result.metadata.warnings.push('Input truncated to 5000 characters');
    }
    result.metadata.processing_time_ms = Date.now() - start;
    result.metadata.hybrid_mode = isHybrid && !!ctx.llm_intent;
    result.metadata.llm_confidence = ctx.llm_intent?.confidence;
    return { success: true, data: result };
  } catch (e) {
    const error = (e && typeof e === 'object' && 'code' in e)
      ? e as import('./types.js').CompilationError
      : createError(0, 'UNKNOWN_ERROR', String(e), false);
    return { success: false, error };
  }
}

// Public type re-exports
export type {
  CompilationResult,
  CompiledPrompt,
  CompilationError,
  TaskType,
  DomainType,
  OutputFormat,
  QualityLabel,
  LLMConfig,
  LLMIntentResult,
} from './types.js';
