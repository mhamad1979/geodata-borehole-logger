import { createClient } from "@/lib/supabase/server";
import type { CoreRun } from "@/types/database";

function validatePercentage(value: unknown, fieldName: string): string | null {
  if (value !== undefined) {
    if (value === null || typeof value !== "number") {
      return `${fieldName} must be a number`;
    }
    if (value < 0 || value > 100) {
      return `${fieldName} must be between 0 and 100`;
    }
  }
  return null;
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
    const { sample_type, depth_from, depth_to, recovery_percent, scr_percent, rqd_tcr_percent } = body;

    // Check core run exists
    const { data: existing, error: fetchError } = await supabase
      .from("core_runs")
      .select("*")
      .eq("id", id)
      .single<CoreRun>();

    if (fetchError || !existing) {
      return Response.json(
        { error: "Core run not found" },
        { status: 404 }
      );
    }

    // Validate sample_type if provided
    if (sample_type !== undefined && (typeof sample_type !== "string" || sample_type.trim() === "")) {
      return Response.json(
        { error: "sample_type must be a non-empty string" },
        { status: 400 }
      );
    }

    // Validate depth_from if provided
    if (depth_from !== undefined && (depth_from === null || typeof depth_from !== "number")) {
      return Response.json(
        { error: "depth_from must be a number" },
        { status: 400 }
      );
    }

    // Validate depth_to if provided
    if (depth_to !== undefined && (depth_to === null || typeof depth_to !== "number")) {
      return Response.json(
        { error: "depth_to must be a number" },
        { status: 400 }
      );
    }

    // Determine final values (use existing if not provided)
    const finalDepthFrom = depth_from !== undefined ? depth_from : existing.depth_from;
    const finalDepthTo = depth_to !== undefined ? depth_to : existing.depth_to;

    // Validate depth_from < depth_to
    if (finalDepthFrom >= finalDepthTo) {
      return Response.json(
        { error: "depth_from must be less than depth_to" },
        { status: 400 }
      );
    }

    // Validate percentages if provided
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

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (sample_type !== undefined) updateData.sample_type = sample_type.trim();
    if (depth_from !== undefined) updateData.depth_from = depth_from;
    if (depth_to !== undefined) updateData.depth_to = depth_to;
    if (recovery_percent !== undefined) updateData.recovery_percent = recovery_percent;
    if (scr_percent !== undefined) updateData.scr_percent = scr_percent;
    if (rqd_tcr_percent !== undefined) updateData.rqd_tcr_percent = rqd_tcr_percent;

    const { data, error } = await supabase
      .from("core_runs")
      .update(updateData as never)
      .eq("id", id)
      .select()
      .single<CoreRun>();

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

    // Check core run exists
    const { data: existing, error: fetchError } = await supabase
      .from("core_runs")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return Response.json(
        { error: "Core run not found" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("core_runs")
      .delete()
      .eq("id", id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data: { message: "Core run deleted successfully" } });
  } catch {
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
