"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { HoleProgress } from "@/types/database";

const WATER_STATUS_OPTIONS = [
  { value: "measured", label: "Measured" },
  { value: "dry", label: "Dry" },
  { value: "pumped", label: "Pumped" },
];

interface HoleProgressTabProps {
  boreholeId: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface FormErrors {
  date?: string;
  hole_depth?: string;
  casing_depth?: string;
  water_depth?: string;
  water_status?: string;
  general?: string;
}

export function HoleProgressTab({
  boreholeId,
  onSuccess,
  onError,
}: HoleProgressTabProps) {
  const [entries, setEntries] = useState<HoleProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HoleProgress | null>(null);

  // Form state
  const [date, setDate] = useState("");
  const [holeDepth, setHoleDepth] = useState("");
  const [casingDepth, setCasingDepth] = useState("");
  const [waterDepth, setWaterDepth] = useState("");
  const [waterStatus, setWaterStatus] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch(`/api/boreholes/${boreholeId}/hole-progress`);
      const json = await res.json();

      if (res.ok && json.data) {
        setEntries(json.data);
      } else {
        onError(json.error || "Failed to load hole progress");
      }
    } catch {
      onError("Failed to load hole progress");
    } finally {
      setLoading(false);
    }
  }, [boreholeId, onError]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const resetForm = () => {
    setDate("");
    setHoleDepth("");
    setCasingDepth("");
    setWaterDepth("");
    setWaterStatus("");
    setErrors({});
  };

  const handleAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!date.trim()) {
      newErrors.date = "Date is required";
    }

    const hd = parseFloat(holeDepth);
    if (holeDepth === "" || isNaN(hd)) {
      newErrors.hole_depth = "Hole depth is required and must be a number";
    }

    const cd = parseFloat(casingDepth);
    if (casingDepth === "" || isNaN(cd)) {
      newErrors.casing_depth = "Casing depth is required and must be a number";
    }

    // water_depth is optional, but if provided must be a number
    if (waterDepth !== "" && isNaN(parseFloat(waterDepth))) {
      newErrors.water_depth = "Water depth must be a number";
    }

    if (!waterStatus) {
      newErrors.water_status = "Water status is required";
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
        date: date.trim(),
        hole_depth: parseFloat(holeDepth),
        casing_depth: parseFloat(casingDepth),
        water_depth: waterDepth !== "" ? parseFloat(waterDepth) : null,
        water_status: waterStatus,
      };

      const res = await fetch(`/api/boreholes/${boreholeId}/hole-progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.error) {
          setErrors({ general: json.error });
        } else {
          onError("Failed to save hole progress entry");
        }
        setSubmitting(false);
        return;
      }

      setDialogOpen(false);
      onSuccess("Hole progress entry added successfully");
      fetchEntries();
    } catch {
      onError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/hole-progress/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onSuccess("Hole progress entry deleted successfully");
        fetchEntries();
      } else {
        const json = await res.json();
        onError(json.error || "Failed to delete hole progress entry");
      }
    } catch {
      onError("Network error. Please try again.");
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Hole Progress</h3>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="mr-1 h-4 w-4" />
          Add Entry
        </Button>
      </div>

      {/* Entries List */}
      {entries.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          <p>No hole progress entries recorded yet. Click &quot;Add Entry&quot; to begin.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
            >
              {/* Date badge */}
              <span className="inline-flex h-8 shrink-0 items-center justify-center rounded-sm bg-muted px-2 text-xs font-semibold">
                {entry.date}
              </span>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                  <span>Hole: {entry.hole_depth.toFixed(2)}m</span>
                  <span>Casing: {entry.casing_depth.toFixed(2)}m</span>
                  <span>
                    Water: {entry.water_depth !== null ? `${entry.water_depth.toFixed(2)}m` : "—"}
                  </span>
                  <span className="capitalize">{entry.water_status}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeleteTarget(entry)}
                  aria-label={`Delete hole progress entry on ${entry.date}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Hole Progress Entry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <p className="text-sm text-destructive rounded-md bg-destructive/10 p-2">
                {errors.general}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="hp-date">Date</Label>
              <Input
                id="hp-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-invalid={!!errors.date}
                aria-describedby={errors.date ? "hp-date-error" : undefined}
              />
              {errors.date && (
                <p id="hp-date-error" className="text-sm text-destructive">{errors.date}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="hp-hole-depth">Hole Depth (m)</Label>
                <Input
                  id="hp-hole-depth"
                  type="number"
                  step="0.01"
                  min="0"
                  value={holeDepth}
                  onChange={(e) => setHoleDepth(e.target.value)}
                  placeholder="e.g. 10.00"
                  aria-invalid={!!errors.hole_depth}
                  aria-describedby={errors.hole_depth ? "hp-hole-depth-error" : undefined}
                />
                {errors.hole_depth && (
                  <p id="hp-hole-depth-error" className="text-sm text-destructive">{errors.hole_depth}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hp-casing-depth">Casing Depth (m)</Label>
                <Input
                  id="hp-casing-depth"
                  type="number"
                  step="0.01"
                  min="0"
                  value={casingDepth}
                  onChange={(e) => setCasingDepth(e.target.value)}
                  placeholder="e.g. 5.00"
                  aria-invalid={!!errors.casing_depth}
                  aria-describedby={errors.casing_depth ? "hp-casing-depth-error" : undefined}
                />
                {errors.casing_depth && (
                  <p id="hp-casing-depth-error" className="text-sm text-destructive">{errors.casing_depth}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hp-water-depth">Water Depth (m)</Label>
                <Input
                  id="hp-water-depth"
                  type="number"
                  step="0.01"
                  min="0"
                  value={waterDepth}
                  onChange={(e) => setWaterDepth(e.target.value)}
                  placeholder="Optional"
                  aria-invalid={!!errors.water_depth}
                  aria-describedby={errors.water_depth ? "hp-water-depth-error" : undefined}
                />
                {errors.water_depth && (
                  <p id="hp-water-depth-error" className="text-sm text-destructive">{errors.water_depth}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hp-water-status">Water Status</Label>
              <Select value={waterStatus} onValueChange={(val) => { if (val) setWaterStatus(val); }}>
                <SelectTrigger
                  className="w-full"
                  aria-invalid={!!errors.water_status}
                  aria-describedby={errors.water_status ? "hp-water-status-error" : undefined}
                >
                  <SelectValue placeholder="Select water status" />
                </SelectTrigger>
                <SelectContent>
                  {WATER_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.water_status && (
                <p id="hp-water-status-error" className="text-sm text-destructive">{errors.water_status}</p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Add Entry"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Hole Progress Entry"
        description={
          deleteTarget
            ? `Are you sure you want to delete the hole progress entry on ${deleteTarget.date}? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
