import { createClient } from "@/lib/supabase/server";

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

    // Check hole progress entry exists
    const { data: existing, error: fetchError } = await supabase
      .from("hole_progress")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return Response.json(
        { error: "Hole progress entry not found" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("hole_progress")
      .delete()
      .eq("id", id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data: { message: "Hole progress entry deleted successfully" } });
  } catch {
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
