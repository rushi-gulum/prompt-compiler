import type {
  CompiledPrompt, PipelineContext, PromptSection, QualityCriterion,
} from '../types.js';
import { ALL_PROMPT_SECTIONS } from '../types.js';
import { buildPromptSections, domainConstraints, instructionTemplates } from '../data/templates.js';
import { scorePrompt } from '../scoring/quality-scorer.js';
import { exampleLibrary } from '../data/examples.js';
import { estimateTokenCount } from '../utils/text-utils.js';

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

  // 4. Determine effective compilation level
  // If not explicitly set on context, default to 'deep' to preserve full 8-section XML behavior for tests and direct callers
  const requestedLevel = ctx.compilation_level ?? 'deep';
  let effectiveLevel: 'light' | 'standard' | 'deep';

  if (requestedLevel === 'auto') {
    const complexity = ctx.intent?.complexity ?? 'moderate';
    if (complexity === 'simple') {
      effectiveLevel = 'light';
    } else if (complexity === 'complex') {
      effectiveLevel = 'deep';
    } else {
      effectiveLevel = 'standard';
    }
  } else {
    effectiveLevel = requestedLevel;
  }

  // 5. Assemble prompt string based on effective compilation level and target platform
  const platform = ctx.target_platform ?? 'generic';
  let prompt: string;

  if (effectiveLevel === 'light') {
    // ⚡ Light: Direct, zero-shot prompt with core mission, essential constraints, and output format.
    const parts: string[] = [];
    parts.push(sections.mission.trim());

    const constraints = ctx.structure?.negative_constraints?.slice(0, 2) ?? [];
    if (constraints.length > 0) {
      parts.push(`Constraints:\n${constraints.map(c => `- ${c}`).join('\n')}`);
    }

    if (ctx.structure?.output_format) {
      parts.push(`Format: Return output in ${ctx.structure.output_format} format.`);
    }

    prompt = parts.filter(Boolean).join('\n\n');
  } else if (effectiveLevel === 'standard') {
    // 🎯 Standard: Focused, high-impact prompt with role title, mission, instructions, and format.
    const parts: string[] = [];
    if (ctx.persona?.role_title) {
      parts.push(`### Role\nYou are a ${ctx.persona.role_title}.`);
    }
    parts.push(`### Task\n${sections.mission.trim()}`);
    parts.push(sections.instructions.trim());

    const keyConstraints = [
      ...(ctx.structure?.positive_constraints?.slice(0, 2) ?? []),
      ...(ctx.structure?.negative_constraints?.slice(0, 2) ?? []),
    ];
    if (keyConstraints.length > 0) {
      parts.push(`### Key Requirements\n${keyConstraints.map(c => `- ${c}`).join('\n')}`);
    }

    parts.push(sections.output_format.trim());
    prompt = parts.filter(Boolean).join('\n\n');
  } else {
    // 🛡️ Deep: Platform-optimized structure
    if (platform === 'chatgpt') {
      // ChatGPT / GPT-4o operates best with Markdown headers and bulleted rules (avoids XML tags)
      prompt = [
        `# Role & Persona\n${sections.role}`,
        `# Objective\n${sections.mission}`,
        `# Operational Rules & Boundaries\n${sections.behavioral_rules}`,
        `# Context\n${sections.context}`,
        `# Reasoning Approach\n${sections.reasoning}`,
        sections.instructions,
        sections.output_format,
        sections.quality_standard,
      ].join('\n\n');
    } else if (platform === 'gemini') {
      // Gemini benefits from natural sectioning and clear directives
      prompt = [
        `## Role\n${sections.role}`,
        `## Task\n${sections.mission}`,
        `## Core Guidelines\n${sections.behavioral_rules}`,
        `## Detailed Instructions\n${sections.instructions}`,
        sections.output_format,
        sections.quality_standard,
      ].join('\n\n');
    } else if (platform === 'perplexity' || platform === 'grok') {
      // Perplexity & Grok prefer direct, concise instructions with clear formatting boundaries
      prompt = [
        `You are a ${ctx.persona?.role_title ?? 'Domain Specialist'}.\n${sections.mission}`,
        `### Rules\n${sections.behavioral_rules}`,
        sections.instructions,
        sections.output_format,
      ].join('\n\n');
    } else {
      // Claude & Generic: Comprehensive 8 XML-delimited sections (Claude has native affinity for XML tags)
      prompt = ALL_PROMPT_SECTIONS
        .map(s => `<${s}>\n${sections[s]}\n</${s}>`)
        .join('\n\n');
    }
  }

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
      compilation_level: requestedLevel,
      effective_level: effectiveLevel,
      target_platform: platform,
      estimated_tokens: estimateTokenCount(prompt),
      processing_time_ms: Date.now() - startTime,
      warnings,
      enhanced,
      hybrid_mode: false,
      multi_turn: !!ctx.multi_turn?.previousTurn,
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
