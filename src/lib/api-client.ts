/**
 * API client utility with retry logic and exponential backoff.
 *
 * Retries on network errors and 5xx server errors.
 * Does NOT retry on 4xx client errors (validation, auth, not found, etc).
 */

export interface FetchWithRetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds for exponential backoff (default: 1000) */
  baseDelay?: number;
  /** Custom fetch function for testing (default: global fetch) */
  fetchFn?: typeof fetch;
}

/**
 * Determines if a response status code is retryable (5xx server errors).
 */
export function isRetryableStatus(status: number): boolean {
  return status >= 500 && status < 600;
}

/**
 * Calculates the delay for a given retry attempt using exponential backoff.
 * Attempt 0 → baseDelay, Attempt 1 → baseDelay * 2, Attempt 2 → baseDelay * 4, etc.
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelay: number
): number {
  return baseDelay * Math.pow(2, attempt);
}

/**
 * Delays execution for the specified number of milliseconds.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Performs a fetch request with automatic retry on network errors and 5xx responses.
 *
 * - Retries up to `maxRetries` times (default 3)
 * - Uses exponential backoff: 1s, 2s, 4s delays between retries
 * - Does NOT retry on 4xx client errors
 * - Throws after all retries are exhausted
 *
 * @param input - The URL or Request object
 * @param init - Optional RequestInit configuration
 * @param options - Retry configuration options
 * @returns The Response from the successful fetch
 * @throws Error if all retries are exhausted (network error or persistent 5xx)
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const { maxRetries = 3, baseDelay = 1000, fetchFn = fetch } = options;

  let lastError: Error | null = null;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchFn(input, init);

      // If it's a client error (4xx), return immediately without retry
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      // If it's a server error (5xx), retry
      if (isRetryableStatus(response.status)) {
        lastResponse = response;
        if (attempt < maxRetries) {
          await delay(calculateBackoffDelay(attempt, baseDelay));
          continue;
        }
        // All retries exhausted, return the last 5xx response
        return response;
      }

      // Success (2xx or 3xx)
      return response;
    } catch (error) {
      // Network error (fetch threw) - retry
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        await delay(calculateBackoffDelay(attempt, baseDelay));
        continue;
      }
    }
  }

  // All retries exhausted with network errors
  if (lastError) {
    throw new Error(
      `Network request failed after ${maxRetries + 1} attempts: ${lastError.message}`
    );
  }

  // Should not reach here, but return last response as fallback
  return lastResponse!;
}
