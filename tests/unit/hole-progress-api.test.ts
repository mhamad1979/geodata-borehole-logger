import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/boreholes/[id]/hole-progress/route";
import { DELETE } from "@/app/api/hole-progress/[id]/route";

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
  return new Request("http://localhost:3000/api/boreholes/bh-1/hole-progress", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/boreholes/[id]/hole-progress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new Request("http://localhost:3000/api/boreholes/bh-1/hole-progress");
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

    const request = new Request("http://localhost:3000/api/boreholes/nonexistent/hole-progress");
    const response = await GET(request, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Borehole not found");
  });

  it("returns hole progress entries sorted by date descending", async () => {
    const mockEntries = [
      {
        id: "hp-2",
        borehole_id: "bh-1",
        date: "2024-02-15",
        hole_depth: 15.0,
        casing_depth: 8.0,
        water_depth: 6.5,
        water_status: "measured",
        created_at: "2024-02-15T00:00:00Z",
      },
      {
        id: "hp-1",
        borehole_id: "bh-1",
        date: "2024-01-10",
        hole_depth: 10.0,
        casing_depth: 5.0,
        water_depth: null,
        water_status: "dry",
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

    // Second call: get hole progress
    const mockReturns = vi.fn().mockResolvedValue({ data: mockEntries, error: null });
    const mockOrder = vi.fn().mockReturnValue({ returns: mockReturns });
    const mockHpEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockHpSelect = vi.fn().mockReturnValue({ eq: mockHpEq });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockBhSelect };
      }
      return { select: mockHpSelect };
    });

    const request = new Request("http://localhost:3000/api/boreholes/bh-1/hole-progress");
    const response = await GET(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual(mockEntries);
    expect(mockOrder).toHaveBeenCalledWith("date", { ascending: false });
  });
});

describe("POST /api/boreholes/[id]/hole-progress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = createMockRequest({
      date: "2024-01-10",
      hole_depth: 10.0,
      casing_depth: 5.0,
      water_depth: null,
      water_status: "dry",
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
      hole_depth: 10.0,
      casing_depth: 5.0,
      water_status: "dry",
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("date is required");
  });

  it("returns 400 when hole_depth is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      date: "2024-01-10",
      casing_depth: 5.0,
      water_status: "dry",
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("hole_depth is required and must be a number");
  });

  it("returns 400 when casing_depth is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      date: "2024-01-10",
      hole_depth: 10.0,
      water_status: "dry",
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("casing_depth is required and must be a number");
  });

  it("returns 400 when water_status is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      date: "2024-01-10",
      hole_depth: 10.0,
      casing_depth: 5.0,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("water_status is required");
  });

  it("returns 400 when water_status is invalid", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      date: "2024-01-10",
      hole_depth: 10.0,
      casing_depth: 5.0,
      water_status: "invalid",
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("water_status must be one of");
  });

  it("returns 400 when water_depth is not a number", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      date: "2024-01-10",
      hole_depth: 10.0,
      casing_depth: 5.0,
      water_depth: "not-a-number",
      water_status: "measured",
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("water_depth must be a number or null");
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
      hole_depth: 10.0,
      casing_depth: 5.0,
      water_status: "dry",
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Borehole not found");
  });

  it("returns 409 when duplicate date for same borehole", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    // First call: check borehole exists
    const mockBhSingle = vi.fn().mockResolvedValue({
      data: { id: "bh-1" },
      error: null,
    });
    const mockBhEq = vi.fn().mockReturnValue({ single: mockBhSingle });
    const mockBhSelect = vi.fn().mockReturnValue({ eq: mockBhEq });

    // Second call: insert fails with unique constraint violation
    const mockInsertSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "23505", message: "duplicate key value violates unique constraint" },
    });
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
      hole_depth: 10.0,
      casing_depth: 5.0,
      water_status: "dry",
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toBe("A hole progress entry already exists for this date");
  });

  it("creates a hole progress entry successfully", async () => {
    const mockEntry = {
      id: "hp-new",
      borehole_id: "bh-1",
      date: "2024-01-10",
      hole_depth: 10.0,
      casing_depth: 5.0,
      water_depth: 3.5,
      water_status: "measured",
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

    // Second call: insert hole progress
    const mockInsertSingle = vi.fn().mockResolvedValue({ data: mockEntry, error: null });
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
      hole_depth: 10.0,
      casing_depth: 5.0,
      water_depth: 3.5,
      water_status: "measured",
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.data).toEqual(mockEntry);
  });

  it("creates a hole progress entry with null water_depth", async () => {
    const mockEntry = {
      id: "hp-new",
      borehole_id: "bh-1",
      date: "2024-01-10",
      hole_depth: 10.0,
      casing_depth: 5.0,
      water_depth: null,
      water_status: "dry",
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

    // Second call: insert hole progress
    const mockInsertSingle = vi.fn().mockResolvedValue({ data: mockEntry, error: null });
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
      hole_depth: 10.0,
      casing_depth: 5.0,
      water_depth: null,
      water_status: "dry",
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.data).toEqual(mockEntry);
    expect(json.data.water_depth).toBeNull();
  });
});

describe("DELETE /api/hole-progress/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new Request("http://localhost:3000/api/hole-progress/hp-1", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "hp-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 404 when hole progress entry does not exist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "not found" },
    });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const request = new Request("http://localhost:3000/api/hole-progress/nonexistent", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Hole progress entry not found");
  });

  it("deletes a hole progress entry successfully", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    // First call: check existence
    const mockExistSingle = vi.fn().mockResolvedValue({
      data: { id: "hp-1" },
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

    const request = new Request("http://localhost:3000/api/hole-progress/hp-1", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "hp-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.message).toBe("Hole progress entry deleted successfully");
  });
});
