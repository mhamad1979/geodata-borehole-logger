import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/boreholes/[id]/water-strikes/route";
import { DELETE } from "@/app/api/water-strikes/[id]/route";

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
  return new Request("http://localhost:3000/api/boreholes/bh-1/water-strikes", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/boreholes/[id]/water-strikes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new Request("http://localhost:3000/api/boreholes/bh-1/water-strikes");
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

    const request = new Request("http://localhost:3000/api/boreholes/nonexistent/water-strikes");
    const response = await GET(request, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Borehole not found");
  });

  it("returns water strikes sorted by date descending", async () => {
    const mockWaterStrikes = [
      {
        id: "ws-2",
        borehole_id: "bh-1",
        date: "2024-02-15",
        strike_depth: 8.5,
        casing_depth: 4.0,
        depth_after_period: 6.2,
        created_at: "2024-02-15T00:00:00Z",
      },
      {
        id: "ws-1",
        borehole_id: "bh-1",
        date: "2024-01-10",
        strike_depth: 5.5,
        casing_depth: 3.0,
        depth_after_period: 4.2,
        created_at: "2024-01-10T00:00:00Z",
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

    // Second call: get water strikes
    const mockReturns = vi.fn().mockResolvedValue({ data: mockWaterStrikes, error: null });
    const mockOrder = vi.fn().mockReturnValue({ returns: mockReturns });
    const mockWsEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockWsSelect = vi.fn().mockReturnValue({ eq: mockWsEq });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockBhSelect };
      }
      return { select: mockWsSelect };
    });

    const request = new Request("http://localhost:3000/api/boreholes/bh-1/water-strikes");
    const response = await GET(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual(mockWaterStrikes);
    expect(mockOrder).toHaveBeenCalledWith("date", { ascending: false });
  });
});

describe("POST /api/boreholes/[id]/water-strikes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = createMockRequest({
      date: "2024-01-10",
      strike_depth: 5.5,
      casing_depth: 3.0,
      depth_after_period: 4.2,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 400 when date is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      strike_depth: 5.5,
      casing_depth: 3.0,
      depth_after_period: 4.2,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("date is required");
  });

  it("returns 400 when strike_depth is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      date: "2024-01-10",
      casing_depth: 3.0,
      depth_after_period: 4.2,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("strike_depth is required and must be a number");
  });

  it("returns 400 when casing_depth is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      date: "2024-01-10",
      strike_depth: 5.5,
      depth_after_period: 4.2,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("casing_depth is required and must be a number");
  });

  it("returns 400 when depth_after_period is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      date: "2024-01-10",
      strike_depth: 5.5,
      casing_depth: 3.0,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("depth_after_period is required and must be a number");
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
      date: "2024-01-10",
      strike_depth: 5.5,
      casing_depth: 3.0,
      depth_after_period: 4.2,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Borehole not found");
  });

  it("creates a water strike successfully", async () => {
    const mockWaterStrike = {
      id: "ws-new",
      borehole_id: "bh-1",
      date: "2024-01-10",
      strike_depth: 5.5,
      casing_depth: 3.0,
      depth_after_period: 4.2,
      created_at: "2024-01-10T00:00:00Z",
    };

    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    // First call: check borehole exists
    const mockBhSingle = vi.fn().mockResolvedValue({
      data: { id: "bh-1" },
      error: null,
    });
    const mockBhEq = vi.fn().mockReturnValue({ single: mockBhSingle });
    const mockBhSelect = vi.fn().mockReturnValue({ eq: mockBhEq });

    // Second call: insert water strike
    const mockInsertSingle = vi.fn().mockResolvedValue({ data: mockWaterStrike, error: null });
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
      date: "2024-01-10",
      strike_depth: 5.5,
      casing_depth: 3.0,
      depth_after_period: 4.2,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.data).toEqual(mockWaterStrike);
  });
});

describe("DELETE /api/water-strikes/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new Request("http://localhost:3000/api/water-strikes/ws-1", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "ws-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 404 when water strike does not exist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "not found" },
    });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const request = new Request("http://localhost:3000/api/water-strikes/nonexistent", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Water strike not found");
  });

  it("deletes a water strike successfully", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    // First call: check existence
    const mockExistSingle = vi.fn().mockResolvedValue({
      data: { id: "ws-1" },
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

    const request = new Request("http://localhost:3000/api/water-strikes/ws-1", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "ws-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.message).toBe("Water strike deleted successfully");
  });
});
