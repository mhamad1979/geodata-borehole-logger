import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/boreholes/[id]/strata/route";
import { PUT, DELETE } from "@/app/api/strata/[id]/route";

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
  return new Request("http://localhost:3000/api/boreholes/bh-1/strata", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/boreholes/[id]/strata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new Request("http://localhost:3000/api/boreholes/bh-1/strata");
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

    const request = new Request("http://localhost:3000/api/boreholes/nonexistent/strata");
    const response = await GET(request, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Borehole not found");
  });

  it("returns strata sorted by depth_from ascending", async () => {
    const mockStrata = [
      {
        id: "s-1",
        borehole_id: "bh-1",
        depth_from: 0,
        depth_to: 2.5,
        lithology: "sand",
        description: "Fine sand",
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "s-2",
        borehole_id: "bh-1",
        depth_from: 2.5,
        depth_to: 5.0,
        lithology: "clay",
        description: "Stiff clay",
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

    // Second call: get strata
    const mockReturns = vi.fn().mockResolvedValue({ data: mockStrata, error: null });
    const mockOrder = vi.fn().mockReturnValue({ returns: mockReturns });
    const mockStrataEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockStrataSelect = vi.fn().mockReturnValue({ eq: mockStrataEq });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockBhSelect };
      }
      return { select: mockStrataSelect };
    });

    const request = new Request("http://localhost:3000/api/boreholes/bh-1/strata");
    const response = await GET(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual(mockStrata);
    expect(mockOrder).toHaveBeenCalledWith("depth_from", { ascending: true });
  });
});

describe("POST /api/boreholes/[id]/strata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = createMockRequest({
      depth_from: 0,
      depth_to: 2.5,
      lithology: "sand",
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 400 when depth_from is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      depth_to: 2.5,
      lithology: "sand",
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
      depth_from: 0,
      lithology: "sand",
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
      depth_from: 5.0,
      depth_to: 2.5,
      lithology: "sand",
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
      depth_from: 3.0,
      depth_to: 3.0,
      lithology: "sand",
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("depth_from must be less than depth_to");
  });

  it("returns 400 when lithology is invalid", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      depth_from: 0,
      depth_to: 2.5,
      lithology: "granite",
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("lithology must be one of:");
  });

  it("returns 400 when lithology is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      depth_from: 0,
      depth_to: 2.5,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("lithology must be one of:");
  });

  it("creates a stratum successfully without overlap", async () => {
    const mockStratum = {
      id: "s-new",
      borehole_id: "bh-1",
      depth_from: 0,
      depth_to: 2.5,
      lithology: "sand",
      description: "Fine sand",
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

    // Second call: get existing strata for overlap check
    const mockReturns = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockExistEq = vi.fn().mockReturnValue({ returns: mockReturns });
    const mockExistSelect = vi.fn().mockReturnValue({ eq: mockExistEq });

    // Third call: insert stratum
    const mockInsertSingle = vi.fn().mockResolvedValue({ data: mockStratum, error: null });
    const mockInsertSelect = vi.fn().mockReturnValue({ single: mockInsertSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockInsertSelect });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockBhSelect };
      }
      if (callCount === 2) {
        return { select: mockExistSelect };
      }
      return { insert: mockInsert };
    });

    const request = createMockRequest({
      depth_from: 0,
      depth_to: 2.5,
      lithology: "sand",
      description: "Fine sand",
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.data).toEqual(mockStratum);
    expect(json.warning).toBeUndefined();
  });

  it("creates a stratum with overlap warning", async () => {
    const mockStratum = {
      id: "s-new",
      borehole_id: "bh-1",
      depth_from: 1.0,
      depth_to: 3.0,
      lithology: "clay",
      description: "Stiff clay",
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

    // Second call: get existing strata (overlapping)
    const existingStrata = [
      { id: "s-1", depth_from: 0, depth_to: 2.5 },
    ];
    const mockReturns = vi.fn().mockResolvedValue({ data: existingStrata, error: null });
    const mockExistEq = vi.fn().mockReturnValue({ returns: mockReturns });
    const mockExistSelect = vi.fn().mockReturnValue({ eq: mockExistEq });

    // Third call: insert stratum
    const mockInsertSingle = vi.fn().mockResolvedValue({ data: mockStratum, error: null });
    const mockInsertSelect = vi.fn().mockReturnValue({ single: mockInsertSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockInsertSelect });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockBhSelect };
      }
      if (callCount === 2) {
        return { select: mockExistSelect };
      }
      return { insert: mockInsert };
    });

    const request = createMockRequest({
      depth_from: 1.0,
      depth_to: 3.0,
      lithology: "clay",
      description: "Stiff clay",
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.data).toEqual(mockStratum);
    expect(json.warning).toBe("This stratum overlaps with one or more existing strata");
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
      depth_from: 0,
      depth_to: 2.5,
      lithology: "sand",
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Borehole not found");
  });
});

describe("PUT /api/strata/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new Request("http://localhost:3000/api/strata/s-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depth_from: 0, depth_to: 3.0 }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: "s-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 404 when stratum does not exist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "not found" },
    });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const request = new Request("http://localhost:3000/api/strata/nonexistent", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depth_to: 5.0 }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Stratum not found");
  });

  it("returns 400 when depth_from >= depth_to after update", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const existingStratum = {
      id: "s-1",
      borehole_id: "bh-1",
      depth_from: 0,
      depth_to: 2.5,
      lithology: "sand",
      description: "Fine sand",
      created_at: "2024-01-01T00:00:00Z",
    };

    const mockSingle = vi.fn().mockResolvedValue({
      data: existingStratum,
      error: null,
    });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const request = new Request("http://localhost:3000/api/strata/s-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depth_from: 5.0 }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: "s-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("depth_from must be less than depth_to");
  });

  it("returns 400 when lithology is invalid", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const existingStratum = {
      id: "s-1",
      borehole_id: "bh-1",
      depth_from: 0,
      depth_to: 2.5,
      lithology: "sand",
      description: "Fine sand",
      created_at: "2024-01-01T00:00:00Z",
    };

    const mockSingle = vi.fn().mockResolvedValue({
      data: existingStratum,
      error: null,
    });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const request = new Request("http://localhost:3000/api/strata/s-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lithology: "granite" }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: "s-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("lithology must be one of:");
  });

  it("updates a stratum successfully without overlap", async () => {
    const existingStratum = {
      id: "s-1",
      borehole_id: "bh-1",
      depth_from: 0,
      depth_to: 2.5,
      lithology: "sand",
      description: "Fine sand",
      created_at: "2024-01-01T00:00:00Z",
    };

    const updatedStratum = {
      ...existingStratum,
      depth_to: 3.0,
      description: "Medium sand",
    };

    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    // First call: get existing stratum
    const mockExistSingle = vi.fn().mockResolvedValue({
      data: existingStratum,
      error: null,
    });
    const mockExistEq = vi.fn().mockReturnValue({ single: mockExistSingle });
    const mockExistSelect = vi.fn().mockReturnValue({ eq: mockExistEq });

    // Second call: get strata for overlap check
    const mockReturns = vi.fn().mockResolvedValue({
      data: [{ id: "s-1", depth_from: 0, depth_to: 2.5 }],
      error: null,
    });
    const mockOverlapEq = vi.fn().mockReturnValue({ returns: mockReturns });
    const mockOverlapSelect = vi.fn().mockReturnValue({ eq: mockOverlapEq });

    // Third call: update
    const mockUpdateSingle = vi.fn().mockResolvedValue({
      data: updatedStratum,
      error: null,
    });
    const mockUpdateSelect = vi.fn().mockReturnValue({ single: mockUpdateSingle });
    const mockUpdateEq = vi.fn().mockReturnValue({ select: mockUpdateSelect });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockExistSelect };
      }
      if (callCount === 2) {
        return { select: mockOverlapSelect };
      }
      return { update: mockUpdate };
    });

    const request = new Request("http://localhost:3000/api/strata/s-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depth_to: 3.0, description: "Medium sand" }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: "s-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual(updatedStratum);
    expect(json.warning).toBeUndefined();
  });

  it("updates a stratum with overlap warning", async () => {
    const existingStratum = {
      id: "s-1",
      borehole_id: "bh-1",
      depth_from: 0,
      depth_to: 2.5,
      lithology: "sand",
      description: "Fine sand",
      created_at: "2024-01-01T00:00:00Z",
    };

    const updatedStratum = {
      ...existingStratum,
      depth_to: 4.0,
    };

    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    // First call: get existing stratum
    const mockExistSingle = vi.fn().mockResolvedValue({
      data: existingStratum,
      error: null,
    });
    const mockExistEq = vi.fn().mockReturnValue({ single: mockExistSingle });
    const mockExistSelect = vi.fn().mockReturnValue({ eq: mockExistEq });

    // Second call: get strata for overlap check (another stratum overlaps)
    const mockReturns = vi.fn().mockResolvedValue({
      data: [
        { id: "s-1", depth_from: 0, depth_to: 2.5 },
        { id: "s-2", depth_from: 3.0, depth_to: 5.0 },
      ],
      error: null,
    });
    const mockOverlapEq = vi.fn().mockReturnValue({ returns: mockReturns });
    const mockOverlapSelect = vi.fn().mockReturnValue({ eq: mockOverlapEq });

    // Third call: update
    const mockUpdateSingle = vi.fn().mockResolvedValue({
      data: updatedStratum,
      error: null,
    });
    const mockUpdateSelect = vi.fn().mockReturnValue({ single: mockUpdateSingle });
    const mockUpdateEq = vi.fn().mockReturnValue({ select: mockUpdateSelect });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockExistSelect };
      }
      if (callCount === 2) {
        return { select: mockOverlapSelect };
      }
      return { update: mockUpdate };
    });

    const request = new Request("http://localhost:3000/api/strata/s-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depth_to: 4.0 }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: "s-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual(updatedStratum);
    expect(json.warning).toBe("This stratum overlaps with one or more existing strata");
  });
});

describe("DELETE /api/strata/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new Request("http://localhost:3000/api/strata/s-1", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "s-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 404 when stratum does not exist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "not found" },
    });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const request = new Request("http://localhost:3000/api/strata/nonexistent", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Stratum not found");
  });

  it("deletes a stratum successfully", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    // First call: check existence
    const mockExistSingle = vi.fn().mockResolvedValue({
      data: { id: "s-1" },
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

    const request = new Request("http://localhost:3000/api/strata/s-1", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "s-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.message).toBe("Stratum deleted successfully");
  });
});
