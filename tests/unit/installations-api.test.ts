import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/boreholes/[id]/installations/route";
import { DELETE } from "@/app/api/installations/[id]/route";

// Mock the supabase server client
const mockFrom = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

function createMockRequest(body?: object, method = "POST"): Request {
  return new Request("http://localhost:3000/api/boreholes/bh-1/installations", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/boreholes/[id]/installations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new Request("http://localhost:3000/api/boreholes/bh-1/installations");
    const response = await GET(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 404 when borehole does not exist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "not found" },
    });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const request = new Request("http://localhost:3000/api/boreholes/nonexistent/installations");
    const response = await GET(request, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Borehole not found");
  });

  it("returns installations sorted by depth_from ascending", async () => {
    const mockInstallations = [
      {
        id: "inst-1",
        borehole_id: "bh-1",
        installation_type: "plain_casing",
        depth_from: 0,
        depth_to: 5.0,
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "inst-2",
        borehole_id: "bh-1",
        installation_type: "gravel_pack",
        depth_from: 5.0,
        depth_to: 10.0,
        created_at: "2024-01-01T00:00:00Z",
      },
    ];

    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    // First call: check borehole exists
    const mockBhSingle = vi.fn().mockResolvedValue({
      data: { id: "bh-1" },
      error: null,
    });
    const mockBhEq = vi.fn().mockReturnValue({ single: mockBhSingle });
    const mockBhSelect = vi.fn().mockReturnValue({ eq: mockBhEq });

    // Second call: get installations
    const mockReturns = vi.fn().mockResolvedValue({ data: mockInstallations, error: null });
    const mockOrder = vi.fn().mockReturnValue({ returns: mockReturns });
    const mockInstEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockInstSelect = vi.fn().mockReturnValue({ eq: mockInstEq });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockBhSelect };
      }
      return { select: mockInstSelect };
    });

    const request = new Request("http://localhost:3000/api/boreholes/bh-1/installations");
    const response = await GET(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual(mockInstallations);
    expect(mockOrder).toHaveBeenCalledWith("depth_from", { ascending: true });
  });
});

describe("POST /api/boreholes/[id]/installations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = createMockRequest({
      installation_type: "plain_casing",
      depth_from: 0,
      depth_to: 5.0,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 400 when installation_type is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      depth_from: 0,
      depth_to: 5.0,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("installation_type is required");
  });

  it("returns 400 when installation_type is invalid", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      installation_type: "invalid_type",
      depth_from: 0,
      depth_to: 5.0,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("installation_type must be one of");
  });

  it("returns 400 when depth_from is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      installation_type: "plain_casing",
      depth_to: 5.0,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("depth_from is required and must be a number");
  });

  it("returns 400 when depth_to is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      installation_type: "plain_casing",
      depth_from: 0,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("depth_to is required and must be a number");
  });

  it("returns 400 when depth_from >= depth_to", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      installation_type: "plain_casing",
      depth_from: 5.0,
      depth_to: 2.0,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("depth_from must be less than depth_to");
  });

  it("returns 400 when depth_from equals depth_to", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      installation_type: "screen",
      depth_from: 3.0,
      depth_to: 3.0,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("depth_from must be less than depth_to");
  });

  it("returns 404 when borehole does not exist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const mockBhSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "not found" },
    });
    const mockBhEq = vi.fn().mockReturnValue({ single: mockBhSingle });
    const mockBhSelect = vi.fn().mockReturnValue({ eq: mockBhEq });
    mockFrom.mockReturnValue({ select: mockBhSelect });

    const request = createMockRequest({
      installation_type: "plain_casing",
      depth_from: 0,
      depth_to: 5.0,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Borehole not found");
  });

  it("creates an installation successfully", async () => {
    const mockInstallation = {
      id: "inst-new",
      borehole_id: "bh-1",
      installation_type: "plain_casing",
      depth_from: 0,
      depth_to: 5.0,
      created_at: "2024-01-01T00:00:00Z",
    };

    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    // First call: check borehole exists
    const mockBhSingle = vi.fn().mockResolvedValue({
      data: { id: "bh-1" },
      error: null,
    });
    const mockBhEq = vi.fn().mockReturnValue({ single: mockBhSingle });
    const mockBhSelect = vi.fn().mockReturnValue({ eq: mockBhEq });

    // Second call: insert installation
    const mockInsertSingle = vi.fn().mockResolvedValue({ data: mockInstallation, error: null });
    const mockInsertSelect = vi.fn().mockReturnValue({ single: mockInsertSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockInsertSelect });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockBhSelect };
      }
      return { insert: mockInsert };
    });

    const request = createMockRequest({
      installation_type: "plain_casing",
      depth_from: 0,
      depth_to: 5.0,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.data).toEqual(mockInstallation);
  });

  it("accepts all valid installation types", async () => {
    const validTypes = [
      "plain_casing",
      "slotted_casing",
      "screen",
      "gravel_pack",
      "bentonite_seal",
      "cement_grout",
    ];

    for (const type of validTypes) {
      vi.clearAllMocks();

      const mockInstallation = {
        id: `inst-${type}`,
        borehole_id: "bh-1",
        installation_type: type,
        depth_from: 0,
        depth_to: 5.0,
        created_at: "2024-01-01T00:00:00Z",
      };

      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

      const mockBhSingle = vi.fn().mockResolvedValue({
        data: { id: "bh-1" },
        error: null,
      });
      const mockBhEq = vi.fn().mockReturnValue({ single: mockBhSingle });
      const mockBhSelect = vi.fn().mockReturnValue({ eq: mockBhEq });

      const mockInsertSingle = vi.fn().mockResolvedValue({ data: mockInstallation, error: null });
      const mockInsertSelect = vi.fn().mockReturnValue({ single: mockInsertSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockInsertSelect });

      let callCount = 0;
      mockFrom.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: mockBhSelect };
        }
        return { insert: mockInsert };
      });

      const request = createMockRequest({
        installation_type: type,
        depth_from: 0,
        depth_to: 5.0,
      });

      const response = await POST(request, {
        params: Promise.resolve({ id: "bh-1" }),
      });

      expect(response.status).toBe(201);
    }
  });
});

describe("DELETE /api/installations/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new Request("http://localhost:3000/api/installations/inst-1", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "inst-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 404 when installation does not exist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "not found" },
    });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const request = new Request("http://localhost:3000/api/installations/nonexistent", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Installation not found");
  });

  it("deletes an installation successfully", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    // First call: check existence
    const mockExistSingle = vi.fn().mockResolvedValue({
      data: { id: "inst-1" },
      error: null,
    });
    const mockExistEq = vi.fn().mockReturnValue({ single: mockExistSingle });
    const mockExistSelect = vi.fn().mockReturnValue({ eq: mockExistEq });

    // Second call: delete
    const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
    const mockDeleteFn = vi.fn().mockReturnValue({ eq: mockDeleteEq });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockExistSelect };
      }
      return { delete: mockDeleteFn };
    });

    const request = new Request("http://localhost:3000/api/installations/inst-1", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "inst-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.message).toBe("Installation deleted successfully");
  });
});
