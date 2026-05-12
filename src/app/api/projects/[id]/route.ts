import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/types/database";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single<Project>();

    if (error || !data) {
      return Response.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return Response.json({ data });
  } catch {
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, project_number, client_name, location } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return Response.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }
    if (!project_number || !project_number.trim()) {
      return Response.json(
        { error: "Project number is required" },
        { status: 400 }
      );
    }
    if (!client_name || !client_name.trim()) {
      return Response.json(
        { error: "Client name is required" },
        { status: 400 }
      );
    }
    if (!location || !location.trim()) {
      return Response.json(
        { error: "Location is required" },
        { status: 400 }
      );
    }

    // Check if project exists and belongs to user (RLS handles this, but we want a 404)
    const { data: existing, error: fetchError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return Response.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("projects")
      .update({
        name: name.trim(),
        project_number: project_number.trim(),
        client_name: client_name.trim(),
        location: location.trim(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", id)
      .select()
      .single<Project>();

    if (error) {
      if (error.code === "23505") {
        return Response.json(
          { error: "A project with this number already exists" },
          { status: 409 }
        );
      }
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data });
  } catch {
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if project exists
    const { data: existing, error: fetchError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return Response.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Delete the project (cascade will handle child records)
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data: { message: "Project deleted successfully" } });
  } catch {
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
