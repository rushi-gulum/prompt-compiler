import { jest } from '@jest/globals';
import { logError, getErrorLog, exportErrorLog } from '../../src/extension/shared/error-reporter.js';
import { chromeMock, installChromeMock, resetChromeMock } from '../mocks/chrome.js';

describe('Error Reporter', () => {
  beforeEach(() => {
    installChromeMock();
    resetChromeMock();
  });

  it('logs an error successfully', async () => {
    await logError(
      'compile',
      'TEST_ERROR',
      'This is a test error'
    );

    const log = await getErrorLog();
    expect(log).toHaveLength(1);
    expect(log[0].code).toBe('TEST_ERROR');
    expect(log[0].message).toBe('This is a test error');
    expect(log[0].timestamp).toBeDefined();
  });

  it('caps the log at 50 entries', async () => {
    for (let i = 0; i < 55; i++) {
      await logError(
        'content_script',
        `ERR_${i}`,
        `Error ${i}`
      );
    }

    const log = await getErrorLog();
    expect(log).toHaveLength(50);
    // The oldest 5 should be evicted
    expect(log[0].code).toBe('ERR_54'); // newest first
    expect(log[49].code).toBe('ERR_5'); // oldest retained
  });

  it('exports error log as valid JSON', async () => {
    await logError(
      'settings',
      'EXPORT_TEST',
      'Export me'
    );

    const jsonStr = await exportErrorLog();
    const parsed = JSON.parse(jsonStr);
    
    expect(parsed).toBeInstanceOf(Object);
    expect(parsed.entries).toBeInstanceOf(Array);
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.entries[0].code).toBe('EXPORT_TEST');
  });
});
