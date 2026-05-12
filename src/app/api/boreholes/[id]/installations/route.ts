import { createClient } from "@/lib/supabase/server";
import type { Installation, InstallationType } from "@/types/database";

const VALID_INSTALLATION_TYPES: InstallationType[] = [
  "plain_casing",
  "slotted_casing",
  "screen",
  "gravel_pack",
  "bentonite_seal",
  "cement_grout",
];

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
      .from("installations")
      .select("*")
      .eq("borehole_id", id)
      .order("depth_from", { ascending: true })
      .returns<Installation[]>();

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
    const { installation_type, depth_from, depth_to } = body;

    // Validate installation_type
    if (!installation_type || typeof installation_type !== "string") {
      return Response.json(
        { error: "installation_type is required" },
        { status: 400 }
      );
    }

    if (!VALID_INSTALLATION_TYPES.includes(installation_type as InstallationType)) {
      return Response.json(
        { error: `installation_type must be one of: ${VALID_INSTALLATION_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate depth_from
    if (depth_from === undefined || depth_from === null || typeof depth_from !== "number") {
      return Response.json(
        { error: "depth_from is required and must be a number" },
        { status: 400 }
      );
    }

    // Validate depth_to
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

    // Insert the installation
    const { data, error } = await supabase
      .from("installations")
      .insert({
        borehole_id: id,
        installation_type,
        depth_from,
        depth_to,
      } as never)
      .select()
      .single<Installation>();

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
