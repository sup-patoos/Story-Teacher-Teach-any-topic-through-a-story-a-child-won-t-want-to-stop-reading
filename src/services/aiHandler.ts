/**
 * @file aiHandler.ts
 * Robust AI response execution helper with JSON validation,
 * automatic retry on invalid JSON, and retry on 503/429 status codes.
 */

export interface AiCallOptions {
  maxRetries?: number;
  initialBackoffMs?: number;
  logError?: (message: string) => void;
}

/**
 * Sanitizes user-entered text by stripping control characters and HTML tags,
 * normalizing whitespace, and limiting length.
 */
export function sanitizeInput(input: unknown, maxLength = 300): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Executes an AI generation call with JSON parsing and resilience retries:
 * - Returns parsed JSON on successful response
 * - Retries once if the response text contains invalid or malformed JSON
 * - Retries with exponential backoff on 503 (Service Unavailable) or 429 (Rate Limit)
 * - Returns safe, predictable output or throws last error
 */
export async function executeAiCallWithRetry<T = any>(
  caller: (attempt: number) => Promise<{ text?: string }>,
  options: AiCallOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 1;
  const initialBackoffMs = options.initialBackoffMs ?? 200;
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await caller(attempt);
      const rawText = response.text?.trim() || '';
      if (!rawText) {
        throw new Error('Empty response received from AI');
      }
      const parsed = JSON.parse(rawText);
      return parsed as T;
    } catch (err: any) {
      lastError = err;
      const status = Number(err?.status || err?.statusCode || err?.code || 0);
      const isRetryableHttp = status === 429 || status === 503;
      const isJsonParseError = err instanceof SyntaxError || String(err?.message || '').toLowerCase().includes('json');
      const isEmptyResponse = err?.message === 'Empty response received from AI';

      const shouldRetry = attempt < maxRetries && (isRetryableHttp || isJsonParseError || isEmptyResponse);

      if (options.logError) {
        options.logError(`Attempt ${attempt + 1}/${maxRetries + 1} failed: ${err.message || String(err)}`);
      }

      if (shouldRetry) {
        const delay = initialBackoffMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      break;
    }
  }

  throw lastError;
}
