import { describe, it, expect, vi } from "vitest";
import {
  fetchWithRetry,
  isRetryableStatus,
  calculateBackoffDelay,
} from "@/lib/api-client";

describe("api-client", () => {
  describe("isRetryableStatus", () => {
    it("returns true for 500 Internal Server Error", () => {
      expect(isRetryableStatus(500)).toBe(true);
    });

    it("returns true for 502 Bad Gateway", () => {
      expect(isRetryableStatus(502)).toBe(true);
    });

    it("returns true for 503 Service Unavailable", () => {
      expect(isRetryableStatus(503)).toBe(true);
    });

    it("returns true for 599", () => {
      expect(isRetryableStatus(599)).toBe(true);
    });

    it("returns false for 400 Bad Request", () => {
      expect(isRetryableStatus(400)).toBe(false);
    });

    it("returns false for 404 Not Found", () => {
      expect(isRetryableStatus(404)).toBe(false);
    });

    it("returns false for 200 OK", () => {
      expect(isRetryableStatus(200)).toBe(false);
    });

    it("returns false for 301 Redirect", () => {
      expect(isRetryableStatus(301)).toBe(false);
    });
  });

  describe("calculateBackoffDelay", () => {
    it("returns baseDelay for attempt 0", () => {
      expect(calculateBackoffDelay(0, 1000)).toBe(1000);
    });

    it("returns baseDelay * 2 for attempt 1", () => {
      expect(calculateBackoffDelay(1, 1000)).toBe(2000);
    });

    it("returns baseDelay * 4 for attempt 2", () => {
      expect(calculateBackoffDelay(2, 1000)).toBe(4000);
    });

    it("works with custom base delay", () => {
      expect(calculateBackoffDelay(0, 500)).toBe(500);
      expect(calculateBackoffDelay(1, 500)).toBe(1000);
      expect(calculateBackoffDelay(2, 500)).toBe(2000);
    });
  });

  describe("fetchWithRetry", () => {
    function mockResponse(status: number, body: object = {}): Response {
      return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }

    it("returns response on successful fetch (200)", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockResponse(200, { data: "ok" }));

      const response = await fetchWithRetry("/api/test", undefined, {
        fetchFn: mockFetch,
        baseDelay: 1,
      });

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("returns 4xx response immediately without retrying", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockResponse(400, { error: "Bad request" }));

      const response = await fetchWithRetry("/api/test", undefined, {
        fetchFn: mockFetch,
        maxRetries: 3,
        baseDelay: 1,
      });

      expect(response.status).toBe(400);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("returns 404 response immediately without retrying", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockResponse(404, { error: "Not found" }));

      const response = await fetchWithRetry("/api/test", undefined, {
        fetchFn: mockFetch,
        maxRetries: 3,
        baseDelay: 1,
      });

      expect(response.status).toBe(404);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("retries on 500 server error and returns last response after exhausting retries", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockResponse(500, { error: "Server error" }));

      const response = await fetchWithRetry("/api/test", undefined, {
        fetchFn: mockFetch,
        maxRetries: 2,
        baseDelay: 1,
      });

      expect(response.status).toBe(500);
      // Initial attempt + 2 retries = 3 calls
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("retries on network error and throws after exhausting retries", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error("Network failure"));

      await expect(
        fetchWithRetry("/api/test", undefined, {
          fetchFn: mockFetch,
          maxRetries: 2,
          baseDelay: 1,
        })
      ).rejects.toThrow("Network request failed after 3 attempts: Network failure");

      // Initial attempt + 2 retries = 3 calls
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("succeeds on retry after initial 500 error", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce(mockResponse(500, { error: "Server error" }))
        .mockResolvedValueOnce(mockResponse(200, { data: "ok" }));

      const response = await fetchWithRetry("/api/test", undefined, {
        fetchFn: mockFetch,
        maxRetries: 3,
        baseDelay: 1,
      });

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("succeeds on retry after initial network error", async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network failure"))
        .mockResolvedValueOnce(mockResponse(200, { data: "ok" }));

      const response = await fetchWithRetry("/api/test", undefined, {
        fetchFn: mockFetch,
        maxRetries: 3,
        baseDelay: 1,
      });

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("passes through request init options", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockResponse(200));

      await fetchWithRetry(
        "/api/test",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "test" }),
        },
        { fetchFn: mockFetch, baseDelay: 1 }
      );

      expect(mockFetch).toHaveBeenCalledWith("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "test" }),
      });
    });

    it("uses default maxRetries of 3 when not specified", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error("Network failure"));

      await expect(
        fetchWithRetry("/api/test", undefined, {
          fetchFn: mockFetch,
          baseDelay: 1,
        })
      ).rejects.toThrow();

      // Initial attempt + 3 retries = 4 calls
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it("handles mixed errors: network error then 500 then success", async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network failure"))
        .mockResolvedValueOnce(mockResponse(503, { error: "Unavailable" }))
        .mockResolvedValueOnce(mockResponse(200, { data: "recovered" }));

      const response = await fetchWithRetry("/api/test", undefined, {
        fetchFn: mockFetch,
        maxRetries: 3,
        baseDelay: 1,
      });

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("does not retry on 409 Conflict", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockResponse(409, { error: "Conflict" }));

      const response = await fetchWithRetry("/api/test", undefined, {
        fetchFn: mockFetch,
        maxRetries: 3,
        baseDelay: 1,
      });

      expect(response.status).toBe(409);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("does not retry on 401 Unauthorized", async () => {
      const mockFetch = vi.fn().mockResolvedValue(mockResponse(401, { error: "Unauthorized" }));

      const response = await fetchWithRetry("/api/test", undefined, {
        fetchFn: mockFetch,
        maxRetries: 3,
        baseDelay: 1,
      });

      expect(response.status).toBe(401);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
