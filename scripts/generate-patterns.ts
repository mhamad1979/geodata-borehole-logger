/**
 * Script to generate BS 5930 hatch pattern PNG tiles for lithology types.
 * Each pattern is a 64x64px tile that when repeated creates a recognizable geological pattern.
 *
 * Usage: npx tsx scripts/generate-patterns.ts
 */

import sharp from "sharp";
import path from "path";
import fs from "fs";

const SIZE = 64;
const OUTPUT_DIR = path.resolve(__dirname, "../public/patterns");

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Create an SVG string and convert to PNG via sharp
 */
async function svgToPng(svgContent: string, filename: string): Promise<void> {
  const svg = Buffer.from(svgContent);
  await sharp(svg).resize(SIZE, SIZE).png().toFile(path.join(OUTPUT_DIR, filename));
  console.log(`  ✓ ${filename}`);
}

/**
 * Sand: Stippled dots (random dot pattern) on light yellow background
 */
function generateSandSvg(): string {
  // Pseudo-random dots using a fixed seed pattern
  const dots: string[] = [];
  const positions = [
    [8, 12], [24, 8], [48, 14], [56, 6],
    [4, 28], [16, 32], [36, 26], [52, 30],
    [12, 44], [28, 48], [44, 42], [60, 46],
    [6, 58], [20, 56], [40, 60], [54, 54],
    [14, 20], [32, 16], [46, 22], [58, 18],
    [10, 36], [30, 38], [50, 34], [62, 40],
    [18, 52], [38, 50], [56, 56], [2, 48],
  ];
  for (const [x, y] of positions) {
    dots.push(`<circle cx="${x}" cy="${y}" r="1.2" fill="#8B7355"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
    <rect width="${SIZE}" height="${SIZE}" fill="#F5DEB3"/>
    ${dots.join("\n    ")}
  </svg>`;
}

/**
 * Clay: Horizontal dashes on brown-tinted background
 */
function generateClaySvg(): string {
  const dashes: string[] = [];
  for (let y = 8; y < SIZE; y += 10) {
    for (let x = 0; x < SIZE; x += 16) {
      const offset = (y % 20 === 8) ? 0 : 8;
      dashes.push(`<line x1="${x + offset}" y1="${y}" x2="${x + offset + 10}" y2="${y}" stroke="#4A2800" stroke-width="1.5" stroke-linecap="round"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
    <rect width="${SIZE}" height="${SIZE}" fill="#D2A679"/>
    ${dashes.join("\n    ")}
  </svg>`;
}

/**
 * Silt: Fine vertical lines on light gray background
 */
function generateSiltSvg(): string {
  const lines: string[] = [];
  for (let x = 4; x < SIZE; x += 6) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${SIZE}" stroke="#666666" stroke-width="0.8"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
    <rect width="${SIZE}" height="${SIZE}" fill="#E0E0E0"/>
    ${lines.join("\n    ")}
  </svg>`;
}

/**
 * Gravel: Circles on orange-tinted background
 */
function generateGravelSvg(): string {
  const circles: string[] = [];
  const positions = [
    [16, 16, 7], [48, 16, 6], [32, 32, 8],
    [12, 48, 6], [48, 50, 7], [32, 8, 5],
    [8, 32, 5], [56, 34, 5],
  ];
  for (const [cx, cy, r] of positions) {
    circles.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#5C3300" stroke-width="1.5"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
    <rect width="${SIZE}" height="${SIZE}" fill="#EDCBA0"/>
    ${circles.join("\n    ")}
  </svg>`;
}

/**
 * Sandstone: Brick/block pattern on tan background
 */
function generateSandstoneSvg(): string {
  const lines: string[] = [];
  // Horizontal lines
  for (let y = 0; y <= SIZE; y += 16) {
    lines.push(`<line x1="0" y1="${y}" x2="${SIZE}" y2="${y}" stroke="#8B6914" stroke-width="1"/>`);
  }
  // Vertical lines (offset every other row)
  for (let row = 0; row < 4; row++) {
    const yStart = row * 16;
    const yEnd = yStart + 16;
    const offset = row % 2 === 0 ? 0 : 16;
    for (let x = offset; x <= SIZE; x += 32) {
      lines.push(`<line x1="${x}" y1="${yStart}" x2="${x}" y2="${yEnd}" stroke="#8B6914" stroke-width="1"/>`);
    }
  }
  // Add some dots for sandstone texture
  const dots: string[] = [];
  const dotPositions = [
    [8, 8], [24, 8], [40, 24], [56, 24], [8, 40], [24, 40], [40, 56], [56, 56],
  ];
  for (const [x, y] of dotPositions) {
    dots.push(`<circle cx="${x}" cy="${y}" r="1" fill="#8B6914"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
    <rect width="${SIZE}" height="${SIZE}" fill="#DEB887"/>
    ${lines.join("\n    ")}
    ${dots.join("\n    ")}
  </svg>`;
}

/**
 * Mudstone: Wavy horizontal lines on dark gray background
 */
function generateMudstoneSvg(): string {
  const paths: string[] = [];
  for (let y = 8; y < SIZE; y += 12) {
    paths.push(`<path d="M 0 ${y} Q 16 ${y - 4} 32 ${y} Q 48 ${y + 4} 64 ${y}" fill="none" stroke="#333333" stroke-width="1.2"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
    <rect width="${SIZE}" height="${SIZE}" fill="#A0A0A0"/>
    ${paths.join("\n    ")}
  </svg>`;
}

/**
 * Limestone: Rectangular block pattern on light blue background
 */
function generateLimestoneSvg(): string {
  const rects: string[] = [];
  // Draw rectangular blocks with gaps
  for (let row = 0; row < 4; row++) {
    const y = row * 16 + 2;
    const offset = row % 2 === 0 ? 0 : 16;
    for (let col = 0; col < 3; col++) {
      const x = col * 32 + offset - 16;
      rects.push(`<rect x="${x + 2}" y="${y}" width="28" height="12" fill="none" stroke="#4A6B8A" stroke-width="1.2" rx="1"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
    <rect width="${SIZE}" height="${SIZE}" fill="#C8D8E8"/>
    ${rects.join("\n    ")}
  </svg>`;
}

/**
 * Chalk: Cross-hatch pattern on white background
 */
function generateChalkSvg(): string {
  const lines: string[] = [];
  // Diagonal lines (top-left to bottom-right)
  for (let i = -SIZE; i < SIZE * 2; i += 10) {
    lines.push(`<line x1="${i}" y1="0" x2="${i + SIZE}" y2="${SIZE}" stroke="#AAAAAA" stroke-width="0.7"/>`);
  }
  // Diagonal lines (top-right to bottom-left)
  for (let i = -SIZE; i < SIZE * 2; i += 10) {
    lines.push(`<line x1="${i + SIZE}" y1="0" x2="${i}" y2="${SIZE}" stroke="#AAAAAA" stroke-width="0.7"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
    <rect width="${SIZE}" height="${SIZE}" fill="#FAFAFA"/>
    ${lines.join("\n    ")}
  </svg>`;
}

/**
 * Made Ground: Irregular random symbols on dark brown background
 */
function generateMadeGroundSvg(): string {
  const symbols: string[] = [];
  // Mix of crosses, triangles, and irregular shapes
  const elements = [
    // Crosses
    `<path d="M 8 8 L 14 14 M 14 8 L 8 14" stroke="#FFD700" stroke-width="1.5"/>`,
    `<path d="M 40 12 L 46 18 M 46 12 L 40 18" stroke="#FFD700" stroke-width="1.5"/>`,
    `<path d="M 24 44 L 30 50 M 30 44 L 24 50" stroke="#FFD700" stroke-width="1.5"/>`,
    // Triangles
    `<polygon points="24,20 28,28 20,28" fill="none" stroke="#CCCCCC" stroke-width="1.2"/>`,
    `<polygon points="52,40 56,48 48,48" fill="none" stroke="#CCCCCC" stroke-width="1.2"/>`,
    // Small rectangles (brick fragments)
    `<rect x="4" y="32" width="8" height="5" fill="none" stroke="#AA6633" stroke-width="1"/>`,
    `<rect x="44" y="24" width="6" height="8" fill="none" stroke="#AA6633" stroke-width="1"/>`,
    // Dots
    `<circle cx="56" cy="8" r="2" fill="#888888"/>`,
    `<circle cx="16" cy="56" r="2" fill="#888888"/>`,
    `<circle cx="48" cy="56" r="1.5" fill="#888888"/>`,
  ];
  symbols.push(...elements);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
    <rect width="${SIZE}" height="${SIZE}" fill="#5D4037"/>
    ${symbols.join("\n    ")}
  </svg>`;
}

async function main() {
  console.log("Generating BS 5930 hatch pattern PNG tiles (64x64px)...\n");

  await svgToPng(generateSandSvg(), "sand.png");
  await svgToPng(generateClaySvg(), "clay.png");
  await svgToPng(generateSiltSvg(), "silt.png");
  await svgToPng(generateGravelSvg(), "gravel.png");
  await svgToPng(generateSandstoneSvg(), "sandstone.png");
  await svgToPng(generateMudstoneSvg(), "mudstone.png");
  await svgToPng(generateLimestoneSvg(), "limestone.png");
  await svgToPng(generateChalkSvg(), "chalk.png");
  await svgToPng(generateMadeGroundSvg(), "made_ground.png");

  console.log(`\nDone! All patterns saved to ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error("Error generating patterns:", err);
  process.exit(1);
});
