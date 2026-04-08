import type { StructureResult, PipelineContext, TaskType, OutputFormat, AudienceLevel } from '../types.js';
import { instructionTemplates, domainConstraints, taskOutputFormats } from '../data/templates.js';

/** Task types that benefit from examples in the output */
const examplesWhitelist: Set<TaskType> = new Set([
  'code_generation', 'creative_writing', 'extraction', 'classification',
  'structured_generation',
]);

/** Stage 5: Structure instructions, constraints, format, and audience */
export function structureInstructions(ctx: PipelineContext): StructureResult {
  const taskType = ctx.intent!.task_type;
  const domain = ctx.domain!.primary_domain;
  const persona = ctx.persona!;

  // 1. Load instruction template and substitute placeholders
  const rawInstructions = [...instructionTemplates[taskType]];
  const instructions = rawInstructions.map(inst =>
    inst
      .replace(/\{role_title\}/g, persona.role_title)
      .replace(/\{domain\}/g, domain.replace(/_/g, ' '))
  );

  // 2. Load domain constraints
  const constraints = domainConstraints[domain];
  const positiveConstraints = [...constraints.positive];
  const negativeConstraints = [...constraints.negative];

  // 3. Output format from task type mapping
  const outputFormat: OutputFormat = taskOutputFormats[taskType];

  // 4. Examples needed?
  const examplesNeeded = examplesWhitelist.has(taskType);

  // 5. Default audience level
  const audienceLevel: AudienceLevel = 'professional';

  return {
    instructions,
    positive_constraints: positiveConstraints,
    negative_constraints: negativeConstraints,
    examples_needed: examplesNeeded,
    output_format: outputFormat,
    audience_level: audienceLevel,
  };
}
