import { createClient } from "@/lib/supabase/server";
import type { HoleProgress } from "@/types/database";

const VALID_WATER_STATUSES = ["measured", "dry", "pumped"] as const;

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

    // Check borehole exists (RLS handles ownership)
    const { data: borehole, error: bhError } = await supabase
      .from("boreholes")
      .select("id")
      .eq("id", id)
      .single();

    if (bhError || !borehole) {
      return Response.json(
        { error: "Borehole not found" },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("hole_progress")
      .select("*")
      .eq("borehole_id", id)
      .order("date", { ascending: false })
      .returns<HoleProgress[]>();

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

export async function POST(
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
    const { date, hole_depth, casing_depth, water_depth, water_status } = body;

    // Validate date
    if (!date || typeof date !== "string" || date.trim() === "") {
      return Response.json(
        { error: "date is required" },
        { status: 400 }
      );
    }

    // Validate hole_depth
    if (hole_depth === undefined || hole_depth === null || typeof hole_depth !== "number") {
      return Response.json(
        { error: "hole_depth is required and must be a number" },
        { status: 400 }
      );
    }

    // Validate casing_depth
    if (casing_depth === undefined || casing_depth === null || typeof casing_depth !== "number") {
      return Response.json(
        { error: "casing_depth is required and must be a number" },
        { status: 400 }
      );
    }

    // Validate water_depth (nullable)
    if (water_depth !== undefined && water_depth !== null && typeof water_depth !== "number") {
      return Response.json(
        { error: "water_depth must be a number or null" },
        { status: 400 }
      );
    }

    // Validate water_status
    if (!water_status || typeof water_status !== "string") {
      return Response.json(
        { error: "water_status is required" },
        { status: 400 }
      );
    }

    if (!VALID_WATER_STATUSES.includes(water_status as typeof VALID_WATER_STATUSES[number])) {
      return Response.json(
        { error: `water_status must be one of: ${VALID_WATER_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // Check borehole exists
    const { data: borehole, error: bhError } = await supabase
      .from("boreholes")
      .select("id")
      .eq("id", id)
      .single();

    if (bhError || !borehole) {
      return Response.json(
        { error: "Borehole not found" },
        { status: 404 }
      );
    }

    // Insert the hole progress entry
    const { data, error } = await supabase
      .from("hole_progress")
      .insert({
        borehole_id: id,
        date: date.trim(),
        hole_depth,
        casing_depth,
        water_depth: water_depth ?? null,
        water_status,
      } as never)
      .select()
      .single<HoleProgress>();

    if (error) {
      // Unique constraint violation (borehole_id, date)
      if (error.code === "23505") {
        return Response.json(
          { error: "A hole progress entry already exists for this date" },
          { status: 409 }
        );
      }
      if (error.code === "23503") {
        return Response.json(
          { error: "Borehole not found" },
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
