import type { IntentResult, PersonaResult, ReasoningResult, Complexity, DepthLevel, ThinkingBudget, TaskType } from '../types.js';
import { reasoningTemplates } from '../data/templates.js';

const depthMap: Record<Complexity, DepthLevel> = {
  simple: 'none',
  moderate: 'standard',
  complex: 'deep',
};

const budgetMap: Record<DepthLevel, ThinkingBudget> = {
  none: 'minimal',
  standard: 'standard',
  deep: 'maximum',
};

/** Task types that always require verification */
const verificationTasks: Set<TaskType> = new Set([
  'code_generation', 'code_review', 'data_analysis', 'planning',
]);

/** Stage 4: Select reasoning strategy based on complexity and task type */
export function selectReasoning(intent: IntentResult, _persona: PersonaResult): ReasoningResult {
  const depth = depthMap[intent.complexity];
  const verification = verificationTasks.has(intent.task_type);

  // Upgrade budget for moderate + verification tasks
  let budget = budgetMap[depth];
  if (intent.complexity === 'moderate' && verification) {
    budget = 'deep';
  }

  // Build reasoning approach string
  const template = reasoningTemplates[depth];
  const approach = verification ? template.withVerification : template.base;

  return {
    reasoning_approach: approach,
    depth_level: depth,
    verification_needed: verification,
    thinking_budget: budget,
  };
}
