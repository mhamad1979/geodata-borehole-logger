import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/boreholes/[id]/core-runs/route";
import { PUT, DELETE } from "@/app/api/core-runs/[id]/route";

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
  return new Request("http://localhost:3000/api/boreholes/bh-1/core-runs", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/boreholes/[id]/core-runs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new Request("http://localhost:3000/api/boreholes/bh-1/core-runs");
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

    const request = new Request("http://localhost:3000/api/boreholes/nonexistent/core-runs");
    const response = await GET(request, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Borehole not found");
  });

  it("returns core runs sorted by depth_from ascending", async () => {
    const mockCoreRuns = [
      {
        id: "cr-1",
        borehole_id: "bh-1",
        sample_type: "U100",
        depth_from: 0,
        depth_to: 1.5,
        recovery_percent: 95,
        scr_percent: 80,
        rqd_tcr_percent: 70,
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "cr-2",
        borehole_id: "bh-1",
        sample_type: "SPT",
        depth_from: 1.5,
        depth_to: 3.0,
        recovery_percent: 100,
        scr_percent: 90,
        rqd_tcr_percent: 85,
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

    // Second call: get core runs
    const mockReturns = vi.fn().mockResolvedValue({ data: mockCoreRuns, error: null });
    const mockOrder = vi.fn().mockReturnValue({ returns: mockReturns });
    const mockCrEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockCrSelect = vi.fn().mockReturnValue({ eq: mockCrEq });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockBhSelect };
      }
      return { select: mockCrSelect };
    });

    const request = new Request("http://localhost:3000/api/boreholes/bh-1/core-runs");
    const response = await GET(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual(mockCoreRuns);
    expect(mockOrder).toHaveBeenCalledWith("depth_from", { ascending: true });
  });
});

describe("POST /api/boreholes/[id]/core-runs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = createMockRequest({
      sample_type: "U100",
      depth_from: 0,
      depth_to: 1.5,
      recovery_percent: 95,
      scr_percent: 80,
      rqd_tcr_percent: 70,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 400 when sample_type is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      depth_from: 0,
      depth_to: 1.5,
      recovery_percent: 95,
      scr_percent: 80,
      rqd_tcr_percent: 70,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("sample_type is required");
  });

  it("returns 400 when depth_from is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      sample_type: "U100",
      depth_to: 1.5,
      recovery_percent: 95,
      scr_percent: 80,
      rqd_tcr_percent: 70,
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
      sample_type: "U100",
      depth_from: 0,
      recovery_percent: 95,
      scr_percent: 80,
      rqd_tcr_percent: 70,
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
      sample_type: "U100",
      depth_from: 5.0,
      depth_to: 2.5,
      recovery_percent: 95,
      scr_percent: 80,
      rqd_tcr_percent: 70,
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
      sample_type: "U100",
      depth_from: 3.0,
      depth_to: 3.0,
      recovery_percent: 95,
      scr_percent: 80,
      rqd_tcr_percent: 70,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("depth_from must be less than depth_to");
  });

  it("returns 400 when recovery_percent is out of range", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      sample_type: "U100",
      depth_from: 0,
      depth_to: 1.5,
      recovery_percent: 105,
      scr_percent: 80,
      rqd_tcr_percent: 70,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("recovery_percent must be between 0 and 100");
  });

  it("returns 400 when recovery_percent is negative", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      sample_type: "U100",
      depth_from: 0,
      depth_to: 1.5,
      recovery_percent: -5,
      scr_percent: 80,
      rqd_tcr_percent: 70,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("recovery_percent must be between 0 and 100");
  });

  it("returns 400 when scr_percent is out of range", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      sample_type: "U100",
      depth_from: 0,
      depth_to: 1.5,
      recovery_percent: 95,
      scr_percent: 150,
      rqd_tcr_percent: 70,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("scr_percent must be between 0 and 100");
  });

  it("returns 400 when rqd_tcr_percent is out of range", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      sample_type: "U100",
      depth_from: 0,
      depth_to: 1.5,
      recovery_percent: 95,
      scr_percent: 80,
      rqd_tcr_percent: -1,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("rqd_tcr_percent must be between 0 and 100");
  });

  it("returns 400 when recovery_percent is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      sample_type: "U100",
      depth_from: 0,
      depth_to: 1.5,
      scr_percent: 80,
      rqd_tcr_percent: 70,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("recovery_percent is required and must be a number");
  });

  it("creates a core run successfully", async () => {
    const mockCoreRun = {
      id: "cr-new",
      borehole_id: "bh-1",
      sample_type: "U100",
      depth_from: 0,
      depth_to: 1.5,
      recovery_percent: 95,
      scr_percent: 80,
      rqd_tcr_percent: 70,
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

    // Second call: insert core run
    const mockInsertSingle = vi.fn().mockResolvedValue({ data: mockCoreRun, error: null });
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
      sample_type: "U100",
      depth_from: 0,
      depth_to: 1.5,
      recovery_percent: 95,
      scr_percent: 80,
      rqd_tcr_percent: 70,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.data).toEqual(mockCoreRun);
  });

  it("accepts boundary percentage values (0 and 100)", async () => {
    const mockCoreRun = {
      id: "cr-new",
      borehole_id: "bh-1",
      sample_type: "SPT",
      depth_from: 2.0,
      depth_to: 3.5,
      recovery_percent: 0,
      scr_percent: 100,
      rqd_tcr_percent: 0,
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

    // Second call: insert core run
    const mockInsertSingle = vi.fn().mockResolvedValue({ data: mockCoreRun, error: null });
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
      sample_type: "SPT",
      depth_from: 2.0,
      depth_to: 3.5,
      recovery_percent: 0,
      scr_percent: 100,
      rqd_tcr_percent: 0,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.data).toEqual(mockCoreRun);
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
      sample_type: "U100",
      depth_from: 0,
      depth_to: 1.5,
      recovery_percent: 95,
      scr_percent: 80,
      rqd_tcr_percent: 70,
    });

    const response = await POST(request, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Borehole not found");
  });
});


describe("PUT /api/core-runs/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new Request("http://localhost:3000/api/core-runs/cr-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depth_from: 0, depth_to: 3.0 }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: "cr-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 404 when core run does not exist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "not found" },
    });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const request = new Request("http://localhost:3000/api/core-runs/nonexistent", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depth_to: 5.0 }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Core run not found");
  });

  it("returns 400 when depth_from >= depth_to after update", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const existingCoreRun = {
      id: "cr-1",
      borehole_id: "bh-1",
      sample_type: "U100",
      depth_from: 0,
      depth_to: 2.5,
      recovery_percent: 95,
      scr_percent: 80,
      rqd_tcr_percent: 70,
      created_at: "2024-01-01T00:00:00Z",
    };

    const mockSingle = vi.fn().mockResolvedValue({
      data: existingCoreRun,
      error: null,
    });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const request = new Request("http://localhost:3000/api/core-runs/cr-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depth_from: 5.0 }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: "cr-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("depth_from must be less than depth_to");
  });

  it("returns 400 when recovery_percent is out of range on update", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const existingCoreRun = {
      id: "cr-1",
      borehole_id: "bh-1",
      sample_type: "U100",
      depth_from: 0,
      depth_to: 2.5,
      recovery_percent: 95,
      scr_percent: 80,
      rqd_tcr_percent: 70,
      created_at: "2024-01-01T00:00:00Z",
    };

    const mockSingle = vi.fn().mockResolvedValue({
      data: existingCoreRun,
      error: null,
    });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const request = new Request("http://localhost:3000/api/core-runs/cr-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recovery_percent: 110 }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: "cr-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("recovery_percent must be between 0 and 100");
  });

  it("returns 400 when scr_percent is negative on update", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const existingCoreRun = {
      id: "cr-1",
      borehole_id: "bh-1",
      sample_type: "U100",
      depth_from: 0,
      depth_to: 2.5,
      recovery_percent: 95,
      scr_percent: 80,
      rqd_tcr_percent: 70,
      created_at: "2024-01-01T00:00:00Z",
    };

    const mockSingle = vi.fn().mockResolvedValue({
      data: existingCoreRun,
      error: null,
    });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const request = new Request("http://localhost:3000/api/core-runs/cr-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scr_percent: -10 }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: "cr-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("scr_percent must be between 0 and 100");
  });

  it("returns 400 when sample_type is empty string", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const existingCoreRun = {
      id: "cr-1",
      borehole_id: "bh-1",
      sample_type: "U100",
      depth_from: 0,
      depth_to: 2.5,
      recovery_percent: 95,
      scr_percent: 80,
      rqd_tcr_percent: 70,
      created_at: "2024-01-01T00:00:00Z",
    };

    const mockSingle = vi.fn().mockResolvedValue({
      data: existingCoreRun,
      error: null,
    });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const request = new Request("http://localhost:3000/api/core-runs/cr-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sample_type: "  " }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: "cr-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("sample_type must be a non-empty string");
  });

  it("updates a core run successfully", async () => {
    const existingCoreRun = {
      id: "cr-1",
      borehole_id: "bh-1",
      sample_type: "U100",
      depth_from: 0,
      depth_to: 2.5,
      recovery_percent: 95,
      scr_percent: 80,
      rqd_tcr_percent: 70,
      created_at: "2024-01-01T00:00:00Z",
    };

    const updatedCoreRun = {
      ...existingCoreRun,
      depth_to: 3.0,
      recovery_percent: 98,
    };

    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    // First call: get existing core run
    const mockExistSingle = vi.fn().mockResolvedValue({
      data: existingCoreRun,
      error: null,
    });
    const mockExistEq = vi.fn().mockReturnValue({ single: mockExistSingle });
    const mockExistSelect = vi.fn().mockReturnValue({ eq: mockExistEq });

    // Second call: update
    const mockUpdateSingle = vi.fn().mockResolvedValue({
      data: updatedCoreRun,
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
      return { update: mockUpdate };
    });

    const request = new Request("http://localhost:3000/api/core-runs/cr-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depth_to: 3.0, recovery_percent: 98 }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: "cr-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual(updatedCoreRun);
  });
});

describe("DELETE /api/core-runs/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new Request("http://localhost:3000/api/core-runs/cr-1", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "cr-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 404 when core run does not exist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "not found" },
    });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const request = new Request("http://localhost:3000/api/core-runs/nonexistent", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Core run not found");
  });

  it("deletes a core run successfully", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    // First call: check existence
    const mockExistSingle = vi.fn().mockResolvedValue({
      data: { id: "cr-1" },
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

    const request = new Request("http://localhost:3000/api/core-runs/cr-1", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "cr-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.message).toBe("Core run deleted successfully");
  });
});
