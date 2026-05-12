import { createClient } from "@/lib/supabase/server";
import type { CoreRun } from "@/types/database";

function validatePercentage(value: unknown, fieldName: string): string | null {
  if (value === undefined || value === null || typeof value !== "number") {
    return `${fieldName} is required and must be a number`;
  }
  if (value < 0 || value > 100) {
    return `${fieldName} must be between 0 and 100`;
  }
  return null;
}

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
      .from("core_runs")
      .select("*")
      .eq("borehole_id", id)
      .order("depth_from", { ascending: true })
      .returns<CoreRun[]>();

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
    const { sample_type, depth_from, depth_to, recovery_percent, scr_percent, rqd_tcr_percent } = body;

    // Validate sample_type
    if (!sample_type || typeof sample_type !== "string" || sample_type.trim() === "") {
      return Response.json(
        { error: "sample_type is required" },
        { status: 400 }
      );
    }

    // Validate depth_from and depth_to are numbers
    if (depth_from === undefined || depth_from === null || typeof depth_from !== "number") {
      return Response.json(
        { error: "depth_from is required and must be a number" },
        { status: 400 }
      );
    }
    if (depth_to === undefined || depth_to === null || typeof depth_to !== "number") {
      return Response.json(
        { error: "depth_to is required and must be a number" },
        { status: 400 }
      );
    }

    // Validate depth_from < depth_to
    if (depth_from >= depth_to) {
      return Response.json(
        { error: "depth_from must be less than depth_to" },
        { status: 400 }
      );
    }

    // Validate percentages
    const recoveryError = validatePercentage(recovery_percent, "recovery_percent");
    if (recoveryError) {
      return Response.json({ error: recoveryError }, { status: 400 });
    }

    const scrError = validatePercentage(scr_percent, "scr_percent");
    if (scrError) {
      return Response.json({ error: scrError }, { status: 400 });
    }

    const rqdError = validatePercentage(rqd_tcr_percent, "rqd_tcr_percent");
    if (rqdError) {
      return Response.json({ error: rqdError }, { status: 400 });
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

    // Insert the core run
    const { data, error } = await supabase
      .from("core_runs")
      .insert({
        borehole_id: id,
        sample_type: sample_type.trim(),
        depth_from,
        depth_to,
        recovery_percent,
        scr_percent,
        rqd_tcr_percent,
      } as never)
      .select()
      .single<CoreRun>();

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
