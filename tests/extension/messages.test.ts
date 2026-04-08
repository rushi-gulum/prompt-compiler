import type {
  CompileRequest, GetSettingsRequest, UpdateSettingsRequest,
  ExtensionRequest, CompileSuccessResponse, CompileErrorResponse,
  SettingsResponse, UserSettings,
} from '../../src/extension/shared/messages.js';

describe('Message Types', () => {
  test('CompileRequest has correct shape', () => {
    const req: CompileRequest = { action: 'compile', payload: { rawIdea: 'test' } };
    expect(req.action).toBe('compile');
    expect(req.payload.rawIdea).toBe('test');
  });

  test('GetSettingsRequest has correct shape', () => {
    const req: GetSettingsRequest = { action: 'get_settings' };
    expect(req.action).toBe('get_settings');
  });

  test('UpdateSettingsRequest has correct shape', () => {
    const req: UpdateSettingsRequest = {
      action: 'update_settings',
      payload: { theme: 'dark' },
    };
    expect(req.action).toBe('update_settings');
    expect(req.payload.theme).toBe('dark');
  });

  test('CompileSuccessResponse shape is valid', () => {
    const res: CompileSuccessResponse = {
      success: true,
      data: {
        prompt: 'test',
        assembled_prompt: 'test',
        sections: {
          role: '', mission: '', behavioral_rules: '', context: '',
          reasoning: '', instructions: '', output_format: '', quality_standard: '',
        },
        quality_score: 18,
        quality_label: 'good',
        quality_breakdown: {
          role_persona: 2, task_specificity: 2, context: 1, reasoning_guidance: 1,
          instructions: 2, output_format: 2, constraints: 2, examples: 1,
          audience: 1, anti_hallucination: 1, security: 2, structural_clarity: 1,
        },
        metadata: {
          task_type: 'code_generation',
          domain: 'software',
          complexity: 'moderate',
          processing_time_ms: 10,
          warnings: [],
          enhanced: false,
        },
      },
    };
    expect(res.success).toBe(true);
  });

  test('CompileErrorResponse shape is valid', () => {
    const res: CompileErrorResponse = {
      success: false,
      error: { code: 'INPUT_EMPTY', message: 'Input cannot be empty' },
    };
    expect(res.success).toBe(false);
    expect(res.error.code).toBe('INPUT_EMPTY');
  });

  test('ExtensionRequest union covers all action types', () => {
    const requests: ExtensionRequest[] = [
      { action: 'compile', payload: { rawIdea: 'test' } },
      { action: 'get_settings' },
      { action: 'update_settings', payload: { theme: 'light' } },
    ];
    expect(requests).toHaveLength(3);
    expect(requests.map(r => r.action)).toEqual(['compile', 'get_settings', 'update_settings']);
  });
});
