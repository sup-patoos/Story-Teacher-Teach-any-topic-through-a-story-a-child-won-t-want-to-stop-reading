import { describe, it, expect, vi } from 'vitest';
import { executeAiCallWithRetry } from '../services/aiHandler';

describe('AI Response Resilience & Retry Engine', () => {
  it('parses and returns valid JSON immediately on the first attempt', async () => {
    const mockCaller = vi.fn().mockResolvedValue({
      text: JSON.stringify({ title: 'Energy Transformation', scenes: [] })
    });

    const result = await executeAiCallWithRetry(mockCaller, { maxRetries: 1 });

    expect(result).toEqual({ title: 'Energy Transformation', scenes: [] });
    expect(mockCaller).toHaveBeenCalledTimes(1);
  });

  it('retries once and recovers when the first response returns invalid JSON', async () => {
    const mockCaller = vi
      .fn()
      .mockResolvedValueOnce({ text: 'Not valid JSON output from LLM' }) // 1st attempt: invalid JSON
      .mockResolvedValueOnce({ text: JSON.stringify({ title: 'Clean Recovered JSON', valid: true }) }); // 2nd attempt: valid JSON

    const result = await executeAiCallWithRetry(mockCaller, {
      maxRetries: 1,
      initialBackoffMs: 10
    });

    expect(result).toEqual({ title: 'Clean Recovered JSON', valid: true });
    expect(mockCaller).toHaveBeenCalledTimes(2);
  });

  it('throws an error when invalid JSON persists across all retries', async () => {
    const mockCaller = vi.fn().mockResolvedValue({ text: 'Corrupted text again' });

    await expect(
      executeAiCallWithRetry(mockCaller, { maxRetries: 1, initialBackoffMs: 10 })
    ).rejects.toThrow();

    expect(mockCaller).toHaveBeenCalledTimes(2);
  });

  it('retries on HTTP 503 Service Unavailable and succeeds on the second attempt', async () => {
    const error503 = new Error('Service Unavailable') as any;
    error503.status = 503;

    const mockCaller = vi
      .fn()
      .mockRejectedValueOnce(error503)
      .mockResolvedValueOnce({ text: JSON.stringify({ status: 'ok', recovered: true }) });

    const result = await executeAiCallWithRetry(mockCaller, {
      maxRetries: 1,
      initialBackoffMs: 10
    });

    expect(result).toEqual({ status: 'ok', recovered: true });
    expect(mockCaller).toHaveBeenCalledTimes(2);
  });

  it('retries on HTTP 429 Rate Limit and succeeds on the second attempt', async () => {
    const error429 = new Error('Too Many Requests') as any;
    error429.status = 429;

    const mockCaller = vi
      .fn()
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce({ text: JSON.stringify({ rateLimitCooledDown: true }) });

    const result = await executeAiCallWithRetry(mockCaller, {
      maxRetries: 1,
      initialBackoffMs: 10
    });

    expect(result).toEqual({ rateLimitCooledDown: true });
    expect(mockCaller).toHaveBeenCalledTimes(2);
  });
});
