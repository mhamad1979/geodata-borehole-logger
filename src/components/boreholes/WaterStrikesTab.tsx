"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { WaterStrike } from "@/types/database";

interface WaterStrikesTabProps {
  boreholeId: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface FormErrors {
  date?: string;
  strike_depth?: string;
  casing_depth?: string;
  depth_after_period?: string;
  general?: string;
}

export function WaterStrikesTab({
  boreholeId,
  onSuccess,
  onError,
}: WaterStrikesTabProps) {
  const [waterStrikes, setWaterStrikes] = useState<WaterStrike[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WaterStrike | null>(null);

  // Form state
  const [date, setDate] = useState("");
  const [strikeDepth, setStrikeDepth] = useState("");
  const [casingDepth, setCasingDepth] = useState("");
  const [depthAfterPeriod, setDepthAfterPeriod] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchWaterStrikes = useCallback(async () => {
    try {
      const res = await fetch(`/api/boreholes/${boreholeId}/water-strikes`);
      const json = await res.json();

      if (res.ok && json.data) {
        setWaterStrikes(json.data);
      } else {
        onError(json.error || "Failed to load water strikes");
      }
    } catch {
      onError("Failed to load water strikes");
    } finally {
      setLoading(false);
    }
  }, [boreholeId, onError]);

  useEffect(() => {
    fetchWaterStrikes();
  }, [fetchWaterStrikes]);

  const resetForm = () => {
    setDate("");
    setStrikeDepth("");
    setCasingDepth("");
    setDepthAfterPeriod("");
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

    const sd = parseFloat(strikeDepth);
    if (strikeDepth === "" || isNaN(sd)) {
      newErrors.strike_depth = "Strike depth is required and must be a number";
    }

    const cd = parseFloat(casingDepth);
    if (casingDepth === "" || isNaN(cd)) {
      newErrors.casing_depth = "Casing depth is required and must be a number";
    }

    const dap = parseFloat(depthAfterPeriod);
    if (depthAfterPeriod === "" || isNaN(dap)) {
      newErrors.depth_after_period = "Depth after period is required and must be a number";
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
        strike_depth: parseFloat(strikeDepth),
        casing_depth: parseFloat(casingDepth),
        depth_after_period: parseFloat(depthAfterPeriod),
      };

      const res = await fetch(`/api/boreholes/${boreholeId}/water-strikes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.error) {
          setErrors({ general: json.error });
        } else {
          onError("Failed to save water strike");
        }
        setSubmitting(false);
        return;
      }

      setDialogOpen(false);
      onSuccess("Water strike added successfully");
      fetchWaterStrikes();
    } catch {
      onError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/water-strikes/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onSuccess("Water strike deleted successfully");
        fetchWaterStrikes();
      } else {
        const json = await res.json();
        onError(json.error || "Failed to delete water strike");
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
        <h3 className="text-lg font-medium">Water Strikes</h3>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="mr-1 h-4 w-4" />
          Add Water Strike
        </Button>
      </div>

      {/* Water Strikes List */}
      {waterStrikes.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          <p>No water strikes recorded yet. Click &quot;Add Water Strike&quot; to begin.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {waterStrikes.map((ws) => (
            <div
              key={ws.id}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
            >
              {/* Date badge */}
              <span className="inline-flex h-8 shrink-0 items-center justify-center rounded-sm bg-muted px-2 text-xs font-semibold">
                {ws.date}
              </span>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                  <span>Strike: {ws.strike_depth.toFixed(2)}m</span>
                  <span>Casing: {ws.casing_depth.toFixed(2)}m</span>
                  <span>After period: {ws.depth_after_period.toFixed(2)}m</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeleteTarget(ws)}
                  aria-label={`Delete water strike on ${ws.date}`}
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
            <DialogTitle>Add Water Strike</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <p className="text-sm text-destructive rounded-md bg-destructive/10 p-2">
                {errors.general}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="ws-date">Date</Label>
              <Input
                id="ws-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-invalid={!!errors.date}
                aria-describedby={errors.date ? "ws-date-error" : undefined}
              />
              {errors.date && (
                <p id="ws-date-error" className="text-sm text-destructive">{errors.date}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="ws-strike-depth">Strike Depth (m)</Label>
                <Input
                  id="ws-strike-depth"
                  type="number"
                  step="0.01"
                  min="0"
                  value={strikeDepth}
                  onChange={(e) => setStrikeDepth(e.target.value)}
                  placeholder="e.g. 5.50"
                  aria-invalid={!!errors.strike_depth}
                  aria-describedby={errors.strike_depth ? "ws-strike-depth-error" : undefined}
                />
                {errors.strike_depth && (
                  <p id="ws-strike-depth-error" className="text-sm text-destructive">{errors.strike_depth}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ws-casing-depth">Casing Depth (m)</Label>
                <Input
                  id="ws-casing-depth"
                  type="number"
                  step="0.01"
                  min="0"
                  value={casingDepth}
                  onChange={(e) => setCasingDepth(e.target.value)}
                  placeholder="e.g. 3.00"
                  aria-invalid={!!errors.casing_depth}
                  aria-describedby={errors.casing_depth ? "ws-casing-depth-error" : undefined}
                />
                {errors.casing_depth && (
                  <p id="ws-casing-depth-error" className="text-sm text-destructive">{errors.casing_depth}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ws-depth-after-period">After Period (m)</Label>
                <Input
                  id="ws-depth-after-period"
                  type="number"
                  step="0.01"
                  min="0"
                  value={depthAfterPeriod}
                  onChange={(e) => setDepthAfterPeriod(e.target.value)}
                  placeholder="e.g. 4.20"
                  aria-invalid={!!errors.depth_after_period}
                  aria-describedby={errors.depth_after_period ? "ws-depth-after-period-error" : undefined}
                />
                {errors.depth_after_period && (
                  <p id="ws-depth-after-period-error" className="text-sm text-destructive">{errors.depth_after_period}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Add Water Strike"}
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
        title="Delete Water Strike"
        description={
          deleteTarget
            ? `Are you sure you want to delete the water strike on ${deleteTarget.date}? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
