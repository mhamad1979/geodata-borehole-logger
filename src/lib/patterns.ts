import type { LithologyType } from "@/types/database";

export interface LithologyPattern {
  type: LithologyType;
  label: string;
  patternFile: string;
  description: string;
}

export const LITHOLOGY_PATTERNS: LithologyPattern[] = [
  { type: "sand", label: "Sand", patternFile: "/patterns/sand.png", description: "Stippled dots" },
  { type: "clay", label: "Clay", patternFile: "/patterns/clay.png", description: "Horizontal dashes" },
  { type: "silt", label: "Silt", patternFile: "/patterns/silt.png", description: "Fine vertical lines" },
  { type: "gravel", label: "Gravel", patternFile: "/patterns/gravel.png", description: "Circles" },
  { type: "sandstone", label: "Sandstone", patternFile: "/patterns/sandstone.png", description: "Brick pattern" },
  { type: "mudstone", label: "Mudstone", patternFile: "/patterns/mudstone.png", description: "Wavy lines" },
  { type: "limestone", label: "Limestone", patternFile: "/patterns/limestone.png", description: "Block pattern" },
  { type: "chalk", label: "Chalk", patternFile: "/patterns/chalk.png", description: "Cross-hatch" },
  { type: "made_ground", label: "Made Ground", patternFile: "/patterns/made_ground.png", description: "Irregular fill" },
];

export function getPatternForLithology(lithology: LithologyType): LithologyPattern | undefined {
  return LITHOLOGY_PATTERNS.find((p) => p.type === lithology);
}
