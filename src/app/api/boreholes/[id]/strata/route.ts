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
  existingStrata: Array<{ depth_from: number; depth_to: number }>,
  excludeId?: string
): boolean {
  for (const stratum of existingStrata) {
    if (excludeId && (stratum as Stratum).id === excludeId) continue;
    if (newFrom < stratum.depth_to && stratum.depth_from < newTo) {
      return true;
    }
  }
  return false;
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
      .from("strata")
      .select("*")
      .eq("borehole_id", id)
      .order("depth_from", { ascending: true })
      .returns<Stratum[]>();

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
    const { depth_from, depth_to, lithology, description } = body;

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

    // Validate lithology
    if (!lithology || !VALID_LITHOLOGIES.includes(lithology as LithologyType)) {
      return Response.json(
        { error: `lithology must be one of: ${VALID_LITHOLOGIES.join(", ")}` },
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

    // Check for overlaps with existing strata
    const { data: existingStrata } = await supabase
      .from("strata")
      .select("id, depth_from, depth_to")
      .eq("borehole_id", id)
      .returns<Array<{ id: string; depth_from: number; depth_to: number }>>();

    const hasOverlap = detectOverlaps(
      depth_from,
      depth_to,
      existingStrata || []
    );

    // Insert the stratum
    const { data, error } = await supabase
      .from("strata")
      .insert({
        borehole_id: id,
        depth_from,
        depth_to,
        lithology,
        description: description?.trim() || "",
      } as never)
      .select()
      .single<Stratum>();

    if (error) {
      if (error.code === "23503") {
        return Response.json(
          { error: "Borehole not found" },
          { status: 404 }
        );
      }
      return Response.json({ error: error.message }, { status: 500 });
    }

    const response: { data: Stratum; warning?: string } = { data };
    if (hasOverlap) {
      response.warning =
        "This stratum overlaps with one or more existing strata";
    }

    return Response.json(response, { status: 201 });
  } catch {
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
