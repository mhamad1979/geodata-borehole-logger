"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CoreRun } from "@/types/database";

const SAMPLE_TYPE_OPTIONS = [
  { value: "U100", label: "U100" },
  { value: "SPT", label: "SPT" },
  { value: "Bulk", label: "Bulk" },
  { value: "Core", label: "Core" },
  { value: "Environmental", label: "Environmental" },
];

interface CoreRunFormProps {
  boreholeId: string;
  coreRun?: CoreRun | null;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onCancel: () => void;
}

interface FormErrors {
  sample_type?: string;
  depth_from?: string;
  depth_to?: string;
  recovery_percent?: string;
  scr_percent?: string;
  rqd_tcr_percent?: string;
  general?: string;
}

export function CoreRunForm({
  boreholeId,
  coreRun,
  onSuccess,
  onError,
  onCancel,
}: CoreRunFormProps) {
  const isEditing = !!coreRun;

  const [sampleType, setSampleType] = useState(coreRun?.sample_type ?? "");
  const [depthFrom, setDepthFrom] = useState(
    coreRun?.depth_from !== undefined ? String(coreRun.depth_from) : ""
  );
  const [depthTo, setDepthTo] = useState(
    coreRun?.depth_to !== undefined ? String(coreRun.depth_to) : ""
  );
  const [recoveryPercent, setRecoveryPercent] = useState(
    coreRun?.recovery_percent !== undefined
      ? String(coreRun.recovery_percent)
      : ""
  );
  const [scrPercent, setScrPercent] = useState(
    coreRun?.scr_percent !== undefined ? String(coreRun.scr_percent) : ""
  );
  const [rqdTcrPercent, setRqdTcrPercent] = useState(
    coreRun?.rqd_tcr_percent !== undefined
      ? String(coreRun.rqd_tcr_percent)
      : ""
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (coreRun) {
      setSampleType(coreRun.sample_type);
      setDepthFrom(String(coreRun.depth_from));
      setDepthTo(String(coreRun.depth_to));
      setRecoveryPercent(String(coreRun.recovery_percent));
      setScrPercent(String(coreRun.scr_percent));
      setRqdTcrPercent(String(coreRun.rqd_tcr_percent));
    }
  }, [coreRun]);

  const validatePercentage = (
    value: string,
    fieldName: string
  ): string | undefined => {
    if (value === "") {
      return `${fieldName} is required`;
    }
    const num = parseFloat(value);
    if (isNaN(num)) {
      return `${fieldName} must be a number`;
    }
    if (num < 0 || num > 100) {
      return `${fieldName} must be between 0 and 100`;
    }
    return undefined;
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!sampleType.trim()) {
      newErrors.sample_type = "Sample type is required";
    }

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

    const recoveryErr = validatePercentage(recoveryPercent, "Recovery %");
    if (recoveryErr) newErrors.recovery_percent = recoveryErr;

    const scrErr = validatePercentage(scrPercent, "SCR %");
    if (scrErr) newErrors.scr_percent = scrErr;

    const rqdErr = validatePercentage(rqdTcrPercent, "RQD/TCR %");
    if (rqdErr) newErrors.rqd_tcr_percent = rqdErr;

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
        sample_type: sampleType.trim(),
        depth_from: parseFloat(depthFrom),
        depth_to: parseFloat(depthTo),
        recovery_percent: parseFloat(recoveryPercent),
        scr_percent: parseFloat(scrPercent),
        rqd_tcr_percent: parseFloat(rqdTcrPercent),
      };

      const url = isEditing
        ? `/api/core-runs/${coreRun.id}`
        : `/api/boreholes/${boreholeId}/core-runs`;
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
          onError("Failed to save core run");
        }
        setSubmitting(false);
        return;
      }

      onSuccess(
        isEditing
          ? "Core run updated successfully"
          : "Core run added successfully"
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

      {/* Sample Type */}
      <div className="space-y-2">
        <Label htmlFor="sample-type">Sample Type</Label>
        <Select value={sampleType} onValueChange={(val) => { if (val) setSampleType(val); }}>
          <SelectTrigger
            className="w-full"
            aria-invalid={!!errors.sample_type}
            aria-describedby={
              errors.sample_type ? "sample-type-error" : undefined
            }
          >
            <SelectValue placeholder="Select sample type" />
          </SelectTrigger>
          <SelectContent>
            {SAMPLE_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.sample_type && (
          <p id="sample-type-error" className="text-sm text-destructive">
            {errors.sample_type}
          </p>
        )}
      </div>

      {/* Depth Fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="core-depth-from">Depth From (m)</Label>
          <Input
            id="core-depth-from"
            type="number"
            step="0.01"
            min="0"
            value={depthFrom}
            onChange={(e) => setDepthFrom(e.target.value)}
            placeholder="e.g. 0.00"
            aria-invalid={!!errors.depth_from}
            aria-describedby={
              errors.depth_from ? "core-depth-from-error" : undefined
            }
          />
          {errors.depth_from && (
            <p id="core-depth-from-error" className="text-sm text-destructive">
              {errors.depth_from}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="core-depth-to">Depth To (m)</Label>
          <Input
            id="core-depth-to"
            type="number"
            step="0.01"
            min="0"
            value={depthTo}
            onChange={(e) => setDepthTo(e.target.value)}
            placeholder="e.g. 1.50"
            aria-invalid={!!errors.depth_to}
            aria-describedby={
              errors.depth_to ? "core-depth-to-error" : undefined
            }
          />
          {errors.depth_to && (
            <p id="core-depth-to-error" className="text-sm text-destructive">
              {errors.depth_to}
            </p>
          )}
        </div>
      </div>

      {/* Percentage Fields */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="recovery-percent">Recovery %</Label>
          <Input
            id="recovery-percent"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={recoveryPercent}
            onChange={(e) => setRecoveryPercent(e.target.value)}
            placeholder="0–100"
            aria-invalid={!!errors.recovery_percent}
            aria-describedby={
              errors.recovery_percent ? "recovery-percent-error" : undefined
            }
          />
          {errors.recovery_percent && (
            <p
              id="recovery-percent-error"
              className="text-sm text-destructive"
            >
              {errors.recovery_percent}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="scr-percent">SCR %</Label>
          <Input
            id="scr-percent"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={scrPercent}
            onChange={(e) => setScrPercent(e.target.value)}
            placeholder="0–100"
            aria-invalid={!!errors.scr_percent}
            aria-describedby={
              errors.scr_percent ? "scr-percent-error" : undefined
            }
          />
          {errors.scr_percent && (
            <p id="scr-percent-error" className="text-sm text-destructive">
              {errors.scr_percent}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="rqd-tcr-percent">RQD/TCR %</Label>
          <Input
            id="rqd-tcr-percent"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={rqdTcrPercent}
            onChange={(e) => setRqdTcrPercent(e.target.value)}
            placeholder="0–100"
            aria-invalid={!!errors.rqd_tcr_percent}
            aria-describedby={
              errors.rqd_tcr_percent ? "rqd-tcr-percent-error" : undefined
            }
          />
          {errors.rqd_tcr_percent && (
            <p
              id="rqd-tcr-percent-error"
              className="text-sm text-destructive"
            >
              {errors.rqd_tcr_percent}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={submitting}>
          {submitting
            ? "Saving..."
            : isEditing
              ? "Update Core Run"
              : "Add Core Run"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
