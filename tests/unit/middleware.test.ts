import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the @supabase/auth-helpers-nextjs module
const mockGetSession = vi.fn();
vi.mock("@supabase/auth-helpers-nextjs", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getSession: mockGetSession,
    },
  })),
}));

// Mock next/server
const mockRedirect = vi.fn();
const mockNext = vi.fn();

vi.mock("next/server", () => {
  const NextResponse = {
    redirect: (url: URL) => {
      mockRedirect(url.pathname);
      return { type: "redirect", url };
    },
    next: (opts?: any) => {
      mockNext(opts);
      return {
        type: "next",
        cookies: {
          set: vi.fn(),
        },
      };
    },
  };
  return { NextResponse };
});

// Import after mocks
import { middleware } from "@/middleware";

function createMockRequest(pathname: string) {
  const url = `http://localhost:3000${pathname}`;
  return {
    nextUrl: { pathname },
    url,
    headers: new Headers(),
    cookies: {
      getAll: () => [],
      set: vi.fn(),
    },
  } as any;
}

describe("Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Protected routes without session", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ data: { session: null } });
    });

    it("redirects unauthenticated users from /dashboard to /login", async () => {
      const request = createMockRequest("/dashboard");
      await middleware(request);
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });

    it("redirects unauthenticated users from /projects to /login", async () => {
      const request = createMockRequest("/projects");
      await middleware(request);
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });

    it("redirects unauthenticated users from /projects/123 to /login", async () => {
      const request = createMockRequest("/projects/123");
      await middleware(request);
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });

    it("redirects unauthenticated users from /boreholes to /login", async () => {
      const request = createMockRequest("/boreholes");
      await middleware(request);
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });

    it("redirects unauthenticated users from /boreholes/abc to /login", async () => {
      const request = createMockRequest("/boreholes/abc");
      await middleware(request);
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });

    it("does NOT redirect unauthenticated users from /login", async () => {
      const request = createMockRequest("/login");
      await middleware(request);
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("does NOT redirect unauthenticated users from /register", async () => {
      const request = createMockRequest("/register");
      await middleware(request);
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("does NOT redirect unauthenticated users from /reset-password", async () => {
      const request = createMockRequest("/reset-password");
      await middleware(request);
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("Auth routes with active session", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: "user-123" } } },
      });
    });

    it("redirects authenticated users from /login to /dashboard", async () => {
      const request = createMockRequest("/login");
      await middleware(request);
      expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
    });

    it("redirects authenticated users from /register to /dashboard", async () => {
      const request = createMockRequest("/register");
      await middleware(request);
      expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
    });

    it("redirects authenticated users from /reset-password to /dashboard", async () => {
      const request = createMockRequest("/reset-password");
      await middleware(request);
      expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
    });

    it("does NOT redirect authenticated users from /dashboard", async () => {
      const request = createMockRequest("/dashboard");
      await middleware(request);
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("does NOT redirect authenticated users from /projects", async () => {
      const request = createMockRequest("/projects");
      await middleware(request);
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("Non-protected, non-auth routes", () => {
    it("allows access to root without session", async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });
      const request = createMockRequest("/");
      await middleware(request);
      expect(mockRedirect).not.toHaveBeenCalled();
    });

    it("allows access to root with session", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: "user-123" } } },
      });
      const request = createMockRequest("/");
      await middleware(request);
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("Session refresh", () => {
    it("calls getSession to refresh the session on each request", async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });
      const request = createMockRequest("/");
      await middleware(request);
      expect(mockGetSession).toHaveBeenCalledTimes(1);
    });
  });
});
