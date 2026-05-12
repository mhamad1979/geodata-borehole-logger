"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CoreRunForm } from "@/components/boreholes/CoreRunForm";
import type { CoreRun } from "@/types/database";

interface CoreRunsTabProps {
  boreholeId: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function CoreRunsTab({
  boreholeId,
  onSuccess,
  onError,
}: CoreRunsTabProps) {
  const [coreRuns, setCoreRuns] = useState<CoreRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoreRun, setEditingCoreRun] = useState<CoreRun | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CoreRun | null>(null);

  const fetchCoreRuns = useCallback(async () => {
    try {
      const res = await fetch(`/api/boreholes/${boreholeId}/core-runs`);
      const json = await res.json();

      if (res.ok && json.data) {
        setCoreRuns(json.data);
      } else {
        onError(json.error || "Failed to load core runs");
      }
    } catch {
      onError("Failed to load core runs");
    } finally {
      setLoading(false);
    }
  }, [boreholeId, onError]);

  useEffect(() => {
    fetchCoreRuns();
  }, [fetchCoreRuns]);

  const handleAdd = () => {
    setEditingCoreRun(null);
    setDialogOpen(true);
  };

  const handleEdit = (coreRun: CoreRun) => {
    setEditingCoreRun(coreRun);
    setDialogOpen(true);
  };

  const handleFormSuccess = (message: string) => {
    setDialogOpen(false);
    setEditingCoreRun(null);
    onSuccess(message);
    fetchCoreRuns();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/core-runs/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onSuccess("Core run deleted successfully");
        fetchCoreRuns();
      } else {
        const json = await res.json();
        onError(json.error || "Failed to delete core run");
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
        <h3 className="text-lg font-medium">Core Runs</h3>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="mr-1 h-4 w-4" />
          Add Core Run
        </Button>
      </div>

      {/* Core Runs List */}
      {coreRuns.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          <p>
            No core runs recorded yet. Click &quot;Add Core Run&quot; to begin.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {coreRuns.map((cr) => (
            <div
              key={cr.id}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
            >
              {/* Sample type badge */}
              <span className="inline-flex h-8 w-12 shrink-0 items-center justify-center rounded-sm bg-muted text-xs font-semibold">
                {cr.sample_type}
              </span>

              {/* Depth range and percentages */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-medium">
                    {cr.depth_from.toFixed(2)} – {cr.depth_to.toFixed(2)}m
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-sm text-muted-foreground">
                  <span>Recovery: {cr.recovery_percent}%</span>
                  <span>SCR: {cr.scr_percent}%</span>
                  <span>RQD/TCR: {cr.rqd_tcr_percent}%</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleEdit(cr)}
                  aria-label={`Edit core run ${cr.depth_from.toFixed(2)}-${cr.depth_to.toFixed(2)}m`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeleteTarget(cr)}
                  aria-label={`Delete core run ${cr.depth_from.toFixed(2)}-${cr.depth_to.toFixed(2)}m`}
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
              {editingCoreRun ? "Edit Core Run" : "Add Core Run"}
            </DialogTitle>
          </DialogHeader>
          <CoreRunForm
            boreholeId={boreholeId}
            coreRun={editingCoreRun}
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
        title="Delete Core Run"
        description={
          deleteTarget
            ? `Are you sure you want to delete the core run at ${deleteTarget.depth_from.toFixed(2)} – ${deleteTarget.depth_to.toFixed(2)}m? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
