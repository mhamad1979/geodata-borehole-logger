import { createClient } from "@/lib/supabase/server";
import type {
  Borehole,
  Stratum,
  CoreRun,
  WaterStrike,
  Installation,
  HoleProgress,
  Project,
} from "@/types/database";

export interface BoreholeReportData {
  project: Project;
  borehole: Borehole;
  strata: Stratum[];
  coreRuns: CoreRun[];
  waterStrikes: WaterStrike[];
  installations: Installation[];
  holeProgress: HoleProgress[];
  totalDepth: number;
}

/**
 * Fetches all borehole data and assembles it into a structured object for PDF rendering.
 * Handles edge cases: no strata, missing data fields, etc.
 */
export async function assembleBoreholeReportData(
  boreholeId: string
): Promise<BoreholeReportData> {
  const supabase = await createClient();

  // Fetch borehole header
  const { data: borehole, error: boreholeError } = await supabase
    .from("boreholes")
    .select("*")
    .eq("id", boreholeId)
    .single<Borehole>();

  if (boreholeError || !borehole) {
    throw new Error("Borehole not found");
  }

  // Fetch project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", borehole.project_id)
    .single<Project>();

  if (projectError || !project) {
    throw new Error("Project not found");
  }

  // Fetch all related data in parallel
  const [strataResult, coreRunsResult, waterStrikesResult, installationsResult, holeProgressResult] =
    await Promise.all([
      supabase
        .from("strata")
        .select("*")
        .eq("borehole_id", boreholeId)
        .order("depth_from", { ascending: true }),
      supabase
        .from("core_runs")
        .select("*")
        .eq("borehole_id", boreholeId)
        .order("depth_from", { ascending: true }),
      supabase
        .from("water_strikes")
        .select("*")
        .eq("borehole_id", boreholeId)
        .order("date", { ascending: true }),
      supabase
        .from("installations")
        .select("*")
        .eq("borehole_id", boreholeId)
        .order("depth_from", { ascending: true }),
      supabase
        .from("hole_progress")
        .select("*")
        .eq("borehole_id", boreholeId)
        .order("date", { ascending: true }),
    ]);

  const strata: Stratum[] = (strataResult.data as Stratum[]) || [];
  const coreRuns: CoreRun[] = (coreRunsResult.data as CoreRun[]) || [];
  const waterStrikes: WaterStrike[] = (waterStrikesResult.data as WaterStrike[]) || [];
  const installations: Installation[] = (installationsResult.data as Installation[]) || [];
  const holeProgress: HoleProgress[] = (holeProgressResult.data as HoleProgress[]) || [];

  // Calculate total depth from strata, core runs, and installations
  const maxStrataDepth = strata.length > 0 ? Math.max(...strata.map((s) => s.depth_to)) : 0;
  const maxCoreRunDepth = coreRuns.length > 0 ? Math.max(...coreRuns.map((c) => c.depth_to)) : 0;
  const maxInstallationDepth =
    installations.length > 0 ? Math.max(...installations.map((i) => i.depth_to)) : 0;
  const maxHoleProgressDepth =
    holeProgress.length > 0 ? Math.max(...holeProgress.map((h) => h.hole_depth)) : 0;

  const totalDepth = Math.max(maxStrataDepth, maxCoreRunDepth, maxInstallationDepth, maxHoleProgressDepth, 1);

  return {
    project,
    borehole,
    strata,
    coreRuns,
    waterStrikes,
    installations,
    holeProgress,
    totalDepth,
  };
}
