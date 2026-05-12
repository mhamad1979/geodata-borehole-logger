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
import type { Installation, InstallationType } from "@/types/database";

const INSTALLATION_TYPE_OPTIONS: { value: InstallationType; label: string }[] = [
  { value: "plain_casing", label: "Plain Casing" },
  { value: "slotted_casing", label: "Slotted Casing" },
  { value: "screen", label: "Screen" },
  { value: "gravel_pack", label: "Gravel Pack" },
  { value: "bentonite_seal", label: "Bentonite Seal" },
  { value: "cement_grout", label: "Cement Grout" },
];

interface InstallationsTabProps {
  boreholeId: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface FormErrors {
  installation_type?: string;
  depth_from?: string;
  depth_to?: string;
  general?: string;
}

export function InstallationsTab({
  boreholeId,
  onSuccess,
  onError,
}: InstallationsTabProps) {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Installation | null>(null);

  // Form state
  const [installationType, setInstallationType] = useState("");
  const [depthFrom, setDepthFrom] = useState("");
  const [depthTo, setDepthTo] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchInstallations = useCallback(async () => {
    try {
      const res = await fetch(`/api/boreholes/${boreholeId}/installations`);
      const json = await res.json();

      if (res.ok && json.data) {
        setInstallations(json.data);
      } else {
        onError(json.error || "Failed to load installations");
      }
    } catch {
      onError("Failed to load installations");
    } finally {
      setLoading(false);
    }
  }, [boreholeId, onError]);

  useEffect(() => {
    fetchInstallations();
  }, [fetchInstallations]);

  const resetForm = () => {
    setInstallationType("");
    setDepthFrom("");
    setDepthTo("");
    setErrors({});
  };

  const handleAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!installationType) {
      newErrors.installation_type = "Installation type is required";
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
        installation_type: installationType,
        depth_from: parseFloat(depthFrom),
        depth_to: parseFloat(depthTo),
      };

      const res = await fetch(`/api/boreholes/${boreholeId}/installations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.error) {
          setErrors({ general: json.error });
        } else {
          onError("Failed to save installation");
        }
        setSubmitting(false);
        return;
      }

      setDialogOpen(false);
      onSuccess("Installation added successfully");
      fetchInstallations();
    } catch {
      onError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/installations/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onSuccess("Installation deleted successfully");
        fetchInstallations();
      } else {
        const json = await res.json();
        onError(json.error || "Failed to delete installation");
      }
    } catch {
      onError("Network error. Please try again.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const getTypeLabel = (type: InstallationType): string => {
    const option = INSTALLATION_TYPE_OPTIONS.find((o) => o.value === type);
    return option?.label ?? type;
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
        <h3 className="text-lg font-medium">Installations</h3>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="mr-1 h-4 w-4" />
          Add Installation
        </Button>
      </div>

      {/* Installations List */}
      {installations.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          <p>No installations recorded yet. Click &quot;Add Installation&quot; to begin.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {installations.map((inst) => (
            <div
              key={inst.id}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
            >
              {/* Type badge */}
              <span className="inline-flex h-8 shrink-0 items-center justify-center rounded-sm bg-muted px-2 text-xs font-semibold">
                {getTypeLabel(inst.installation_type)}
              </span>

              {/* Depth range */}
              <div className="flex-1 min-w-0">
                <span className="font-mono text-sm font-medium">
                  {inst.depth_from.toFixed(2)} – {inst.depth_to.toFixed(2)}m
                </span>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeleteTarget(inst)}
                  aria-label={`Delete installation ${getTypeLabel(inst.installation_type)} at ${inst.depth_from.toFixed(2)}-${inst.depth_to.toFixed(2)}m`}
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
            <DialogTitle>Add Installation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <p className="text-sm text-destructive rounded-md bg-destructive/10 p-2">
                {errors.general}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="inst-type">Installation Type</Label>
              <Select value={installationType} onValueChange={(val) => { if (val) setInstallationType(val); }}>
                <SelectTrigger
                  className="w-full"
                  aria-invalid={!!errors.installation_type}
                  aria-describedby={errors.installation_type ? "inst-type-error" : undefined}
                >
                  <SelectValue placeholder="Select installation type" />
                </SelectTrigger>
                <SelectContent>
                  {INSTALLATION_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.installation_type && (
                <p id="inst-type-error" className="text-sm text-destructive">{errors.installation_type}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="inst-depth-from">Depth From (m)</Label>
                <Input
                  id="inst-depth-from"
                  type="number"
                  step="0.01"
                  min="0"
                  value={depthFrom}
                  onChange={(e) => setDepthFrom(e.target.value)}
                  placeholder="e.g. 0.00"
                  aria-invalid={!!errors.depth_from}
                  aria-describedby={errors.depth_from ? "inst-depth-from-error" : undefined}
                />
                {errors.depth_from && (
                  <p id="inst-depth-from-error" className="text-sm text-destructive">{errors.depth_from}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="inst-depth-to">Depth To (m)</Label>
                <Input
                  id="inst-depth-to"
                  type="number"
                  step="0.01"
                  min="0"
                  value={depthTo}
                  onChange={(e) => setDepthTo(e.target.value)}
                  placeholder="e.g. 5.00"
                  aria-invalid={!!errors.depth_to}
                  aria-describedby={errors.depth_to ? "inst-depth-to-error" : undefined}
                />
                {errors.depth_to && (
                  <p id="inst-depth-to-error" className="text-sm text-destructive">{errors.depth_to}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Add Installation"}
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
        title="Delete Installation"
        description={
          deleteTarget
            ? `Are you sure you want to delete the ${getTypeLabel(deleteTarget.installation_type)} installation at ${deleteTarget.depth_from.toFixed(2)} – ${deleteTarget.depth_to.toFixed(2)}m? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
