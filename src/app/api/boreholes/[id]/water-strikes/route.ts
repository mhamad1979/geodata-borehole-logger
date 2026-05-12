import { createClient } from "@/lib/supabase/server";
import type { WaterStrike } from "@/types/database";

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
      .from("water_strikes")
      .select("*")
      .eq("borehole_id", id)
      .order("date", { ascending: false })
      .returns<WaterStrike[]>();

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
    const { date, strike_depth, casing_depth, depth_after_period } = body;

    // Validate date
    if (!date || typeof date !== "string" || date.trim() === "") {
      return Response.json(
        { error: "date is required" },
        { status: 400 }
      );
    }

    // Validate strike_depth
    if (strike_depth === undefined || strike_depth === null || typeof strike_depth !== "number") {
      return Response.json(
        { error: "strike_depth is required and must be a number" },
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

    // Validate depth_after_period
    if (depth_after_period === undefined || depth_after_period === null || typeof depth_after_period !== "number") {
      return Response.json(
        { error: "depth_after_period is required and must be a number" },
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

    // Insert the water strike
    const { data, error } = await supabase
      .from("water_strikes")
      .insert({
        borehole_id: id,
        date: date.trim(),
        strike_depth,
        casing_depth,
        depth_after_period,
      } as never)
      .select()
      .single<WaterStrike>();

    if (error) {
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
