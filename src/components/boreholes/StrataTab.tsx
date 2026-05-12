"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StratumForm } from "@/components/boreholes/StratumForm";
import { LITHOLOGY_OPTIONS } from "@/components/boreholes/LithologyPicker";
import type { Stratum } from "@/types/database";
import { cn } from "@/lib/utils";

interface StrataTabProps {
  boreholeId: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function StrataTab({ boreholeId, onSuccess, onError }: StrataTabProps) {
  const [strata, setStrata] = useState<Stratum[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStratum, setEditingStratum] = useState<Stratum | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Stratum | null>(null);
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);

  const fetchStrata = useCallback(async () => {
    try {
      const res = await fetch(`/api/boreholes/${boreholeId}/strata`);
      const json = await res.json();

      if (res.ok && json.data) {
        setStrata(json.data);
      } else {
        onError(json.error || "Failed to load strata");
      }
    } catch {
      onError("Failed to load strata");
    } finally {
      setLoading(false);
    }
  }, [boreholeId, onError]);

  useEffect(() => {
    fetchStrata();
  }, [fetchStrata]);

  const handleAdd = () => {
    setEditingStratum(null);
    setDialogOpen(true);
  };

  const handleEdit = (stratum: Stratum) => {
    setEditingStratum(stratum);
    setDialogOpen(true);
  };

  const handleFormSuccess = (message: string, warning?: string) => {
    setDialogOpen(false);
    setEditingStratum(null);
    onSuccess(message);
    if (warning) {
      setOverlapWarning(warning);
    } else {
      setOverlapWarning(null);
    }
    fetchStrata();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/strata/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onSuccess("Stratum deleted successfully");
        setOverlapWarning(null);
        fetchStrata();
      } else {
        const json = await res.json();
        onError(json.error || "Failed to delete stratum");
      }
    } catch {
      onError("Network error. Please try again.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const getLithologyColor = (lithology: string): string => {
    const option = LITHOLOGY_OPTIONS.find((o) => o.type === lithology);
    return option?.color ?? "#999";
  };

  const getLithologyLabel = (lithology: string): string => {
    const option = LITHOLOGY_OPTIONS.find((o) => o.type === lithology);
    return option?.label ?? lithology;
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
      {/* Overlap Warning */}
      {overlapWarning && (
        <div className="flex items-center gap-2 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{overlapWarning}</span>
        </div>
      )}

      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Strata</h3>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="mr-1 h-4 w-4" />
          Add Stratum
        </Button>
      </div>

      {/* Strata List */}
      {strata.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          <p>No strata recorded yet. Click &quot;Add Stratum&quot; to begin.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {strata.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
            >
              {/* Lithology color indicator */}
              <span
                className={cn(
                  "inline-block h-8 w-8 shrink-0 rounded-sm",
                  s.lithology === "chalk" && "border border-input"
                )}
                style={{ backgroundColor: getLithologyColor(s.lithology) }}
                aria-hidden="true"
              />

              {/* Depth range and info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium">
                    {s.depth_from.toFixed(2)} – {s.depth_to.toFixed(2)}m
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {getLithologyLabel(s.lithology)}
                  </span>
                </div>
                {s.description && (
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {s.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleEdit(s)}
                  aria-label={`Edit stratum ${s.depth_from.toFixed(2)}-${s.depth_to.toFixed(2)}m`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeleteTarget(s)}
                  aria-label={`Delete stratum ${s.depth_from.toFixed(2)}-${s.depth_to.toFixed(2)}m`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingStratum ? "Edit Stratum" : "Add Stratum"}
            </DialogTitle>
          </DialogHeader>
          <StratumForm
            boreholeId={boreholeId}
            stratum={editingStratum}
            onSuccess={handleFormSuccess}
            onError={onError}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Stratum"
        description={
          deleteTarget
            ? `Are you sure you want to delete the stratum at ${deleteTarget.depth_from.toFixed(2)} – ${deleteTarget.depth_to.toFixed(2)}m? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
