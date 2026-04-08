import type {
  CompiledPrompt, PipelineContext, PromptSection, QualityCriterion,
} from '../types.js';
import { ALL_PROMPT_SECTIONS } from '../types.js';
import { buildPromptSections, domainConstraints, instructionTemplates } from '../data/templates.js';
import { scorePrompt } from '../scoring/quality-scorer.js';
import { exampleLibrary } from '../data/examples.js';

/** Stage 6: Synthesize all stage outputs into the final compiled prompt */
export function synthesizePrompt(ctx: PipelineContext): CompiledPrompt {
  const startTime = Date.now();
  const warnings: string[] = [];

  // 1. Build all 8 sections
  let sections = buildPromptSections(ctx);

  // 1b. Inject few-shot examples when needed
  if (ctx.structure?.examples_needed && ctx.intent) {
    const examples = exampleLibrary[ctx.intent.task_type];
    if (examples && examples.length > 0) {
      const selected = examples.slice(0, 2);
      const exampleText = selected.map((ex, i) =>
        `\n\n### Example ${i + 1}:\n**Input:** ${ex.input}\n**Output:** ${ex.output}`
      ).join('');
      sections = { ...sections, instructions: sections.instructions + exampleText };
    }
  }

  // Check for empty sections
  for (const section of ALL_PROMPT_SECTIONS) {
    if (!sections[section] || sections[section].trim().length === 0) {
      warnings.push(section);
    }
  }

  // 2. Score the prompt
  let { score, breakdown, label } = scorePrompt(sections, ctx);
  let enhanced = false;

  // 3. Enhancement pass if score < 12
  if (score < 12) {
    sections = enhancementPass(sections, ctx, breakdown);
    const rescored = scorePrompt(sections, ctx);
    score = rescored.score;
    breakdown = rescored.breakdown;
    label = rescored.label;
    enhanced = true;
  }

  // 4. Assemble full prompt string with XML delimiters
  const prompt = ALL_PROMPT_SECTIONS
    .map(s => `<${s}>\n${sections[s]}\n</${s}>`)
    .join('\n\n');

  return {
    prompt,
    assembled_prompt: prompt,
    sections,
    quality_score: score,
    quality_label: label,
    quality_breakdown: breakdown,
    metadata: {
      task_type: ctx.intent!.task_type,
      domain: ctx.domain!.primary_domain,
      complexity: ctx.intent!.complexity,
      processing_time_ms: Date.now() - startTime,
      warnings,
      enhanced,
      hybrid_mode: false,
    },
  };
}

/** Enhancement pass: improve the 3 weakest scoring criteria */
function enhancementPass(
  sections: Record<PromptSection, string>,
  ctx: PipelineContext,
  breakdown: Record<QualityCriterion, number>,
): Record<PromptSection, string> {
  const enhanced = { ...sections };

  // Find the 3 lowest scoring criteria
  const sorted = (Object.entries(breakdown) as [QualityCriterion, number][])
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3);

  for (const [criterion] of sorted) {
    switch (criterion) {
      case 'role_persona':
        if (ctx.persona) {
          enhanced.role += `\n\nMethodology: ${ctx.persona.methodology}. With ${ctx.persona.experience_years}+ years of proven experience in ${ctx.persona.expertise_areas.join(', ')}.`;
        }
        break;

      case 'instructions': {
        const taskInstructions = instructionTemplates[ctx.intent!.task_type];
        if (taskInstructions.length < 6) {
          enhanced.instructions += '\n6. Review your output for completeness and accuracy before finalizing.';
        }
        break;
      }

      case 'constraints': {
        const domain = ctx.domain!.primary_domain;
        const constraints = domainConstraints[domain];
        enhanced.behavioral_rules += '\n\n### Additional Constraints\nDO: ' +
          constraints.positive.join('; ') + '\nDO NOT: ' + constraints.negative.join('; ');
        break;
      }

      case 'structural_clarity':
        // Sections already use XML tags in the assembled prompt
        // Add section headers within sections that don't have them
        if (!enhanced.role.includes('##')) {
          enhanced.role = `## Role & Persona\n\n${enhanced.role}`;
        }
        if (!enhanced.mission.includes('##')) {
          enhanced.mission = `## Mission\n\n${enhanced.mission}`;
        }
        break;

      case 'context':
        if (ctx.intent) {
          const entities = ctx.intent.key_entities;
          if (entities.length > 0) {
            enhanced.context += `\nKey subjects: ${entities.join(', ')}. Domain: ${ctx.domain!.primary_domain.replace(/_/g, ' ')}.`;
          }
        }
        break;

      case 'audience':
        enhanced.context += '\nAudience level: professional. Adjust terminology and depth accordingly.';
        break;

      case 'reasoning_guidance':
        if (ctx.reasoning) {
          enhanced.reasoning += '\n\nVerify your reasoning step by step before presenting the final answer.';
        }
        break;

      case 'anti_hallucination':
        enhanced.quality_standard += '\n- Cite sources for factual claims. If uncertain, explicitly state the uncertainty level.\n- Ground all responses in verifiable evidence where possible.';
        break;

      case 'output_format':
        enhanced.output_format += '\n\nFormat: Provide structured output with clear sections, headers, and formatting appropriate to the content type.';
        break;

      case 'examples':
        if (ctx.structure?.examples_needed) {
          enhanced.instructions += '\n\nInclude at least one concrete Input/Output example to illustrate the expected behavior.';
        }
        break;

      case 'security':
        // Already using XML tags in assembly — no additional action needed
        break;

      case 'task_specificity':
        if (ctx.intent) {
          enhanced.mission += `\nDeliver a specific, actionable ${ctx.intent.task_type.replace(/_/g, ' ')} result that addresses the complexity level: ${ctx.intent.complexity}.`;
        }
        break;
    }
  }

  return enhanced;
}
