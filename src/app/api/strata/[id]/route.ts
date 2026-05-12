import { createClient } from "@/lib/supabase/server";
import type { LithologyType, Stratum } from "@/types/database";

const VALID_LITHOLOGIES: LithologyType[] = [
  "sand",
  "clay",
  "silt",
  "gravel",
  "sandstone",
  "mudstone",
  "limestone",
  "chalk",
  "made_ground",
];

function detectOverlaps(
  newFrom: number,
  newTo: number,
  existingStrata: Array<{ id: string; depth_from: number; depth_to: number }>,
  excludeId: string
): boolean {
  for (const stratum of existingStrata) {
    if (stratum.id === excludeId) continue;
    if (newFrom < stratum.depth_to && stratum.depth_from < newTo) {
      return true;
    }
  }
  return false;
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
    const { depth_from, depth_to, lithology, description } = body;

    // Check stratum exists
    const { data: existing, error: fetchError } = await supabase
      .from("strata")
      .select("*")
      .eq("id", id)
      .single<Stratum>();

    if (fetchError || !existing) {
      return Response.json(
        { error: "Stratum not found" },
        { status: 404 }
      );
    }

    // Determine final values (use existing if not provided)
    const finalDepthFrom = depth_from !== undefined ? depth_from : existing.depth_from;
    const finalDepthTo = depth_to !== undefined ? depth_to : existing.depth_to;
    const finalLithology = lithology !== undefined ? lithology : existing.lithology;

    // Validate depth_from and depth_to are numbers if provided
    if (depth_from !== undefined && (depth_from === null || typeof depth_from !== "number")) {
      return Response.json(
        { error: "depth_from must be a number" },
        { status: 400 }
      );
    }
    if (depth_to !== undefined && (depth_to === null || typeof depth_to !== "number")) {
      return Response.json(
        { error: "depth_to must be a number" },
        { status: 400 }
      );
    }

    // Validate depth_from < depth_to
    if (finalDepthFrom >= finalDepthTo) {
      return Response.json(
        { error: "depth_from must be less than depth_to" },
        { status: 400 }
      );
    }

    // Validate lithology if provided
    if (lithology !== undefined && !VALID_LITHOLOGIES.includes(finalLithology as LithologyType)) {
      return Response.json(
        { error: `lithology must be one of: ${VALID_LITHOLOGIES.join(", ")}` },
        { status: 400 }
      );
    }

    // Check for overlaps with other strata in the same borehole
    const { data: existingStrata } = await supabase
      .from("strata")
      .select("id, depth_from, depth_to")
      .eq("borehole_id", existing.borehole_id)
      .returns<Array<{ id: string; depth_from: number; depth_to: number }>>();

    const hasOverlap = detectOverlaps(
      finalDepthFrom,
      finalDepthTo,
      existingStrata || [],
      id
    );

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (depth_from !== undefined) updateData.depth_from = depth_from;
    if (depth_to !== undefined) updateData.depth_to = depth_to;
    if (lithology !== undefined) updateData.lithology = lithology;
    if (description !== undefined) updateData.description = description.trim();

    const { data, error } = await supabase
      .from("strata")
      .update(updateData as never)
      .eq("id", id)
      .select()
      .single<Stratum>();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const response: { data: Stratum; warning?: string } = { data };
    if (hasOverlap) {
      response.warning =
        "This stratum overlaps with one or more existing strata";
    }

    return Response.json(response);
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

    // Check stratum exists
    const { data: existing, error: fetchError } = await supabase
      .from("strata")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return Response.json(
        { error: "Stratum not found" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("strata")
      .delete()
      .eq("id", id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data: { message: "Stratum deleted successfully" } });
  } catch {
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
