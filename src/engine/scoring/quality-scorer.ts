import type {
  PromptSection, QualityCriterion, QualityLabel, PipelineContext,
} from '../types.js';
import { ALL_QUALITY_CRITERIA } from '../types.js';

type ScoringFn = (sections: Record<PromptSection, string>, ctx: PipelineContext) => 0 | 1 | 2;

function scoreRolePersona(sections: Record<PromptSection, string>): 0 | 1 | 2 {
  const role = sections.role ?? '';
  if (!role || role.length < 5) return 0;
  const hasJobTitle = /\b(engineer|scientist|developer|analyst|consultant|expert|specialist|manager|architect|author|educator|instructor|planner|strategist|designer|writer|translator|tutor|lead|director)\b/i.test(role);
  const hasMethodology = /methodology|specializ|experience|years|framework|approach|practice/i.test(role);
  if (hasJobTitle && hasMethodology) return 2;
  if (hasJobTitle) return 1;
  return 0;
}

function scoreTaskSpecificity(sections: Record<PromptSection, string>): 0 | 1 | 2 {
  const mission = sections.mission ?? '';
  if (!mission || mission.split(/\s+/).length < 5) return 0;
  const hasVerb = /\b(perform|create|write|analyze|review|build|generate|debug|explain|design|summarize|translate|plan|teach|extract|classify|research|decide|evaluate)\b/i.test(mission);
  const hasObject = /\b(code|data|prompt|text|content|report|plan|document|analysis|story|article|function|system|response)\b/i.test(mission);
  const hasConstraint = /\b(complexity|domain|quality|level|focus|accurate|specific)\b/i.test(mission);
  if (hasVerb && hasObject && hasConstraint) return 2;
  if (hasVerb && hasObject) return 1;
  return 0;
}

function scoreContext(sections: Record<PromptSection, string>): 0 | 1 | 2 {
  const context = sections.context ?? '';
  if (!context || context.split(/\s+/).length < 3) return 0;
  const hasAudience = /audience|reader|user|student|professional|expert|beginner|level/i.test(context);
  const hasDomain = /domain|field|topic|area|software|data|creative|business|legal|medical|education|marketing|science|engineering|finance|cybersecurity|operations|product/i.test(context);
  if (hasAudience && hasDomain) return 2;
  if (context.split(/\s+/).length >= 10) return 1;
  return 0;
}

function scoreReasoningGuidance(sections: Record<PromptSection, string>): 0 | 1 | 2 {
  const reasoning = sections.reasoning ?? '';
  if (!reasoning || reasoning.length < 5) return 0;
  const hasStepOrScratchpad = /step|scratchpad/i.test(reasoning);
  const hasVerify = /verify|verif|alternative method/i.test(reasoning);
  if (hasStepOrScratchpad && hasVerify) return 2;
  if (/step-by-step|think|reason/i.test(reasoning)) return 1;
  return 0;
}

function scoreInstructions(sections: Record<PromptSection, string>): 0 | 1 | 2 {
  const instructions = sections.instructions ?? '';
  const numberedItems = (instructions.match(/^\d+\./gm) ?? []).length;
  if (numberedItems >= 3) return 2;
  if (numberedItems >= 1) return 1;
  return 0;
}

function scoreOutputFormat(sections: Record<PromptSection, string>): 0 | 1 | 2 {
  const format = sections.output_format ?? '';
  if (!format || format.length < 5) return 0;
  const hasFormatLabel = /format:/i.test(format);
  const hasSpecificFormat = /\b(json|table|markdown|xml|code|list|prose|csv|schema|template)\b/i.test(format);
  if (hasFormatLabel && hasSpecificFormat) return 2;
  if (/format|output|structur/i.test(format)) return 1;
  return 0;
}

function scoreConstraints(sections: Record<PromptSection, string>): 0 | 1 | 2 {
  const rules = sections.behavioral_rules ?? '';
  if (!rules || rules.length < 10) return 0;
  const hasPositive = /\bALWAYS\b|DO:|positive|ALWAYS:/i.test(rules) || /\bDO\b/i.test(rules);
  const hasNegative = /\bNEVER\b|DO NOT|DON'T|negative|NEVER:/i.test(rules);
  if (hasPositive && hasNegative) return 2;
  if (hasPositive || hasNegative) return 1;
  return 0;
}

function scoreExamples(sections: Record<PromptSection, string>): 0 | 1 | 2 {
  const all = Object.values(sections).join('\n');
  // Check for injected few-shot examples (### Example N: pattern)
  const fewShotCount = (all.match(/### Example \d+:/g) ?? []).length;
  if (fewShotCount >= 2) return 2;
  if (fewShotCount >= 1) return 1;
  // Fallback: check for input/output/example keywords
  const examplePairs = (all.match(/input:|output:|example:/gi) ?? []).length;
  if (examplePairs >= 4) return 2;
  if (examplePairs >= 2) return 1;
  if (/include.*example|concrete.*example/i.test(all)) return 1;
  return 0;
}

function scoreAudience(sections: Record<PromptSection, string>): 0 | 1 | 2 {
  const context = sections.context ?? '';
  const hasAudienceWord = /audience|reader|user|viewer|learner|student/i.test(context);
  const hasExpertise = /beginner|intermediate|expert|professional|child|advanced|level/i.test(context);
  if (hasAudienceWord && hasExpertise) return 2;
  if (hasAudienceWord || hasExpertise) return 1;
  return 0;
}

function scoreAntiHallucination(sections: Record<PromptSection, string>): 0 | 1 | 2 {
  const quality = sections.quality_standard ?? '';
  const hasCitation = /cit|source|reference|evidence|ground/i.test(quality);
  const hasAccuracy = /accura|fact|verif|uncertain/i.test(quality);
  if (hasCitation && hasAccuracy) return 2;
  if (hasAccuracy) return 1;
  return 0;
}

function scoreSecurity(sections: Record<PromptSection, string>): 0 | 1 | 2 {
  const all = Object.values(sections).join('\n');
  const hasTagIsolation = /<\w+>/.test(all) && /<\/\w+>/.test(all);
  const hasPriority = /override|priority|system|ignore previous/i.test(all);
  if (hasTagIsolation) return 2;
  if (hasPriority) return 1;
  return 0;
}

function scoreStructuralClarity(sections: Record<PromptSection, string>): 0 | 1 | 2 {
  const all = Object.values(sections).join('\n');
  const tagCount = (all.match(/<\w+>|##\s/g) ?? []).length;
  if (tagCount >= 4) return 2;
  if (tagCount >= 2) return 1;
  return 0;
}

const scoringFunctions: Record<QualityCriterion, (sections: Record<PromptSection, string>, ctx: PipelineContext) => 0 | 1 | 2> = {
  role_persona: (s) => scoreRolePersona(s),
  task_specificity: (s) => scoreTaskSpecificity(s),
  context: (s) => scoreContext(s),
  reasoning_guidance: (s) => scoreReasoningGuidance(s),
  instructions: (s) => scoreInstructions(s),
  output_format: (s) => scoreOutputFormat(s),
  constraints: (s) => scoreConstraints(s),
  examples: (s) => scoreExamples(s),
  audience: (s) => scoreAudience(s),
  anti_hallucination: (s) => scoreAntiHallucination(s),
  security: (s) => scoreSecurity(s),
  structural_clarity: (s) => scoreStructuralClarity(s),
};

/** Get quality label from numeric score */
export function getQualityLabel(score: number): QualityLabel {
  if (score >= 20) return 'excellent';
  if (score >= 15) return 'good';
  if (score >= 9) return 'acceptable';
  return 'poor';
}

/** Score a compiled prompt's sections against the 12-point rubric */
export function scorePrompt(
  sections: Record<PromptSection, string>,
  context: PipelineContext,
): { score: number; breakdown: Record<QualityCriterion, number>; label: QualityLabel } {
  const breakdown = {} as Record<QualityCriterion, number>;
  let total = 0;

  for (const criterion of ALL_QUALITY_CRITERIA) {
    const fn = scoringFunctions[criterion];
    const value = fn(sections, context);
    breakdown[criterion] = value;
    total += value;
  }

  return {
    score: total,
    breakdown,
    label: getQualityLabel(total),
  };
}
