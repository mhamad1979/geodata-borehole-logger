import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/types/database";

export async function GET() {
  try {
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
      .order("updated_at", { ascending: false })
      .returns<Project[]>();

    if (error) {
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

export async function POST(request: Request) {
  try {
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

    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: name.trim(),
        project_number: project_number.trim(),
        client_name: client_name.trim(),
        location: location.trim(),
      } as never)
      .select()
      .single<Project>();

    if (error) {
      // Check for unique constraint violation
      if (error.code === "23505") {
        return Response.json(
          { error: "A project with this number already exists" },
          { status: 409 }
        );
      }
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
