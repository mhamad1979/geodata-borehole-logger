import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/projects/route";
import { PUT, DELETE } from "@/app/api/projects/[id]/route";

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

function createMockRequest(body?: object): Request {
  return new Request("http://localhost:3000/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns projects sorted by updated_at descending", async () => {
    const mockProjects = [
      {
        id: "1",
        user_id: "user-1",
        name: "Project B",
        project_number: "P002",
        client_name: "Client B",
        location: "Location B",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-03T00:00:00Z",
      },
      {
        id: "2",
        user_id: "user-1",
        name: "Project A",
        project_number: "P001",
        client_name: "Client A",
        location: "Location A",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-02T00:00:00Z",
      },
    ];

    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const mockReturns = vi.fn().mockResolvedValue({ data: mockProjects, error: null });
    mockOrder.mockReturnValue({ returns: mockReturns });
    mockSelect.mockReturnValue({ order: mockOrder });
    mockFrom.mockReturnValue({ select: mockSelect });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual(mockProjects);
    expect(mockFrom).toHaveBeenCalledWith("projects");
    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockOrder).toHaveBeenCalledWith("updated_at", { ascending: false });
  });

  it("returns 500 when database query fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const mockReturns = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Database error" },
    });
    mockOrder.mockReturnValue({ returns: mockReturns });
    mockSelect.mockReturnValue({ order: mockOrder });
    mockFrom.mockReturnValue({ select: mockSelect });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Database error");
  });
});

describe("POST /api/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = createMockRequest({
      name: "Test",
      project_number: "P001",
      client_name: "Client",
      location: "Location",
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 400 when name is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      name: "",
      project_number: "P001",
      client_name: "Client",
      location: "Location",
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Name is required");
  });

  it("returns 400 when project_number is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      name: "Test",
      project_number: "  ",
      client_name: "Client",
      location: "Location",
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Project number is required");
  });

  it("returns 400 when client_name is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      name: "Test",
      project_number: "P001",
      client_name: "",
      location: "Location",
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Client name is required");
  });

  it("returns 400 when location is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = createMockRequest({
      name: "Test",
      project_number: "P001",
      client_name: "Client",
      location: "",
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Location is required");
  });

  it("creates a project successfully", async () => {
    const mockProject = {
      id: "new-id",
      user_id: "user-1",
      name: "Test Project",
      project_number: "P001",
      client_name: "Client",
      location: "Location",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockSingle.mockResolvedValue({ data: mockProject, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ insert: mockInsert });

    const request = createMockRequest({
      name: "Test Project",
      project_number: "P001",
      client_name: "Client",
      location: "Location",
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.data).toEqual(mockProject);
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-1",
      name: "Test Project",
      project_number: "P001",
      client_name: "Client",
      location: "Location",
    });
  });

  it("returns 409 on unique constraint violation", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: "23505", message: "duplicate key" },
    });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ insert: mockInsert });

    const request = createMockRequest({
      name: "Test Project",
      project_number: "P001",
      client_name: "Client",
      location: "Location",
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toBe("A project with this number already exists");
  });
});

describe("PUT /api/projects/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new Request("http://localhost:3000/api/projects/123", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Updated",
        project_number: "P001",
        client_name: "Client",
        location: "Location",
      }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: "123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 404 when project does not exist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    // First call: select to check existence
    const mockExistSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "not found" },
    });
    const mockExistEq = vi.fn().mockReturnValue({ single: mockExistSingle });
    const mockExistSelect = vi.fn().mockReturnValue({ eq: mockExistEq });
    mockFrom.mockReturnValue({ select: mockExistSelect });

    const request = new Request("http://localhost:3000/api/projects/123", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Updated",
        project_number: "P001",
        client_name: "Client",
        location: "Location",
      }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: "123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Project not found");
  });

  it("returns 400 when required fields are missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const request = new Request("http://localhost:3000/api/projects/123", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "",
        project_number: "P001",
        client_name: "Client",
        location: "Location",
      }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: "123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Name is required");
  });

  it("updates a project successfully", async () => {
    const updatedProject = {
      id: "123",
      user_id: "user-1",
      name: "Updated Project",
      project_number: "P001",
      client_name: "Client",
      location: "New Location",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    };

    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    // First call: check existence
    const mockExistSingle = vi.fn().mockResolvedValue({
      data: { id: "123" },
      error: null,
    });
    const mockExistEq = vi.fn().mockReturnValue({ single: mockExistSingle });
    const mockExistSelect = vi.fn().mockReturnValue({ eq: mockExistEq });

    // Second call: update
    const mockUpdateSingle = vi.fn().mockResolvedValue({
      data: updatedProject,
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

    const request = new Request("http://localhost:3000/api/projects/123", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Updated Project",
        project_number: "P001",
        client_name: "Client",
        location: "New Location",
      }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ id: "123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toEqual(updatedProject);
  });
});

describe("DELETE /api/projects/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new Request("http://localhost:3000/api/projects/123", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 404 when project does not exist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const mockExistSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "not found" },
    });
    const mockExistEq = vi.fn().mockReturnValue({ single: mockExistSingle });
    const mockExistSelect = vi.fn().mockReturnValue({ eq: mockExistEq });
    mockFrom.mockReturnValue({ select: mockExistSelect });

    const request = new Request("http://localhost:3000/api/projects/123", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Project not found");
  });

  it("deletes a project successfully", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    // First call: check existence
    const mockExistSingle = vi.fn().mockResolvedValue({
      data: { id: "123" },
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

    const request = new Request("http://localhost:3000/api/projects/123", {
      method: "DELETE",
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: "123" }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.message).toBe("Project deleted successfully");
  });
});
