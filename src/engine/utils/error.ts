import type { CompilationError, ErrorCode } from '../types.js';

export function createError(
  stage: number,
  code: ErrorCode,
  message: string,
  recoverable: boolean
): CompilationError {
  return { stage, code, message, recoverable };
}

export function wrapError(e: unknown, stage: number): CompilationError {
  if (isCompilationError(e)) {
    return e;
  }
  if (e instanceof Error) {
    return createError(stage, 'UNKNOWN_ERROR', e.message, false);
  }
  return createError(stage, 'UNKNOWN_ERROR', String(e), false);
}

function isCompilationError(e: unknown): e is CompilationError {
  return (
    typeof e === 'object' &&
    e !== null &&
    'stage' in e &&
    'code' in e &&
    'message' in e &&
    'recoverable' in e
  );
}
