import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/projects/[id]/boreholes/route";
import { POST } from "@/app/api/boreholes/route";
import { PUT, DELETE } from "@/app/api/boreholes/[id]/route";

// Mock the supabase server client
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockOrder = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
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
  return new Request("http://localhost:3000/api/boreholes", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/projects/[id]/boreholes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new Request("http://localhost:3000/api/projects/proj-1/boreholes");
    const response = await GET(request, {
      params: Promise.resolve({ id: "proj-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 404 when project does not exist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const mockProjectSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "not found" },
    });
    const mockProjectEq = vi.fn().mockReturnValue({ single: mockProjectSingle });
    const mockProjectSelect = vi.fn().mockReturnValue({ eq: mockProjectEq });
    mockFrom.mockReturnValue({ select: mockProjectSelect });

    const request = new Request("http://localhost:3000/api/projects/nonexistent/boreholes");
    const response = await GET(request, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Project not found");
  });

  it("returns boreholes sorted by borehole_id", async () => {
    const mockBoreholes = [
      {
        id: "bh-1",
        project_id: "proj-1",
        borehole_id: "BH01",
        location_description: "Near river",
        easting: 500000,
        northing: 200000,
        ground_level: 45.5,
        scale: "1:50",
        hole_type: "Rotary",
        start_date: "2024-01-01",
        end_date: "2024-01-05",
        logged_by: "JD",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "bh-2",
        project_id: "proj-1",
        borehole_id: "BH02",
        location_description: "Hilltop",
        easting: 500100,
        northing: 200100,
        ground_level: 50.0,
        scale: "1:50",
        hole_type: "Rotary",
        start_date: "2024-01-02",
        end_date: "2024-01-06",
        logged_by: "AB",
        created_at: "2024-01-02T00:00:00Z",
        updated_at: "2024-01-02T00:00:00Z",
      },
    ];

    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    // First call: check project exists
    const mockProjectSingle = vi.fn().mockResolvedValue({
      data: { id: "proj-1" },
      error: null,
    });
    const mockProjectEq = vi.fn().mockReturnValue({ single: mockProjectSingle });
    const mockProjectSelect = vi.fn().mockReturnValue({ eq: mockProjectEq });

    // Second call: get boreholes
    const mockReturns = vi.fn().mockResolvedValue({ data: mockBoreholes, error: null });
    const mockBhOrder = vi.fn().mockReturnValue({ returns: mockReturns });
    const mockBhEq = vi.fn().mockReturnValue({ order: mockBhOrder });
    const mockBhSelect = vi.fn().mockReturnValue({ eq: mockBhEq });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockProjectSelect };
      }
      return { select: mockBhSelect };
    });

    const request = new Request("http://localhost:3000/api/projects/proj-1/boreholes");
    const response = await GET(request, {
      params: Promise.resolve({ id: "proj-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual(mockBoreholes);
    expect(mockBhOrder).toHaveBeenCalledWith("borehole_id", { ascending: true });
  });

  it("returns 500 when database query fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    // First call: check project exists
    const mockProjectSingle = vi.fn().mockResolvedValue({
      data: { id: "proj-1" },
      error: null,
    });
    const mockProjectEq = vi.fn().mockReturnValue({ single: mockProjectSingle });
    const mockProjectSelect = vi.fn().mockReturnValue({ eq: mockProjectEq });

    // Second call: get boreholes - fails
    const mockReturns = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Database error" },
    });
    const mockBhOrder = vi.fn().mockReturnValue({ returns: mockReturns });
    const mockBhEq = vi.fn().mockReturnValue({ order: mockBhOrder });
    const mockBhSelect = vi.fn().mockReturnValue({ eq: mockBhEq });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockProjectSelect };
      }
      return { select: mockBhSelect };
    });

    const request = new Request("http://localhost:3000/api/projects/proj-1/boreholes");
    const response = await GET(request, {
      params: Promise.resolve({ id: "proj-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Database error");
  });
});

describe("POST /api/boreholes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = createMockRequest({
      project_id: "proj-1",
      borehole_id: "BH01",
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 400 when project_id is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      project_id: "",
      borehole_id: "BH01",
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Project ID is required");
  });

  it("returns 400 when borehole_id is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      project_id: "proj-1",
      borehole_id: "",
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Borehole ID is required");
  });

  it("returns 400 when easting is not a number", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      project_id: "proj-1",
      borehole_id: "BH01",
      easting: "not-a-number",
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Easting must be a number");
  });

  it("returns 400 when northing is not a number", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      project_id: "proj-1",
      borehole_id: "BH01",
      northing: "abc",
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Northing must be a number");
  });

  it("returns 400 when ground_level is not a number", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      project_id: "proj-1",
      borehole_id: "BH01",
      ground_level: "high",
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Ground level must be a number");
  });

  it("creates a borehole successfully with minimal fields", async () => {
    const mockBorehole = {
      id: "bh-new",
      project_id: "proj-1",
      borehole_id: "BH01",
      location_description: "",
      easting: 0,
      northing: 0,
      ground_level: 0,
      scale: "1:50",
      hole_type: "Rotary",
      start_date: null,
      end_date: null,
      logged_by: "",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockSingle.mockResolvedValue({ data: mockBorehole, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ insert: mockInsert });

    const request = createMockRequest({
      project_id: "proj-1",
      borehole_id: "BH01",
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.data).toEqual(mockBorehole);
    expect(mockInsert).toHaveBeenCalledWith({
      project_id: "proj-1",
      borehole_id: "BH01",
      location_description: "",
      easting: 0,
      northing: 0,
      ground_level: 0,
      scale: "1:50",
      hole_type: "Rotary",
      start_date: null,
      end_date: null,
      logged_by: "",
    });
  });

  it("creates a borehole successfully with all fields", async () => {
    const mockBorehole = {
      id: "bh-new",
      project_id: "proj-1",
      borehole_id: "BH01",
      location_description: "Near river",
      easting: 500000,
      northing: 200000,
      ground_level: 45.5,
      scale: "1:100",
      hole_type: "Cable Percussion",
      start_date: "2024-01-01",
      end_date: "2024-01-05",
      logged_by: "JD",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockSingle.mockResolvedValue({ data: mockBorehole, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ insert: mockInsert });

    const request = createMockRequest({
      project_id: "proj-1",
      borehole_id: "BH01",
      location_description: "Near river",
      easting: 500000,
      northing: 200000,
      ground_level: 45.5,
      scale: "1:100",
      hole_type: "Cable Percussion",
      start_date: "2024-01-01",
      end_date: "2024-01-05",
      logged_by: "JD",
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.data).toEqual(mockBorehole);
  });

  it("returns 409 on duplicate borehole_id within project", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: "23505", message: "duplicate key" },
    });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ insert: mockInsert });

    const request = createMockRequest({
      project_id: "proj-1",
      borehole_id: "BH01",
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toBe("A borehole with this ID already exists in the project");
  });

  it("returns 404 when project_id references non-existent project", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: "23503", message: "foreign key violation" },
    });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ insert: mockInsert });

    const request = createMockRequest({
      project_id: "nonexistent",
      borehole_id: "BH01",
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Project not found");
  });
});

describe("PUT /api/boreholes/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new Request("http://localhost:3000/api/boreholes/bh-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ borehole_id: "BH02" }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 404 when borehole does not exist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const mockExistSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "not found" },
    });
    const mockExistEq = vi.fn().mockReturnValue({ single: mockExistSingle });
    const mockExistSelect = vi.fn().mockReturnValue({ eq: mockExistEq });
    mockFrom.mockReturnValue({ select: mockExistSelect });

    const request = new Request("http://localhost:3000/api/boreholes/nonexistent", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ borehole_id: "BH02" }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Borehole not found");
  });

  it("returns 400 when borehole_id is empty string", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = new Request("http://localhost:3000/api/boreholes/bh-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ borehole_id: "  " }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Borehole ID cannot be empty");
  });

  it("returns 400 when easting is not a number", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = new Request("http://localhost:3000/api/boreholes/bh-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ easting: "abc" }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Easting must be a number");
  });

  it("updates a borehole successfully", async () => {
    const updatedBorehole = {
      id: "bh-1",
      project_id: "proj-1",
      borehole_id: "BH01-Updated",
      location_description: "Updated location",
      easting: 500100,
      northing: 200100,
      ground_level: 46.0,
      scale: "1:50",
      hole_type: "Rotary",
      start_date: "2024-01-01",
      end_date: "2024-01-05",
      logged_by: "JD",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    };

    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    // First call: check existence
    const mockExistSingle = vi.fn().mockResolvedValue({
      data: { id: "bh-1" },
      error: null,
    });
    const mockExistEq = vi.fn().mockReturnValue({ single: mockExistSingle });
    const mockExistSelect = vi.fn().mockReturnValue({ eq: mockExistEq });

    // Second call: update
    const mockUpdateSingle = vi.fn().mockResolvedValue({
      data: updatedBorehole,
      error: null,
    });
    const mockUpdateSelect = vi.fn().mockReturnValue({
      single: mockUpdateSingle,
    });
    const mockUpdateEq = vi.fn().mockReturnValue({
      select: mockUpdateSelect,
    });
    const mockUpdateFn = vi.fn().mockReturnValue({ eq: mockUpdateEq });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockExistSelect };
      }
      return { update: mockUpdateFn };
    });

    const request = new Request("http://localhost:3000/api/boreholes/bh-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        borehole_id: "BH01-Updated",
        location_description: "Updated location",
        easting: 500100,
        northing: 200100,
        ground_level: 46.0,
      }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual(updatedBorehole);
  });

  it("returns 409 on duplicate borehole_id within project", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    // First call: check existence
    const mockExistSingle = vi.fn().mockResolvedValue({
      data: { id: "bh-1" },
      error: null,
    });
    const mockExistEq = vi.fn().mockReturnValue({ single: mockExistSingle });
    const mockExistSelect = vi.fn().mockReturnValue({ eq: mockExistEq });

    // Second call: update fails with unique constraint
    const mockUpdateSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "23505", message: "duplicate key" },
    });
    const mockUpdateSelect = vi.fn().mockReturnValue({
      single: mockUpdateSingle,
    });
    const mockUpdateEq = vi.fn().mockReturnValue({
      select: mockUpdateSelect,
    });
    const mockUpdateFn = vi.fn().mockReturnValue({ eq: mockUpdateEq });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockExistSelect };
      }
      return { update: mockUpdateFn };
    });

    const request = new Request("http://localhost:3000/api/boreholes/bh-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ borehole_id: "BH02" }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toBe("A borehole with this ID already exists in the project");
  });
});

describe("DELETE /api/boreholes/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new Request("http://localhost:3000/api/boreholes/bh-1", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 404 when borehole does not exist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const mockExistSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "not found" },
    });
    const mockExistEq = vi.fn().mockReturnValue({ single: mockExistSingle });
    const mockExistSelect = vi.fn().mockReturnValue({ eq: mockExistEq });
    mockFrom.mockReturnValue({ select: mockExistSelect });

    const request = new Request("http://localhost:3000/api/boreholes/nonexistent", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "nonexistent" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Borehole not found");
  });

  it("deletes a borehole successfully", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    // First call: check existence
    const mockExistSingle = vi.fn().mockResolvedValue({
      data: { id: "bh-1" },
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

    const request = new Request("http://localhost:3000/api/boreholes/bh-1", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "bh-1" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.message).toBe("Borehole deleted successfully");
  });
});
