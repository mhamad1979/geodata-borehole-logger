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
import type { Borehole } from "@/types/database";

const SCALE_OPTIONS = ["1:50", "1:100", "1:200"];
const HOLE_TYPE_OPTIONS = [
  "Rotary",
  "Cable Percussion",
  "Window Sample",
  "Dynamic Probe",
];

interface BoreholeFormProps {
  projectId: string;
  borehole?: Borehole | null;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  /** If true, renders inside a dialog (create mode) */
  mode?: "create" | "edit";
  onCancel?: () => void;
}

interface FormErrors {
  borehole_id?: string;
  easting?: string;
  northing?: string;
  ground_level?: string;
  location_description?: string;
  scale?: string;
  hole_type?: string;
  start_date?: string;
  end_date?: string;
  logged_by?: string;
}

export function BoreholeForm({
  projectId,
  borehole,
  onSuccess,
  onError,
  mode = "edit",
  onCancel,
}: BoreholeFormProps) {
  const isEditing = !!borehole;

  const [boreholeId, setBoreholeId] = useState(borehole?.borehole_id ?? "");
  const [locationDescription, setLocationDescription] = useState(
    borehole?.location_description ?? ""
  );
  const [easting, setEasting] = useState(
    borehole?.easting !== undefined ? String(borehole.easting) : ""
  );
  const [northing, setNorthing] = useState(
    borehole?.northing !== undefined ? String(borehole.northing) : ""
  );
  const [groundLevel, setGroundLevel] = useState(
    borehole?.ground_level !== undefined ? String(borehole.ground_level) : ""
  );
  const [scale, setScale] = useState(borehole?.scale ?? "1:50");
  const [holeType, setHoleType] = useState(borehole?.hole_type ?? "Rotary");
  const [startDate, setStartDate] = useState(borehole?.start_date ?? "");
  const [endDate, setEndDate] = useState(borehole?.end_date ?? "");
  const [loggedBy, setLoggedBy] = useState(borehole?.logged_by ?? "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Sync form when borehole prop changes (e.g. after refetch)
  useEffect(() => {
    if (borehole) {
      setBoreholeId(borehole.borehole_id);
      setLocationDescription(borehole.location_description);
      setEasting(String(borehole.easting));
      setNorthing(String(borehole.northing));
      setGroundLevel(String(borehole.ground_level));
      setScale(borehole.scale);
      setHoleType(borehole.hole_type);
      setStartDate(borehole.start_date ?? "");
      setEndDate(borehole.end_date ?? "");
      setLoggedBy(borehole.logged_by);
    }
  }, [borehole]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!boreholeId.trim()) {
      newErrors.borehole_id = "Borehole ID is required";
    }

    const eastingNum = parseFloat(easting);
    if (easting && isNaN(eastingNum)) {
      newErrors.easting = "Easting must be a valid number";
    }

    const northingNum = parseFloat(northing);
    if (northing && isNaN(northingNum)) {
      newErrors.northing = "Northing must be a valid number";
    }

    const groundLevelNum = parseFloat(groundLevel);
    if (groundLevel && isNaN(groundLevelNum)) {
      newErrors.ground_level = "Ground level must be a valid number";
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
        project_id: projectId,
        borehole_id: boreholeId.trim(),
        location_description: locationDescription.trim(),
        easting: easting ? parseFloat(easting) : 0,
        northing: northing ? parseFloat(northing) : 0,
        ground_level: groundLevel ? parseFloat(groundLevel) : 0,
        scale,
        hole_type: holeType,
        start_date: startDate || null,
        end_date: endDate || null,
        logged_by: loggedBy.trim(),
      };

      const url = isEditing
        ? `/api/boreholes/${borehole.id}`
        : "/api/boreholes";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        // Handle duplicate borehole ID error inline
        if (res.status === 409) {
          setErrors({
            borehole_id:
              json.error ||
              "A borehole with this ID already exists in the project",
          });
          setSubmitting(false);
          return;
        }
        onError(json.error || "Failed to save borehole");
        setSubmitting(false);
        return;
      }

      onSuccess(
        isEditing
          ? "Borehole updated successfully"
          : "Borehole created successfully"
      );
    } catch {
      onError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Borehole ID */}
        <div className="space-y-2">
          <Label htmlFor="borehole-id">Borehole ID</Label>
          <Input
            id="borehole-id"
            value={boreholeId}
            onChange={(e) => setBoreholeId(e.target.value)}
            placeholder="e.g. BH01"
            aria-invalid={!!errors.borehole_id}
            aria-describedby={
              errors.borehole_id ? "borehole-id-error" : undefined
            }
          />
          {errors.borehole_id && (
            <p id="borehole-id-error" className="text-sm text-destructive">
              {errors.borehole_id}
            </p>
          )}
        </div>

        {/* Location Description */}
        <div className="space-y-2">
          <Label htmlFor="location-description">Location Description</Label>
          <Input
            id="location-description"
            value={locationDescription}
            onChange={(e) => setLocationDescription(e.target.value)}
            placeholder="e.g. NE corner of site"
          />
        </div>

        {/* Easting */}
        <div className="space-y-2">
          <Label htmlFor="easting">Easting</Label>
          <Input
            id="easting"
            type="number"
            step="any"
            value={easting}
            onChange={(e) => setEasting(e.target.value)}
            placeholder="e.g. 456789.12"
            aria-invalid={!!errors.easting}
            aria-describedby={errors.easting ? "easting-error" : undefined}
          />
          {errors.easting && (
            <p id="easting-error" className="text-sm text-destructive">
              {errors.easting}
            </p>
          )}
        </div>

        {/* Northing */}
        <div className="space-y-2">
          <Label htmlFor="northing">Northing</Label>
          <Input
            id="northing"
            type="number"
            step="any"
            value={northing}
            onChange={(e) => setNorthing(e.target.value)}
            placeholder="e.g. 123456.78"
            aria-invalid={!!errors.northing}
            aria-describedby={errors.northing ? "northing-error" : undefined}
          />
          {errors.northing && (
            <p id="northing-error" className="text-sm text-destructive">
              {errors.northing}
            </p>
          )}
        </div>

        {/* Ground Level */}
        <div className="space-y-2">
          <Label htmlFor="ground-level">Ground Level (mAOD)</Label>
          <Input
            id="ground-level"
            type="number"
            step="any"
            value={groundLevel}
            onChange={(e) => setGroundLevel(e.target.value)}
            placeholder="e.g. 45.5"
            aria-invalid={!!errors.ground_level}
            aria-describedby={
              errors.ground_level ? "ground-level-error" : undefined
            }
          />
          {errors.ground_level && (
            <p id="ground-level-error" className="text-sm text-destructive">
              {errors.ground_level}
            </p>
          )}
        </div>

        {/* Scale */}
        <div className="space-y-2">
          <Label htmlFor="scale">Scale</Label>
          <Select value={scale} onValueChange={(val) => { if (val) setScale(val); }}>
            <SelectTrigger id="scale">
              <SelectValue placeholder="Select scale" />
            </SelectTrigger>
            <SelectContent>
              {SCALE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Hole Type */}
        <div className="space-y-2">
          <Label htmlFor="hole-type">Hole Type</Label>
          <Select value={holeType} onValueChange={(val) => { if (val) setHoleType(val); }}>
            <SelectTrigger id="hole-type">
              <SelectValue placeholder="Select hole type" />
            </SelectTrigger>
            <SelectContent>
              {HOLE_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <Label htmlFor="start-date">Start Date</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <Label htmlFor="end-date">End Date</Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {/* Logged By */}
        <div className="space-y-2">
          <Label htmlFor="logged-by">Logged By</Label>
          <Input
            id="logged-by"
            value={loggedBy}
            onChange={(e) => setLoggedBy(e.target.value)}
            placeholder="e.g. J. Smith"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={submitting}>
          {submitting
            ? "Saving..."
            : isEditing
              ? "Update Borehole"
              : "Create Borehole"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
