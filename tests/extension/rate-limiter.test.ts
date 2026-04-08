import { jest } from '@jest/globals';
import { canCompile, recordCompile } from '../../src/extension/shared/rate-limiter.js';
import { chromeMock, installChromeMock, resetChromeMock } from '../mocks/chrome.js';

describe('Rate Limiter', () => {
  beforeEach(() => {
    installChromeMock();
    resetChromeMock();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('allows compilation when under limit', async () => {
    const allowed = await canCompile();
    expect(allowed).toBe(true);
  });

  it('records compile and updates tokens', async () => {
    await recordCompile();
    const allowed = await canCompile();
    expect(allowed).toBe(true);
  });

  it('blocks when limit reached', async () => {
    // Consume all 10 tokens
    for (let i = 0; i < 10; i++) {
      expect(await canCompile()).toBe(true);
      await recordCompile();
    }
    // 11th should fail
    const allowed = await canCompile();
    expect(allowed).toBe(false);
  });

  it('replenishes tokens over time', async () => {
    // Consume 1 token
    await recordCompile();

    // Advance time by 60s
    jest.advanceTimersByTime(61000);

    // Should be able to compile 10 times again
    for (let i = 0; i < 10; i++) {
      expect(await canCompile()).toBe(true);
      await recordCompile();
    }
  });
});
