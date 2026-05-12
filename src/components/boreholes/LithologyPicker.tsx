"use client";

import { cn } from "@/lib/utils";
import type { LithologyType } from "@/types/database";

export interface LithologyOption {
  type: LithologyType;
  label: string;
  color: string;
}

export const LITHOLOGY_OPTIONS: LithologyOption[] = [
  { type: "sand", label: "Sand", color: "#F5DEB3" },
  { type: "clay", label: "Clay", color: "#8B4513" },
  { type: "silt", label: "Silt", color: "#C0C0C0" },
  { type: "gravel", label: "Gravel", color: "#D2691E" },
  { type: "sandstone", label: "Sandstone", color: "#DEB887" },
  { type: "mudstone", label: "Mudstone", color: "#696969" },
  { type: "limestone", label: "Limestone", color: "#B0C4DE" },
  { type: "chalk", label: "Chalk", color: "#FFFFFF" },
  { type: "made_ground", label: "Made Ground", color: "#3E2723" },
];

interface LithologyPickerProps {
  value: LithologyType | "";
  onChange: (value: LithologyType) => void;
  error?: string;
}

export function LithologyPicker({ value, onChange, error }: LithologyPickerProps) {
  return (
    <div className="space-y-2">
      <div
        className="grid grid-cols-3 gap-2"
        role="radiogroup"
        aria-label="Select lithology type"
      >
        {LITHOLOGY_OPTIONS.map((option) => {
          const isSelected = value === option.type;
          return (
            <button
              key={option.type}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(option.type)}
              className={cn(
                "flex items-center gap-2 rounded-md border p-2 text-left text-sm transition-colors hover:bg-accent",
                isSelected
                  ? "border-primary ring-2 ring-primary/30 bg-accent"
                  : "border-input"
              )}
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 shrink-0 rounded-sm",
                  option.type === "chalk" && "border border-input"
                )}
                style={{ backgroundColor: option.color }}
                aria-hidden="true"
              />
              <span className="truncate">{option.label}</span>
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
