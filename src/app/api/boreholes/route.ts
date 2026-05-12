import { createClient } from "@/lib/supabase/server";
import type { Borehole } from "@/types/database";

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
    const {
      project_id,
      borehole_id,
      location_description,
      easting,
      northing,
      ground_level,
      scale,
      hole_type,
      start_date,
      end_date,
      logged_by,
    } = body;

    // Validate required fields
    if (!project_id || !project_id.trim()) {
      return Response.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }
    if (!borehole_id || !borehole_id.trim()) {
      return Response.json(
        { error: "Borehole ID is required" },
        { status: 400 }
      );
    }

    // Validate numeric fields
    if (easting !== undefined && easting !== null && typeof easting !== "number") {
      return Response.json(
        { error: "Easting must be a number" },
        { status: 400 }
      );
    }
    if (northing !== undefined && northing !== null && typeof northing !== "number") {
      return Response.json(
        { error: "Northing must be a number" },
        { status: 400 }
      );
    }
    if (ground_level !== undefined && ground_level !== null && typeof ground_level !== "number") {
      return Response.json(
        { error: "Ground level must be a number" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("boreholes")
      .insert({
        project_id: project_id.trim(),
        borehole_id: borehole_id.trim(),
        location_description: location_description?.trim() || "",
        easting: easting ?? 0,
        northing: northing ?? 0,
        ground_level: ground_level ?? 0,
        scale: scale?.trim() || "1:50",
        hole_type: hole_type?.trim() || "Rotary",
        start_date: start_date || null,
        end_date: end_date || null,
        logged_by: logged_by?.trim() || "",
      } as never)
      .select()
      .single<Borehole>();

    if (error) {
      // Check for unique constraint violation (project_id, borehole_id)
      if (error.code === "23505") {
        return Response.json(
          { error: "A borehole with this ID already exists in the project" },
          { status: 409 }
        );
      }
      // Check for foreign key violation (invalid project_id)
      if (error.code === "23503") {
        return Response.json(
          { error: "Project not found" },
          { status: 404 }
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
