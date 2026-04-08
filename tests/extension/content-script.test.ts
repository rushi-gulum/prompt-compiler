/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { chromeMock, getMessageListeners, installChromeMock, resetChromeMock } from '../mocks/chrome.js';

describe('Content Script', () => {
  beforeEach(() => {
    installChromeMock();
    resetChromeMock();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('reports a missing input element and returns an error response', async () => {
    const sentMessages: unknown[] = [];
    chromeMock.runtime.sendMessage = jest.fn(async (message: unknown) => {
      sentMessages.push(message);
      if ((message as { action?: string }).action !== 'insert_prompt') {
        return { success: true };
      }

      return new Promise((resolve) => {
        for (const listener of getMessageListeners()) {
          listener(message, {}, (response: unknown) => resolve(response));
        }
      });
    });

    await import('../../src/extension/content/content.js');

    const responsePromise = chromeMock.runtime.sendMessage({
      action: 'insert_prompt',
      payload: { text: 'Hello world', submit: false },
    });

    await jest.advanceTimersByTimeAsync(3000);

    await expect(responsePromise).resolves.toEqual({ success: false, error: 'No input element found' });

    expect(sentMessages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'log_error',
          payload: expect.objectContaining({
            source: 'content_script',
            code: 'INPUT_NOT_FOUND',
          }),
        }),
      ]),
    );
  });
});