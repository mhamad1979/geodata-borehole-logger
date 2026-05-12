"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LithologyPicker } from "@/components/boreholes/LithologyPicker";
import type { LithologyType, Stratum } from "@/types/database";

interface StratumFormProps {
  boreholeId: string;
  stratum?: Stratum | null;
  onSuccess: (message: string, warning?: string) => void;
  onError: (message: string) => void;
  onCancel: () => void;
}

interface FormErrors {
  depth_from?: string;
  depth_to?: string;
  lithology?: string;
  general?: string;
}

export function StratumForm({
  boreholeId,
  stratum,
  onSuccess,
  onError,
  onCancel,
}: StratumFormProps) {
  const isEditing = !!stratum;

  const [depthFrom, setDepthFrom] = useState(
    stratum?.depth_from !== undefined ? String(stratum.depth_from) : ""
  );
  const [depthTo, setDepthTo] = useState(
    stratum?.depth_to !== undefined ? String(stratum.depth_to) : ""
  );
  const [lithology, setLithology] = useState<LithologyType | "">(
    stratum?.lithology ?? ""
  );
  const [description, setDescription] = useState(stratum?.description ?? "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (stratum) {
      setDepthFrom(String(stratum.depth_from));
      setDepthTo(String(stratum.depth_to));
      setLithology(stratum.lithology);
      setDescription(stratum.description);
    }
  }, [stratum]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    const from = parseFloat(depthFrom);
    const to = parseFloat(depthTo);

    if (depthFrom === "" || isNaN(from)) {
      newErrors.depth_from = "Depth from is required and must be a number";
    }

    if (depthTo === "" || isNaN(to)) {
      newErrors.depth_to = "Depth to is required and must be a number";
    }

    if (!isNaN(from) && !isNaN(to) && from >= to) {
      newErrors.depth_from = "Depth from must be less than depth to";
    }

    if (!lithology) {
      newErrors.lithology = "Lithology is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const payload = {
        depth_from: parseFloat(depthFrom),
        depth_to: parseFloat(depthTo),
        lithology,
        description: description.trim(),
      };

      const url = isEditing
        ? `/api/strata/${stratum.id}`
        : `/api/boreholes/${boreholeId}/strata`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.error) {
          setErrors({ general: json.error });
        } else {
          onError("Failed to save stratum");
        }
        setSubmitting(false);
        return;
      }

      const warning = json.warning as string | undefined;
      onSuccess(
        isEditing ? "Stratum updated successfully" : "Stratum added successfully",
        warning
      );
    } catch {
      onError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <p className="text-sm text-destructive rounded-md bg-destructive/10 p-2">
          {errors.general}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Depth From */}
        <div className="space-y-2">
          <Label htmlFor="depth-from">Depth From (m)</Label>
          <Input
            id="depth-from"
            type="number"
            step="0.01"
            min="0"
            value={depthFrom}
            onChange={(e) => setDepthFrom(e.target.value)}
            placeholder="e.g. 0.00"
            aria-invalid={!!errors.depth_from}
            aria-describedby={errors.depth_from ? "depth-from-error" : undefined}
          />
          {errors.depth_from && (
            <p id="depth-from-error" className="text-sm text-destructive">
              {errors.depth_from}
            </p>
          )}
        </div>

        {/* Depth To */}
        <div className="space-y-2">
          <Label htmlFor="depth-to">Depth To (m)</Label>
          <Input
            id="depth-to"
            type="number"
            step="0.01"
            min="0"
            value={depthTo}
            onChange={(e) => setDepthTo(e.target.value)}
            placeholder="e.g. 2.50"
            aria-invalid={!!errors.depth_to}
            aria-describedby={errors.depth_to ? "depth-to-error" : undefined}
          />
          {errors.depth_to && (
            <p id="depth-to-error" className="text-sm text-destructive">
              {errors.depth_to}
            </p>
          )}
        </div>
      </div>

      {/* Lithology Picker */}
      <div className="space-y-2">
        <Label>Lithology</Label>
        <LithologyPicker
          value={lithology}
          onChange={setLithology}
          error={errors.lithology}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="stratum-description">Description</Label>
        <textarea
          id="stratum-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Firm brown sandy CLAY with occasional gravel"
          rows={3}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={submitting}>
          {submitting
            ? "Saving..."
            : isEditing
              ? "Update Stratum"
              : "Add Stratum"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
