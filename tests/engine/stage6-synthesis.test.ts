import { synthesizePrompt } from '../../src/engine/stages/stage6-synthesis.js';
import type { PipelineContext, PromptSection } from '../../src/engine/types.js';
import { ALL_PROMPT_SECTIONS, ALL_QUALITY_CRITERIA } from '../../src/engine/types.js';

function makeFullCtx(overrides?: Partial<PipelineContext>): PipelineContext {
  return {
    raw_input: 'Write a Python function to sort a list using merge sort, with full documentation.',
    intent: {
      intent: 'Write a Python function to sort a list using merge sort, with full documentation.',
      task_type: 'code_generation',
      complexity: 'moderate',
      key_entities: ['Python', 'merge sort', 'documentation'],
      secondary_types: ['explanation'],
      confidence: 0.85,
    },
    domain: {
      primary_domain: 'software',
      sub_domains: ['education'],
      confidence: 0.9,
      ambiguous: false,
    },
    persona: {
      role_title: 'Senior Software Engineer',
      role_definition: 'An expert software engineer with deep knowledge of algorithms and data structures.',
      expertise_areas: ['Python', 'algorithms', 'sorting', 'documentation'],
      methodology: 'Test-driven development with clean code principles.',
      communication_style: 'Clear and instructional.',
      experience_years: 12,
    },
    reasoning: {
      reasoning_approach: 'Use extended analysis with deep verification.',
      depth_level: 'deep',
      thinking_budget: 'maximum',
      verification_needed: true,
    },
    structure: {
      instructions: [
        'Implement merge sort in Python.',
        'Add type hints to all functions.',
        'Write comprehensive docstrings.',
        'Include time and space complexity analysis.',
        'Provide a usage example.',
      ],
      output_format: 'code',
      audience_level: 'professional',
      positive_constraints: ['Include type hints', 'Follow PEP 8'],
      negative_constraints: ['Avoid global variables'],
      examples_needed: true,
    },
    ...overrides,
  };
}

describe('Stage 6 — Prompt Synthesis', () => {
  test('produces all 8 prompt sections', () => {
    const result = synthesizePrompt(makeFullCtx());
    for (const section of ALL_PROMPT_SECTIONS) {
      expect(result.sections).toHaveProperty(section);
      expect(typeof result.sections[section as PromptSection]).toBe('string');
      expect(result.sections[section as PromptSection].length).toBeGreaterThan(0);
    }
  });

  test('quality_breakdown covers all 12 criteria', () => {
    const result = synthesizePrompt(makeFullCtx());
    for (const criterion of ALL_QUALITY_CRITERIA) {
      expect(result.quality_breakdown).toHaveProperty(criterion);
    }
  });

  test('quality_score is in valid range 0-24', () => {
    const result = synthesizePrompt(makeFullCtx());
    expect(result.quality_score).toBeGreaterThanOrEqual(0);
    expect(result.quality_score).toBeLessThanOrEqual(24);
  });

  test('quality_label is one of the valid labels', () => {
    const result = synthesizePrompt(makeFullCtx());
    expect(['poor', 'acceptable', 'good', 'excellent']).toContain(result.quality_label);
  });

  test('assembled prompt contains XML section markers', () => {
    const result = synthesizePrompt(makeFullCtx());
    expect(result.assembled_prompt).toContain('<role>');
    expect(result.assembled_prompt).toContain('</role>');
    expect(result.assembled_prompt).toContain('<mission>');
    expect(result.assembled_prompt).toContain('</mission>');
  });

  test('assembled prompt is non-empty string', () => {
    const result = synthesizePrompt(makeFullCtx());
    expect(typeof result.assembled_prompt).toBe('string');
    expect(result.assembled_prompt.length).toBeGreaterThan(100);
  });

  test('high-quality input → score ≥ 12', () => {
    const result = synthesizePrompt(makeFullCtx());
    expect(result.quality_score).toBeGreaterThanOrEqual(12);
  });

  test('creative_writing domain produces valid output', () => {
    const ctx = makeFullCtx({
      intent: {
        intent: 'Write a short story about a robot learning to paint.',
        task_type: 'creative_writing',
        complexity: 'moderate',
        key_entities: ['robot', 'painting', 'story'],
        secondary_types: [],
        confidence: 0.9,
      },
      domain: {
        primary_domain: 'creative',
        sub_domains: [],
        confidence: 0.85,
        ambiguous: false,
      },
    });
    const result = synthesizePrompt(ctx);
    expect(ALL_PROMPT_SECTIONS.every(s => result.sections[s as PromptSection])).toBe(true);
    expect(result.quality_score).toBeGreaterThanOrEqual(0);
  });

  test('simple complexity input still produces all sections', () => {
    const ctx = makeFullCtx({
      intent: {
        intent: 'Write hello world',
        task_type: 'code_generation',
        complexity: 'simple',
        key_entities: ['hello world'],
        secondary_types: [],
        confidence: 0.6,
      },
    });
    const result = synthesizePrompt(ctx);
    expect(Object.keys(result.sections)).toHaveLength(ALL_PROMPT_SECTIONS.length);
  });

  test('enhancement pass runs for intentionally low-quality input', () => {
    const ctx = makeFullCtx({
      intent: {
        intent: 'x',
        task_type: 'general',
        complexity: 'simple',
        key_entities: [],
        secondary_types: [],
        confidence: 0.3,
      },
      domain: {
        primary_domain: 'general',
        sub_domains: [],
        confidence: 0.2,
        ambiguous: true,
      },
      persona: {
        role_title: 'Assistant',
        role_definition: 'A general assistant.',
        expertise_areas: [],
        methodology: '',
        communication_style: '',
        experience_years: 0,
      },
      reasoning: {
        reasoning_approach: 'Basic approach.',
        depth_level: 'standard',
        thinking_budget: 'minimal',
        verification_needed: false,
      },
      structure: {
        instructions: ['Do something.'],
        output_format: 'prose',
        audience_level: 'beginner',
        positive_constraints: [],
        negative_constraints: [],
        examples_needed: false,
      },
    });
    const result = synthesizePrompt(ctx);
    // Should still produce a valid output even if low quality
    expect(result.assembled_prompt.length).toBeGreaterThan(0);
    expect(ALL_PROMPT_SECTIONS.every(s => result.sections[s as PromptSection] !== undefined)).toBe(true);
  });

  describe('Adaptive Compilation Levels', () => {
    test('compilation_level: light produces lean zero-shot prompt without XML tags', () => {
      const ctx = makeFullCtx({ compilation_level: 'light' });
      const result = synthesizePrompt(ctx);
      expect(result.metadata.effective_level).toBe('light');
      expect(result.prompt).not.toContain('<role>');
      expect(result.prompt).not.toContain('<instructions>');
      expect(result.prompt).not.toContain('<quality_standard>');
      expect(result.prompt.length).toBeLessThan(400);
      expect(result.prompt).toContain('Format: Return output in code format.');
    });

    test('compilation_level: standard produces clean markdown sections without XML tags', () => {
      const ctx = makeFullCtx({ compilation_level: 'standard' });
      const result = synthesizePrompt(ctx);
      expect(result.metadata.effective_level).toBe('standard');
      expect(result.prompt).not.toContain('<role>');
      expect(result.prompt).toContain('### Role');
      expect(result.prompt).toContain('### Task');
      expect(result.prompt).toContain('### Key Requirements');
    });

    test('compilation_level: deep produces full 8 XML-delimited sections', () => {
      const ctx = makeFullCtx({ compilation_level: 'deep' });
      const result = synthesizePrompt(ctx);
      expect(result.metadata.effective_level).toBe('deep');
      expect(result.prompt).toContain('<role>');
      expect(result.prompt).toContain('<quality_standard>');
      expect(result.prompt).toContain('<reasoning>');
    });

    test('compilation_level: auto adapts to simple complexity as light', () => {
      const ctx = makeFullCtx({
        compilation_level: 'auto',
        intent: {
          intent: 'reverse a string',
          task_type: 'code_generation',
          complexity: 'simple',
          key_entities: ['string'],
          secondary_types: [],
          confidence: 0.9,
        },
      });
      const result = synthesizePrompt(ctx);
      expect(result.metadata.effective_level).toBe('light');
      expect(result.prompt).not.toContain('<role>');
    });
  });

  describe('Model-Specific Platform Optimization', () => {
    test('target_platform: chatgpt uses markdown headers instead of XML tags', () => {
      const ctx = makeFullCtx({
        compilation_level: 'deep',
        target_platform: 'chatgpt',
      });
      const result = synthesizePrompt(ctx);
      expect(result.metadata.target_platform).toBe('chatgpt');
      expect(result.prompt).toContain('# Role & Persona');
      expect(result.prompt).toContain('# Objective');
      expect(result.prompt).not.toContain('<role>');
      expect(result.prompt).not.toContain('</role>');
    });

    test('target_platform: claude uses native XML section delimiters', () => {
      const ctx = makeFullCtx({
        compilation_level: 'deep',
        target_platform: 'claude',
      });
      const result = synthesizePrompt(ctx);
      expect(result.metadata.target_platform).toBe('claude');
      expect(result.prompt).toContain('<role>');
      expect(result.prompt).toContain('</role>');
      expect(result.prompt).toContain('<quality_standard>');
    });

    test('target_platform: gemini uses clear natural sectioning', () => {
      const ctx = makeFullCtx({
        compilation_level: 'deep',
        target_platform: 'gemini',
      });
      const result = synthesizePrompt(ctx);
      expect(result.metadata.target_platform).toBe('gemini');
      expect(result.prompt).toContain('## Role');
      expect(result.prompt).toContain('## Task');
      expect(result.prompt).not.toContain('<role>');
    });

    test('target_platform: perplexity uses concise formatting', () => {
      const ctx = makeFullCtx({
        compilation_level: 'deep',
        target_platform: 'perplexity',
      });
      const result = synthesizePrompt(ctx);
      expect(result.metadata.target_platform).toBe('perplexity');
      expect(result.prompt).toContain('### Rules');
      expect(result.prompt).not.toContain('<role>');
    });
  });

  describe('Multi-Turn Context Awareness', () => {
    test('synthesizePrompt integrates previous turn context seamlessly', () => {
      const ctx = makeFullCtx({
        compilation_level: 'standard',
        multi_turn: {
          previousTurn: {
            input: 'Create an Express user login endpoint',
            output: 'Here is the app.post("/login") route with bcrypt...',
          },
        },
      });
      const result = synthesizePrompt(ctx);
      expect(result.metadata.multi_turn).toBe(true);
      expect(result.sections.context).toContain('Prior Conversation Context');
      expect(result.sections.context).toContain('Create an Express user login endpoint');
      expect(result.sections.context).toContain('Build upon and refine the prior response directly');
    });
  });
});
