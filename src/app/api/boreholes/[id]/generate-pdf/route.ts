import { createClient } from "@/lib/supabase/server";
import { assembleBoreholeReportData } from "@/lib/pdf/data-assembly";
import { renderBoreholePdf } from "@/lib/pdf/renderer";

// Force Node.js runtime for PDFKit (uses fs, path)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the borehole exists and belongs to the user (RLS handles this)
    const { data: borehole, error: boreholeError } = await supabase
      .from("boreholes")
      .select("id, borehole_id")
      .eq("id", id)
      .single();

    if (boreholeError || !borehole) {
      return Response.json({ error: "Borehole not found" }, { status: 404 });
    }

    // Assemble all data for the PDF
    const reportData = await assembleBoreholeReportData(id);

    // Generate the PDF
    const pdfBuffer = await renderBoreholePdf(reportData);

    // Return the PDF as a downloadable file
    const filename = `borehole-log-${reportData.borehole.borehole_id}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);

    if (error instanceof Error && error.message === "Borehole not found") {
      return Response.json({ error: "Borehole not found" }, { status: 404 });
    }

    return Response.json(
      { error: "Failed to generate PDF. Please try again." },
      { status: 500 }
    );
  }
}
