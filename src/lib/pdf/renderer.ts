import PDFDocument from "pdfkit";
import * as fs from "fs";
import * as path from "path";
import type { BoreholeReportData } from "./data-assembly";
import {
  buildLayoutConfig,
  PAGE_HEIGHT,
  MARGIN_TOP,
  MARGIN_BOTTOM,
  MARGIN_LEFT,
  MARGIN_RIGHT,
  CONTENT_WIDTH,
  HEADER_HEIGHT,
  HEADER_ROW_HEIGHT,
  COL_HEADER_HEIGHT,
  COLUMNS,
  BODY_TOP,
  BODY_BOTTOM,
  REMARKS_HEIGHT,
  GROUNDWATER_TABLE_HEIGHT,
  type LayoutConfig,
} from "./layout";

// ─── Font Sizes ───────────────────────────────────────────────────────────────
const FONT_TITLE = 11;
const FONT_HEADER = 7.5;
const FONT_HEADER_BOLD = 7.5;
const FONT_COL_HEADER = 6;
const FONT_BODY = 6.5;
const FONT_SMALL = 5.5;
const FONT_DEPTH = 6;

// ─── Line Weights ─────────────────────────────────────────────────────────────
const LINE_BORDER = 0.75;
const LINE_GRID = 0.5;
const LINE_TICK = 0.3;

/**
 * Render the full borehole log PDF and return it as a Buffer.
 */
export async function renderBoreholePdf(data: BoreholeReportData): Promise<Buffer> {
  const layout = buildLayoutConfig(
    data.borehole.scale,
    data.totalDepth,
    data.strata,
    data.borehole.ground_level
  );

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT, right: MARGIN_RIGHT },
      info: {
        Title: `Borehole Log - ${data.borehole.borehole_id}`,
        Author: data.borehole.logged_by || "Geodata",
        Subject: `Rotary Borehole Log for ${data.borehole.borehole_id}`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ─── Page Border ────────────────────────────────────────────────────
    doc
      .rect(MARGIN_LEFT, MARGIN_TOP, CONTENT_WIDTH, PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM)
      .lineWidth(LINE_BORDER)
      .stroke("#000000");

    // ─── Render Sections ────────────────────────────────────────────────
    renderHeader(doc, data);
    renderColumnHeaders(doc);
    renderBody(doc, data, layout);
    renderFooter(doc, data, layout);

    doc.end();
  });
}


// ═══════════════════════════════════════════════════════════════════════════════
// HEADER SECTION - Bordered grid with project/borehole info
// ═══════════════════════════════════════════════════════════════════════════════

function renderHeader(doc: PDFKit.PDFDocument, data: BoreholeReportData) {
  const { project, borehole } = data;
  const headerTop = MARGIN_TOP;
  const headerBottom = headerTop + HEADER_HEIGHT;
  const leftCol = MARGIN_LEFT;
  const rightEdge = MARGIN_LEFT + CONTENT_WIDTH;
  const midCol = MARGIN_LEFT + CONTENT_WIDTH * 0.4;
  const rightCol = MARGIN_LEFT + CONTENT_WIDTH * 0.7;

  // ─── Header outer border ──────────────────────────────────────────────
  doc
    .rect(leftCol, headerTop, CONTENT_WIDTH, HEADER_HEIGHT)
    .lineWidth(LINE_BORDER)
    .stroke("#000000");

  // ─── Row 1: Company | Title | Borehole No ────────────────────────────
  const row1Y = headerTop;
  doc.fontSize(FONT_HEADER_BOLD).font("Helvetica-Bold");
  doc.text("Geodata Ltd", leftCol + 4, row1Y + 3, { width: midCol - leftCol - 8 });

  doc.fontSize(FONT_TITLE).font("Helvetica-Bold");
  doc.text("ROTARY BOREHOLE LOG", midCol, row1Y + 2, {
    width: rightCol - midCol,
    align: "center",
  });

  doc.fontSize(FONT_HEADER).font("Helvetica-Bold");
  doc.text(`Borehole No: `, rightCol + 4, row1Y + 3, { continued: true });
  doc.font("Helvetica").text(borehole.borehole_id);
  doc.font("Helvetica").fontSize(FONT_SMALL);
  doc.text("Sheet 1 of 1", rightCol + 4, row1Y + 11);

  // Row separator
  drawHLine(doc, leftCol, rightEdge, row1Y + HEADER_ROW_HEIGHT);

  // ─── Row 2: Project Name | Project No | Hole Type ────────────────────
  const row2Y = row1Y + HEADER_ROW_HEIGHT;
  renderHeaderCell(doc, "Project:", project.name, leftCol + 4, row2Y + 2, midCol - leftCol - 8);
  renderHeaderCell(doc, "Project No:", project.project_number, midCol + 4, row2Y + 2, rightCol - midCol - 8);
  renderHeaderCell(doc, "Hole Type:", borehole.hole_type, rightCol + 4, row2Y + 2, rightEdge - rightCol - 8);
  drawHLine(doc, leftCol, rightEdge, row2Y + HEADER_ROW_HEIGHT);

  // ─── Row 3: Location | Co-ords | Scale ───────────────────────────────
  const row3Y = row2Y + HEADER_ROW_HEIGHT;
  renderHeaderCell(doc, "Location:", project.location, leftCol + 4, row3Y + 2, midCol - leftCol - 8);
  renderHeaderCell(doc, "Co-ords:", `E: ${borehole.easting}  N: ${borehole.northing}`, midCol + 4, row3Y + 2, rightCol - midCol - 8);
  renderHeaderCell(doc, "Scale:", borehole.scale, rightCol + 4, row3Y + 2, rightEdge - rightCol - 8);
  drawHLine(doc, leftCol, rightEdge, row3Y + HEADER_ROW_HEIGHT);

  // ─── Row 4: Client | Level (mAD) ─────────────────────────────────────
  const row4Y = row3Y + HEADER_ROW_HEIGHT;
  renderHeaderCell(doc, "Client:", project.client_name, leftCol + 4, row4Y + 2, midCol - leftCol - 8);
  renderHeaderCell(doc, "Level (mAD):", `${borehole.ground_level}`, midCol + 4, row4Y + 2, rightCol - midCol - 8);
  renderHeaderCell(doc, "Location Desc:", borehole.location_description || "-", rightCol + 4, row4Y + 2, rightEdge - rightCol - 8);
  drawHLine(doc, leftCol, rightEdge, row4Y + HEADER_ROW_HEIGHT);

  // ─── Row 5: Dates | Logged By ────────────────────────────────────────
  const row5Y = row4Y + HEADER_ROW_HEIGHT;
  const startDate = borehole.start_date || "-";
  const endDate = borehole.end_date || "-";
  renderHeaderCell(doc, "Dates:", `Start: ${startDate}  End: ${endDate}`, leftCol + 4, row5Y + 2, rightCol - leftCol - 8);
  renderHeaderCell(doc, "Logged By:", borehole.logged_by || "-", rightCol + 4, row5Y + 2, rightEdge - rightCol - 8);

  // ─── Vertical grid lines in header ────────────────────────────────────
  drawVLine(doc, midCol, headerTop, headerBottom);
  drawVLine(doc, rightCol, headerTop, headerBottom);
}

function renderHeaderCell(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number
) {
  doc.fontSize(FONT_HEADER_BOLD).font("Helvetica-Bold");
  doc.text(label, x, y, { continued: true, width });
  doc.font("Helvetica").fontSize(FONT_HEADER);
  doc.text(` ${value}`, { width });
}


// ═══════════════════════════════════════════════════════════════════════════════
// COLUMN HEADERS - Labels for each column in the main body table
// ═══════════════════════════════════════════════════════════════════════════════

function renderColumnHeaders(doc: PDFKit.PDFDocument) {
  const headerTop = MARGIN_TOP + HEADER_HEIGHT;
  const headerBottom = headerTop + COL_HEADER_HEIGHT;
  const leftEdge = MARGIN_LEFT;
  const rightEdge = MARGIN_LEFT + CONTENT_WIDTH;

  // Top border of column headers
  drawHLine(doc, leftEdge, rightEdge, headerTop);
  // Bottom border of column headers
  drawHLine(doc, leftEdge, rightEdge, headerBottom);

  doc.fontSize(FONT_COL_HEADER).font("Helvetica-Bold").fillColor("#000000");

  // Depth (left)
  drawColHeaderText(doc, "Depth\n(m)", COLUMNS.depth.x, headerTop, COLUMNS.depth.width);

  // Water Levels
  drawColHeaderText(doc, "Water\nLevels", COLUMNS.water.x, headerTop, COLUMNS.water.width);

  // Samples sub-headers
  drawColHeaderText(doc, "Core Run, Samples & Testing", COLUMNS.samples.x, headerTop, COLUMNS.samples.width);
  // Sub-column labels (lower half)
  const subY = headerTop + 12;
  doc.fontSize(FONT_SMALL);
  drawColHeaderText(doc, "No/\nType", COLUMNS.samples.type.x, subY, COLUMNS.samples.type.width);
  drawColHeaderText(doc, "Depth\n(m)", COLUMNS.samples.depth.x, subY, COLUMNS.samples.depth.width);
  drawColHeaderText(doc, "Rec\n%", COLUMNS.samples.result.x, subY, COLUMNS.samples.result.width);
  drawColHeaderText(doc, "Core\n%", COLUMNS.samples.core.x, subY, COLUMNS.samples.core.width);
  drawColHeaderText(doc, "TCR/SCR\n/RQD%", COLUMNS.samples.tcr.x, subY, COLUMNS.samples.tcr.width);

  doc.fontSize(FONT_COL_HEADER);
  // Install
  drawColHeaderText(doc, "Install", COLUMNS.install.x, headerTop, COLUMNS.install.width);

  // Strata pattern (between depth and description)
  drawColHeaderText(doc, "Strata", COLUMNS.strata.x, headerTop, COLUMNS.strata.width);

  // Description
  drawColHeaderText(doc, "Description", COLUMNS.description.x, headerTop, COLUMNS.description.width);

  // Depth (right)
  drawColHeaderText(doc, "Depth\n(m)", COLUMNS.depthRight.x, headerTop, COLUMNS.depthRight.width);

  // Level
  drawColHeaderText(doc, "Level\n(mAD)", COLUMNS.level.x, headerTop, COLUMNS.level.width);

  // Legend
  drawColHeaderText(doc, "Legend", COLUMNS.legend.x, headerTop, COLUMNS.legend.width);

  // ─── Vertical lines for all columns ───────────────────────────────────
  const colXPositions = [
    COLUMNS.depth.x,
    COLUMNS.water.x,
    COLUMNS.samples.x,
    COLUMNS.install.x,
    COLUMNS.strata.x,
    COLUMNS.description.x,
    COLUMNS.depthRight.x,
    COLUMNS.level.x,
    COLUMNS.legend.x,
    COLUMNS.legend.x + COLUMNS.legend.width,
  ];

  for (const x of colXPositions) {
    drawVLine(doc, x, headerTop, headerBottom);
  }

  // Sub-column vertical lines within samples
  drawVLine(doc, COLUMNS.samples.depth.x, subY, headerBottom);
  drawVLine(doc, COLUMNS.samples.result.x, subY, headerBottom);
  drawVLine(doc, COLUMNS.samples.core.x, subY, headerBottom);
  drawVLine(doc, COLUMNS.samples.tcr.x, subY, headerBottom);
}

function drawColHeaderText(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  width: number
) {
  doc.text(text, x + 1, y + 2, { width: width - 2, align: "center" });
}


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN BODY - Depth scale, strata patterns, descriptions, samples, etc.
// ═══════════════════════════════════════════════════════════════════════════════

function renderBody(doc: PDFKit.PDFDocument, data: BoreholeReportData, layout: LayoutConfig) {
  // Draw body content
  renderDepthColumns(doc, layout);
  renderStrataPatterns(doc, data, layout);
  renderDescriptions(doc, data, layout);
  renderCoreRuns(doc, data, layout);
  renderWaterStrikes(doc, data, layout);
  renderInstallations(doc, data, layout);
  renderLevelColumn(doc, data, layout);
  renderLegendColumn(doc, data, layout);

  // Draw body grid lines (borders) last so they overlay content
  renderBodyGrid(doc, layout);
}

// ─── Depth Columns (left and right) ──────────────────────────────────────────

function renderDepthColumns(doc: PDFKit.PDFDocument, layout: LayoutConfig) {
  doc.fontSize(FONT_DEPTH).font("Helvetica").fillColor("#000000");

  for (const marker of layout.depthMarkers) {
    if (marker.y > BODY_BOTTOM) break;

    // Left depth column - tick and label
    doc
      .moveTo(COLUMNS.depth.x + COLUMNS.depth.width - 4, marker.y)
      .lineTo(COLUMNS.depth.x + COLUMNS.depth.width, marker.y)
      .lineWidth(LINE_TICK)
      .stroke("#000000");

    doc.text(marker.label, COLUMNS.depth.x + 1, marker.y - 3, {
      width: COLUMNS.depth.width - 6,
      align: "right",
    });

    // Right depth column - tick and label
    doc
      .moveTo(COLUMNS.depthRight.x, marker.y)
      .lineTo(COLUMNS.depthRight.x + 4, marker.y)
      .lineWidth(LINE_TICK)
      .stroke("#000000");

    doc.text(marker.label, COLUMNS.depthRight.x + 2, marker.y - 3, {
      width: COLUMNS.depthRight.width - 4,
      align: "left",
    });

    // Horizontal tick line across strata column at each metre
    if (marker.depth > 0) {
      doc
        .moveTo(COLUMNS.strata.x, marker.y)
        .lineTo(COLUMNS.strata.x + COLUMNS.strata.width, marker.y)
        .lineWidth(LINE_TICK)
        .stroke("#999999");
    }
  }
}

// ─── Strata Patterns ─────────────────────────────────────────────────────────

function renderStrataPatterns(doc: PDFKit.PDFDocument, data: BoreholeReportData, layout: LayoutConfig) {
  const { strata } = data;
  if (strata.length === 0) return;

  for (const stratumLayout of layout.strataLayouts) {
    const { yStart, yEnd, patternFile } = stratumLayout;

    // Clip to body bounds
    const clippedYStart = Math.max(yStart, BODY_TOP);
    const clippedYEnd = Math.min(yEnd, BODY_BOTTOM);
    if (clippedYStart >= clippedYEnd) continue;
    const clippedHeight = clippedYEnd - clippedYStart;

    const colX = COLUMNS.strata.x;
    const colWidth = COLUMNS.strata.width;

    if (patternFile) {
      const patternPath = path.join(
        process.cwd(),
        "public",
        patternFile.startsWith("/") ? patternFile.slice(1) : patternFile
      );

      if (fs.existsSync(patternPath)) {
        // Tile the pattern PNG within a clipped rectangle
        doc.save();
        doc.rect(colX, clippedYStart, colWidth, clippedHeight).clip();

        const tileSize = 16; // Scale 64px tile to 16pt for PDF
        for (let ty = clippedYStart; ty < clippedYEnd; ty += tileSize) {
          for (let tx = colX; tx < colX + colWidth; tx += tileSize) {
            doc.image(patternPath, tx, ty, { width: tileSize, height: tileSize });
          }
        }
        doc.restore();
      } else {
        // Fallback: light grey fill
        doc.save();
        doc.rect(colX, clippedYStart, colWidth, clippedHeight).fill("#e8e8e8");
        doc.restore();
      }
    } else {
      doc.save();
      doc.rect(colX, clippedYStart, colWidth, clippedHeight).fill("#e8e8e8");
      doc.restore();
    }

    // Draw stratum boundary line at bottom
    if (clippedYEnd < BODY_BOTTOM) {
      doc
        .moveTo(colX, clippedYEnd)
        .lineTo(colX + colWidth, clippedYEnd)
        .lineWidth(LINE_GRID)
        .stroke("#000000");
    }
  }
}

// ─── Descriptions ────────────────────────────────────────────────────────────

function renderDescriptions(doc: PDFKit.PDFDocument, data: BoreholeReportData, layout: LayoutConfig) {
  if (data.strata.length === 0) return;

  for (const stratumLayout of layout.strataLayouts) {
    const { stratum, yStart, yEnd } = stratumLayout;
    const clippedYStart = Math.max(yStart, BODY_TOP);
    const clippedYEnd = Math.min(yEnd, BODY_BOTTOM);
    if (clippedYStart >= clippedYEnd) continue;

    const colX = COLUMNS.description.x;
    const colWidth = COLUMNS.description.width;
    const availHeight = clippedYEnd - clippedYStart;

    // Lithology name in bold
    doc.fontSize(FONT_BODY).font("Helvetica-Bold").fillColor("#000000");
    doc.text(
      stratum.lithology.toUpperCase().replace("_", " "),
      colX + 3,
      clippedYStart + 2,
      { width: colWidth - 6 }
    );

    // Description text
    if (stratum.description) {
      doc.font("Helvetica").fontSize(FONT_BODY);
      doc.text(stratum.description, colX + 3, clippedYStart + 11, {
        width: colWidth - 6,
        height: Math.max(availHeight - 14, 8),
        ellipsis: true,
      });
    }

    // Draw stratum boundary line across description column
    if (clippedYEnd < BODY_BOTTOM) {
      doc
        .moveTo(colX, clippedYEnd)
        .lineTo(colX + colWidth, clippedYEnd)
        .lineWidth(LINE_TICK)
        .stroke("#666666");
    }
  }
}

// ─── Core Runs / Samples ─────────────────────────────────────────────────────

function renderCoreRuns(doc: PDFKit.PDFDocument, data: BoreholeReportData, layout: LayoutConfig) {
  const { coreRuns } = data;
  if (coreRuns.length === 0) return;

  doc.fillColor("#000000");

  for (const cr of coreRuns) {
    const yStart = layout.bodyTop + cr.depth_from * layout.pointsPerMetre;
    const yEnd = layout.bodyTop + cr.depth_to * layout.pointsPerMetre;
    const clippedYStart = Math.max(yStart, BODY_TOP);
    const clippedYEnd = Math.min(yEnd, BODY_BOTTOM);
    if (clippedYStart >= clippedYEnd) continue;

    const rowY = clippedYStart + 1;

    // No/Type
    doc.fontSize(FONT_SMALL).font("Helvetica-Bold");
    doc.text(cr.sample_type, COLUMNS.samples.type.x + 1, rowY, {
      width: COLUMNS.samples.type.width - 2,
      align: "center",
    });

    // Depth range
    doc.font("Helvetica").fontSize(FONT_SMALL);
    doc.text(
      `${cr.depth_from.toFixed(1)}-\n${cr.depth_to.toFixed(1)}`,
      COLUMNS.samples.depth.x + 1,
      rowY,
      { width: COLUMNS.samples.depth.width - 2, align: "center" }
    );

    // Recovery %
    doc.text(`${cr.recovery_percent}`, COLUMNS.samples.result.x + 1, rowY, {
      width: COLUMNS.samples.result.width - 2,
      align: "center",
    });

    // Core % (same as recovery for display)
    doc.text(`${cr.recovery_percent}`, COLUMNS.samples.core.x + 1, rowY, {
      width: COLUMNS.samples.core.width - 2,
      align: "center",
    });

    // TCR/SCR/RQD
    doc.text(
      `${cr.rqd_tcr_percent}/\n${cr.scr_percent}/\n${cr.rqd_tcr_percent}`,
      COLUMNS.samples.tcr.x + 1,
      rowY,
      { width: COLUMNS.samples.tcr.width - 2, align: "center" }
    );

    // Separator line at bottom of core run
    if (clippedYEnd < BODY_BOTTOM) {
      doc
        .moveTo(COLUMNS.samples.x, clippedYEnd)
        .lineTo(COLUMNS.samples.x + COLUMNS.samples.width, clippedYEnd)
        .lineWidth(LINE_TICK)
        .stroke("#aaaaaa");
    }
  }
}

// ─── Water Strikes ───────────────────────────────────────────────────────────

function renderWaterStrikes(doc: PDFKit.PDFDocument, data: BoreholeReportData, layout: LayoutConfig) {
  const { waterStrikes } = data;
  if (waterStrikes.length === 0) return;

  for (const ws of waterStrikes) {
    const y = layout.bodyTop + ws.strike_depth * layout.pointsPerMetre;
    const clippedY = Math.max(y, BODY_TOP);
    if (clippedY >= BODY_BOTTOM) continue;

    const colX = COLUMNS.water.x;
    const colWidth = COLUMNS.water.width;
    const cx = colX + colWidth / 2;

    // Draw inverted triangle (water strike symbol)
    doc.save();
    doc
      .moveTo(cx - 4, clippedY)
      .lineTo(cx + 4, clippedY)
      .lineTo(cx, clippedY + 7)
      .closePath()
      .fill("#1565C0");
    doc.restore();

    // Depth label below
    doc.fillColor("#000000").fontSize(FONT_SMALL).font("Helvetica");
    doc.text(`${ws.strike_depth.toFixed(1)}`, colX + 1, clippedY + 8, {
      width: colWidth - 2,
      align: "center",
    });
  }
}

// ─── Installations ───────────────────────────────────────────────────────────

function renderInstallations(doc: PDFKit.PDFDocument, data: BoreholeReportData, layout: LayoutConfig) {
  const { installations } = data;
  if (installations.length === 0) return;

  const typeSymbols: Record<string, string> = {
    plain_casing: "PC",
    slotted_casing: "SC",
    screen: "Scr",
    gravel_pack: "GP",
    bentonite_seal: "BS",
    cement_grout: "CG",
  };

  for (const inst of installations) {
    const yStart = layout.bodyTop + inst.depth_from * layout.pointsPerMetre;
    const yEnd = layout.bodyTop + inst.depth_to * layout.pointsPerMetre;
    const clippedYStart = Math.max(yStart, BODY_TOP);
    const clippedYEnd = Math.min(yEnd, BODY_BOTTOM);
    if (clippedYStart >= clippedYEnd) continue;

    const colX = COLUMNS.install.x;
    const colWidth = COLUMNS.install.width;
    const instHeight = clippedYEnd - clippedYStart;

    // Draw casing rectangle
    doc.save();
    doc
      .rect(colX + 3, clippedYStart, colWidth - 6, instHeight)
      .lineWidth(0.5)
      .stroke("#333333");
    doc.restore();

    // Label
    const label = typeSymbols[inst.installation_type] || inst.installation_type.slice(0, 2).toUpperCase();
    doc.fillColor("#000000").fontSize(FONT_SMALL).font("Helvetica");
    doc.text(label, colX + 1, clippedYStart + instHeight / 2 - 3, {
      width: colWidth - 2,
      align: "center",
    });
  }
}

// ─── Level Column (mAD) ─────────────────────────────────────────────────────

function renderLevelColumn(doc: PDFKit.PDFDocument, data: BoreholeReportData, layout: LayoutConfig) {
  const groundLevel = data.borehole.ground_level;
  doc.fontSize(FONT_DEPTH).font("Helvetica").fillColor("#000000");

  for (const marker of layout.depthMarkers) {
    if (marker.y > BODY_BOTTOM) break;
    const level = (groundLevel - marker.depth).toFixed(1);
    doc.text(level, COLUMNS.level.x + 1, marker.y - 3, {
      width: COLUMNS.level.width - 2,
      align: "center",
    });
  }
}

// ─── Legend Column ───────────────────────────────────────────────────────────

function renderLegendColumn(doc: PDFKit.PDFDocument, data: BoreholeReportData, layout: LayoutConfig) {
  if (data.strata.length === 0) return;

  for (const stratumLayout of layout.strataLayouts) {
    const { stratum, yStart, yEnd, patternFile } = stratumLayout;
    const clippedYStart = Math.max(yStart, BODY_TOP);
    const clippedYEnd = Math.min(yEnd, BODY_BOTTOM);
    if (clippedYStart >= clippedYEnd) continue;

    const colX = COLUMNS.legend.x;
    const colWidth = COLUMNS.legend.width;
    const midY = (clippedYStart + clippedYEnd) / 2;

    // Small pattern swatch
    if (patternFile) {
      const patternPath = path.join(
        process.cwd(),
        "public",
        patternFile.startsWith("/") ? patternFile.slice(1) : patternFile
      );
      if (fs.existsSync(patternPath)) {
        const swatchSize = 10;
        const sx = colX + (colWidth - swatchSize) / 2;
        const sy = midY - swatchSize / 2;
        doc.save();
        doc.rect(sx, sy, swatchSize, swatchSize).clip();
        doc.image(patternPath, sx, sy, { width: swatchSize, height: swatchSize });
        doc.restore();
        doc.rect(sx, sy, swatchSize, swatchSize).lineWidth(0.2).stroke("#000000");
      }
    }
  }
}


// ─── Body Grid Lines ─────────────────────────────────────────────────────────

function renderBodyGrid(doc: PDFKit.PDFDocument, layout: LayoutConfig) {
  doc.lineWidth(LINE_GRID).strokeColor("#000000");

  // Vertical column borders through the entire body
  const colBorders = [
    COLUMNS.depth.x,
    COLUMNS.water.x,
    COLUMNS.samples.x,
    COLUMNS.samples.depth.x,
    COLUMNS.samples.result.x,
    COLUMNS.samples.core.x,
    COLUMNS.samples.tcr.x,
    COLUMNS.install.x,
    COLUMNS.strata.x,
    COLUMNS.description.x,
    COLUMNS.depthRight.x,
    COLUMNS.level.x,
    COLUMNS.legend.x,
    COLUMNS.legend.x + COLUMNS.legend.width,
  ];

  for (const x of colBorders) {
    doc.moveTo(x, BODY_TOP).lineTo(x, BODY_BOTTOM).stroke();
  }

  // Top and bottom borders of body
  drawHLine(doc, MARGIN_LEFT, MARGIN_LEFT + CONTENT_WIDTH, BODY_TOP);
  drawHLine(doc, MARGIN_LEFT, MARGIN_LEFT + CONTENT_WIDTH, BODY_BOTTOM);

  void layout;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOOTER SECTION - Remarks, Groundwater table, Hole Progress table
// ═══════════════════════════════════════════════════════════════════════════════

function renderFooter(doc: PDFKit.PDFDocument, data: BoreholeReportData, layout: LayoutConfig) {
  renderRemarksBox(doc, data);
  renderGroundwaterTable(doc, data);
  renderHoleProgressTable(doc, data);
  void layout;
}

// ─── Remarks Box ─────────────────────────────────────────────────────────────

function renderRemarksBox(doc: PDFKit.PDFDocument, data: BoreholeReportData) {
  const { borehole } = data;
  const boxTop = BODY_BOTTOM;
  const boxHeight = REMARKS_HEIGHT;
  const leftEdge = MARGIN_LEFT;
  const rightEdge = MARGIN_LEFT + CONTENT_WIDTH;

  // Border
  doc
    .rect(leftEdge, boxTop, CONTENT_WIDTH, boxHeight)
    .lineWidth(LINE_GRID)
    .stroke("#000000");

  // Title
  doc.fontSize(FONT_HEADER_BOLD).font("Helvetica-Bold").fillColor("#000000");
  doc.text("REMARKS", leftEdge + 4, boxTop + 2);

  // Content
  doc.font("Helvetica").fontSize(FONT_SMALL);
  const remarks = [
    `Equipment: Rotary drilling rig`,
    `Method: ${borehole.hole_type}`,
    `Casing: As shown in Install column`,
    `Groundwater: See observations below`,
    borehole.location_description ? `Notes: ${borehole.location_description}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  doc.text(remarks, leftEdge + 4, boxTop + 12, {
    width: CONTENT_WIDTH - 8,
    height: boxHeight - 14,
  });
}

// ─── Groundwater Table ───────────────────────────────────────────────────────

function renderGroundwaterTable(doc: PDFKit.PDFDocument, data: BoreholeReportData) {
  const { waterStrikes } = data;
  const tableTop = BODY_BOTTOM + REMARKS_HEIGHT;
  const tableHeight = GROUNDWATER_TABLE_HEIGHT;
  const leftEdge = MARGIN_LEFT;
  const halfWidth = CONTENT_WIDTH / 2;

  // Border
  doc
    .rect(leftEdge, tableTop, halfWidth, tableHeight)
    .lineWidth(LINE_GRID)
    .stroke("#000000");

  // Title
  doc.fontSize(FONT_HEADER_BOLD).font("Helvetica-Bold").fillColor("#000000");
  doc.text("GROUNDWATER", leftEdge + 4, tableTop + 2);

  // Column headers
  const headerY = tableTop + 12;
  const colWidths = [55, 55, 55, 65];
  const headers = ["Date", "Strike (m)", "Casing (m)", "After Obs. (m)"];
  doc.fontSize(FONT_SMALL).font("Helvetica-Bold");

  let xPos = leftEdge + 4;
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], xPos, headerY, { width: colWidths[i] });
    xPos += colWidths[i];
  }

  // Data rows
  doc.font("Helvetica").fontSize(FONT_SMALL);
  let rowY = headerY + 9;
  for (const ws of waterStrikes.slice(0, 4)) {
    xPos = leftEdge + 4;
    doc.text(ws.date, xPos, rowY, { width: colWidths[0] });
    xPos += colWidths[0];
    doc.text(ws.strike_depth.toFixed(1), xPos, rowY, { width: colWidths[1] });
    xPos += colWidths[1];
    doc.text(ws.casing_depth.toFixed(1), xPos, rowY, { width: colWidths[2] });
    xPos += colWidths[2];
    doc.text(ws.depth_after_period.toFixed(1), xPos, rowY, { width: colWidths[3] });
    rowY += 8;
  }
}

// ─── Hole Progress Table ─────────────────────────────────────────────────────

function renderHoleProgressTable(doc: PDFKit.PDFDocument, data: BoreholeReportData) {
  const { holeProgress } = data;
  const tableTop = BODY_BOTTOM + REMARKS_HEIGHT;
  const tableHeight = GROUNDWATER_TABLE_HEIGHT;
  const leftEdge = MARGIN_LEFT + CONTENT_WIDTH / 2;
  const halfWidth = CONTENT_WIDTH / 2;

  // Border
  doc
    .rect(leftEdge, tableTop, halfWidth, tableHeight)
    .lineWidth(LINE_GRID)
    .stroke("#000000");

  // Title
  doc.fontSize(FONT_HEADER_BOLD).font("Helvetica-Bold").fillColor("#000000");
  doc.text("HOLE PROGRESS", leftEdge + 4, tableTop + 2);

  // Column headers
  const headerY = tableTop + 12;
  const colWidths = [55, 50, 50, 55];
  const headers = ["Date", "Depth (m)", "Casing (m)", "Water (m)"];
  doc.fontSize(FONT_SMALL).font("Helvetica-Bold");

  let xPos = leftEdge + 4;
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], xPos, headerY, { width: colWidths[i] });
    xPos += colWidths[i];
  }

  // Data rows
  doc.font("Helvetica").fontSize(FONT_SMALL);
  let rowY = headerY + 9;
  for (const hp of holeProgress.slice(0, 4)) {
    xPos = leftEdge + 4;
    doc.text(hp.date, xPos, rowY, { width: colWidths[0] });
    xPos += colWidths[0];
    doc.text(hp.hole_depth.toFixed(1), xPos, rowY, { width: colWidths[1] });
    xPos += colWidths[1];
    doc.text(hp.casing_depth.toFixed(1), xPos, rowY, { width: colWidths[2] });
    xPos += colWidths[2];
    const waterText = hp.water_depth !== null ? hp.water_depth.toFixed(1) : hp.water_status;
    doc.text(waterText, xPos, rowY, { width: colWidths[3] });
    rowY += 8;
  }

}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function drawHLine(doc: PDFKit.PDFDocument, x1: number, x2: number, y: number) {
  doc.moveTo(x1, y).lineTo(x2, y).lineWidth(LINE_GRID).stroke("#000000");
}

function drawVLine(doc: PDFKit.PDFDocument, x: number, y1: number, y2: number) {
  doc.moveTo(x, y1).lineTo(x, y2).lineWidth(LINE_GRID).stroke("#000000");
}
