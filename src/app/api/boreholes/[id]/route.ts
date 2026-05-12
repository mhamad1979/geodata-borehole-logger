import { createClient } from "@/lib/supabase/server";
import type { Borehole } from "@/types/database";

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
      .from("boreholes")
      .select("*")
      .eq("id", id)
      .single<Borehole>();

    if (error || !data) {
      return Response.json(
        { error: "Borehole not found" },
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
    const {
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

    // Validate borehole_id if provided
    if (borehole_id !== undefined && (!borehole_id || !borehole_id.trim())) {
      return Response.json(
        { error: "Borehole ID cannot be empty" },
        { status: 400 }
      );
    }

    // Validate numeric fields if provided
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

    // Check if borehole exists (RLS handles ownership)
    const { data: existing, error: fetchError } = await supabase
      .from("boreholes")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return Response.json(
        { error: "Borehole not found" },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (borehole_id !== undefined) updateData.borehole_id = borehole_id.trim();
    if (location_description !== undefined) updateData.location_description = location_description.trim();
    if (easting !== undefined) updateData.easting = easting;
    if (northing !== undefined) updateData.northing = northing;
    if (ground_level !== undefined) updateData.ground_level = ground_level;
    if (scale !== undefined) updateData.scale = scale.trim();
    if (hole_type !== undefined) updateData.hole_type = hole_type.trim();
    if (start_date !== undefined) updateData.start_date = start_date || null;
    if (end_date !== undefined) updateData.end_date = end_date || null;
    if (logged_by !== undefined) updateData.logged_by = logged_by.trim();

    const { data, error } = await supabase
      .from("boreholes")
      .update(updateData as never)
      .eq("id", id)
      .select()
      .single<Borehole>();

    if (error) {
      if (error.code === "23505") {
        return Response.json(
          { error: "A borehole with this ID already exists in the project" },
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

    // Check if borehole exists
    const { data: existing, error: fetchError } = await supabase
      .from("boreholes")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return Response.json(
        { error: "Borehole not found" },
        { status: 404 }
      );
    }

    // Delete the borehole (cascade will handle child records)
    const { error } = await supabase
      .from("boreholes")
      .delete()
      .eq("id", id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data: { message: "Borehole deleted successfully" } });
  } catch {
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
