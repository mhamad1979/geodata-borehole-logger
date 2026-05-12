import type { Stratum, LithologyType } from "@/types/database";
import { getPatternForLithology } from "@/lib/patterns";

// A4 dimensions in points (72 points per inch)
export const PAGE_WIDTH = 595.28;
export const PAGE_HEIGHT = 841.89;

// Margins
export const MARGIN_TOP = 20;
export const MARGIN_BOTTOM = 15;
export const MARGIN_LEFT = 20;
export const MARGIN_RIGHT = 20;

// Usable content area
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

// ─── Header Section ───────────────────────────────────────────────────────────
// 5 rows of header info in a bordered grid
export const HEADER_ROW_HEIGHT = 16;
export const HEADER_ROWS = 5;
export const HEADER_HEIGHT = HEADER_ROW_HEIGHT * HEADER_ROWS;

// ─── Column Header Row ────────────────────────────────────────────────────────
export const COL_HEADER_HEIGHT = 28;

// ─── Footer Section ───────────────────────────────────────────────────────────
export const REMARKS_HEIGHT = 52;
export const GROUNDWATER_TABLE_HEIGHT = 55;
export const HOLE_PROGRESS_TABLE_HEIGHT = 55;
export const FOOTER_HEIGHT = REMARKS_HEIGHT + GROUNDWATER_TABLE_HEIGHT + HOLE_PROGRESS_TABLE_HEIGHT;

// ─── Main Body Area ───────────────────────────────────────────────────────────
export const BODY_TOP = MARGIN_TOP + HEADER_HEIGHT + COL_HEADER_HEIGHT;
export const BODY_BOTTOM = PAGE_HEIGHT - MARGIN_BOTTOM - FOOTER_HEIGHT;
export const BODY_HEIGHT = BODY_BOTTOM - BODY_TOP;

// ─── Column Widths ────────────────────────────────────────────────────────────
// Matches UK Rotary Borehole Log format:
// Depth | Water | Samples (No/Type, Depth, Result, Core%, TCR/SCR/RQD) | Install | Strata Pattern | Description | Depth(R) | Level | Legend
const COL_DEPTH_W = 28;
const COL_WATER_W = 22;
// Samples sub-columns
const COL_SAMPLE_TYPE_W = 20;
const COL_SAMPLE_DEPTH_W = 32;
const COL_SAMPLE_RESULT_W = 24;
const COL_SAMPLE_CORE_W = 24;
const COL_SAMPLE_TCR_W = 32;
const COL_SAMPLES_W = COL_SAMPLE_TYPE_W + COL_SAMPLE_DEPTH_W + COL_SAMPLE_RESULT_W + COL_SAMPLE_CORE_W + COL_SAMPLE_TCR_W;
const COL_INSTALL_W = 28;
const COL_STRATA_W = 40;
const COL_DEPTH_RIGHT_W = 28;
const COL_LEVEL_W = 32;
const COL_LEGEND_W = 28;
// Description gets the remainder
const COL_DESCRIPTION_W =
  CONTENT_WIDTH -
  COL_DEPTH_W -
  COL_WATER_W -
  COL_SAMPLES_W -
  COL_INSTALL_W -
  COL_STRATA_W -
  COL_DEPTH_RIGHT_W -
  COL_LEVEL_W -
  COL_LEGEND_W;

// Build column positions left to right
let _x = MARGIN_LEFT;

export const COLUMNS = {
  depth: { x: _x, width: COL_DEPTH_W },
  water: { x: (_x += COL_DEPTH_W), width: COL_WATER_W },
  samples: {
    x: (_x += COL_WATER_W),
    width: COL_SAMPLES_W,
    // Sub-columns within samples
    type: { x: _x, width: COL_SAMPLE_TYPE_W },
    depth: { x: _x + COL_SAMPLE_TYPE_W, width: COL_SAMPLE_DEPTH_W },
    result: { x: _x + COL_SAMPLE_TYPE_W + COL_SAMPLE_DEPTH_W, width: COL_SAMPLE_RESULT_W },
    core: { x: _x + COL_SAMPLE_TYPE_W + COL_SAMPLE_DEPTH_W + COL_SAMPLE_RESULT_W, width: COL_SAMPLE_CORE_W },
    tcr: { x: _x + COL_SAMPLE_TYPE_W + COL_SAMPLE_DEPTH_W + COL_SAMPLE_RESULT_W + COL_SAMPLE_CORE_W, width: COL_SAMPLE_TCR_W },
  },
  install: { x: (_x += COL_SAMPLES_W), width: COL_INSTALL_W },
  strata: { x: (_x += COL_INSTALL_W), width: COL_STRATA_W },
  description: { x: (_x += COL_STRATA_W), width: COL_DESCRIPTION_W },
  depthRight: { x: (_x += COL_DESCRIPTION_W), width: COL_DEPTH_RIGHT_W },
  level: { x: (_x += COL_DEPTH_RIGHT_W), width: COL_LEVEL_W },
  legend: { x: (_x += COL_LEVEL_W), width: COL_LEGEND_W },
};

// ─── Scale Calculations ───────────────────────────────────────────────────────

/** Default points per metre at 1:50 scale: 1m real = 20mm on paper = ~56.7pt */
export const DEFAULT_POINTS_PER_METRE = (1000 / 50) * (72 / 25.4);

export interface DepthMarker {
  depth: number;
  y: number;
  label: string;
}

export interface StratumLayout {
  stratum: Stratum;
  yStart: number;
  yEnd: number;
  height: number;
  patternFile: string | null;
  patternLabel: string;
}

export interface LayoutConfig {
  scale: number;
  pointsPerMetre: number;
  totalDepth: number;
  depthMarkers: DepthMarker[];
  strataLayouts: StratumLayout[];
  bodyTop: number;
  bodyHeight: number;
  availableDepth: number;
  groundLevel: number;
}

/**
 * Parse scale string like "1:50" into the numeric denominator (50).
 */
export function parseScale(scaleStr: string): number {
  const match = scaleStr.match(/1:(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 50;
}

/**
 * Calculate points per metre based on scale.
 * At 1:50, 1 metre = 20mm on paper = ~56.7 points.
 */
export function calculatePointsPerMetre(scaleDenominator: number): number {
  const mmOnPaper = 1000 / scaleDenominator;
  const pointsPerMm = 72 / 25.4;
  return mmOnPaper * pointsPerMm;
}

/**
 * Generate depth markers at 1m intervals.
 */
export function generateDepthMarkers(
  totalDepth: number,
  pointsPerMetre: number,
  bodyTop: number
): DepthMarker[] {
  const markers: DepthMarker[] = [];
  for (let depth = 0; depth <= totalDepth; depth += 1) {
    const y = bodyTop + depth * pointsPerMetre;
    if (y > BODY_BOTTOM) break;
    markers.push({
      depth,
      y,
      label: depth.toFixed(1),
    });
  }
  return markers;
}

/**
 * Calculate y-positions for each stratum layer.
 */
export function calculateStrataLayouts(
  strata: Stratum[],
  pointsPerMetre: number,
  bodyTop: number
): StratumLayout[] {
  return strata.map((stratum) => {
    const yStart = bodyTop + stratum.depth_from * pointsPerMetre;
    const yEnd = bodyTop + stratum.depth_to * pointsPerMetre;
    const height = yEnd - yStart;
    const pattern = getPatternForLithology(stratum.lithology as LithologyType);
    return {
      stratum,
      yStart,
      yEnd,
      height,
      patternFile: pattern ? pattern.patternFile : null,
      patternLabel: pattern ? pattern.label : stratum.lithology,
    };
  });
}

/**
 * Build the complete layout configuration for a borehole PDF.
 */
export function buildLayoutConfig(
  scaleStr: string,
  totalDepth: number,
  strata: Stratum[],
  groundLevel: number = 0
): LayoutConfig {
  const scaleDenominator = parseScale(scaleStr);
  const pointsPerMetre = calculatePointsPerMetre(scaleDenominator);
  const availableDepth = BODY_HEIGHT / pointsPerMetre;

  const displayDepth = Math.min(totalDepth, availableDepth);

  const depthMarkers = generateDepthMarkers(displayDepth, pointsPerMetre, BODY_TOP);
  const strataLayouts = calculateStrataLayouts(strata, pointsPerMetre, BODY_TOP);

  return {
    scale: scaleDenominator,
    pointsPerMetre,
    totalDepth,
    depthMarkers,
    strataLayouts,
    bodyTop: BODY_TOP,
    bodyHeight: BODY_HEIGHT,
    availableDepth,
    groundLevel,
  };
}
