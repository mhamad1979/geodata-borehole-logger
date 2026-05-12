"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  ArrowLeft,
  MapPin,
  Hash,
  Building2,
  Pencil,
  Trash2,
  CircleDot,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SuccessNotification } from "@/components/ui/SuccessNotification";
import { ErrorNotification } from "@/components/ui/ErrorNotification";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { BoreholeForm } from "@/components/boreholes/BoreholeForm";
import type { Project, Borehole } from "@/types/database";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [boreholes, setBoreholes] = useState<Borehole[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingBorehole, setEditingBorehole] = useState<Borehole | null>(null);
  const [deletingBorehole, setDeletingBorehole] = useState<Borehole | null>(
    null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setProject(json.data);
      }
    } catch {
      setErrorMessage("Failed to load project");
    }
  }, [projectId]);

  const fetchBoreholes = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/boreholes`);
      const json = await res.json();
      if (res.ok && json.data) {
        setBoreholes(json.data);
      }
    } catch {
      setErrorMessage("Failed to load boreholes");
    }
  }, [projectId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchProject(), fetchBoreholes()]);
      setLoading(false);
    };
    load();
  }, [fetchProject, fetchBoreholes]);

  const handleDelete = async () => {
    if (!deletingBorehole) return;

    try {
      const res = await fetch(`/api/boreholes/${deletingBorehole.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccessMessage("Borehole deleted successfully");
        fetchBoreholes();
      } else {
        const json = await res.json();
        setErrorMessage(json.error || "Failed to delete borehole");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setDeletingBorehole(null);
    }
  };

  const handleCreateSuccess = (message: string) => {
    setSuccessMessage(message);
    setCreateDialogOpen(false);
    fetchBoreholes();
  };

  const handleEditSuccess = (message: string) => {
    setSuccessMessage(message);
    setEditingBorehole(null);
    fetchBoreholes();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <SuccessNotification
          message={successMessage}
          onDismiss={() => setSuccessMessage(null)}
        />
      )}
      {errorMessage && (
        <ErrorNotification
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {/* Back Link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      {/* Project Header */}
      {project && (
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Hash className="h-3.5 w-3.5" />
              {project.project_number}
            </span>
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {project.client_name}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {project.location}
            </span>
          </div>
        </div>
      )}

      {/* Boreholes Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Boreholes</h2>
          <p className="text-sm text-muted-foreground">Click on a borehole name to open it and add geological data.</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Borehole
        </Button>
      </div>

      {/* Borehole List */}
      {boreholes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CircleDot className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold">No boreholes yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Create your first borehole to start logging data.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Borehole
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boreholes.map((bh) => (
            <Card
              key={bh.id}
              className="group cursor-pointer transition-all hover:shadow-lg hover:border-primary/30"
              onClick={() => router.push(`/boreholes/${bh.id}`)}
              role="link"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/boreholes/${bh.id}`);
                }
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg font-bold leading-tight text-foreground group-hover:text-primary">
                    {bh.borehole_id}
                  </CardTitle>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => { e.stopPropagation(); setEditingBorehole(bh); }}
                      aria-label={`Edit ${bh.borehole_id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); setDeletingBorehole(bh); }}
                      aria-label={`Delete ${bh.borehole_id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                {bh.location_description && (
                  <p className="truncate">{bh.location_description}</p>
                )}
                <p>
                  Type: {bh.hole_type} &middot; Scale: {bh.scale}
                </p>
                {bh.logged_by && <p>Logged by: {bh.logged_by}</p>}
                <div className="flex items-center justify-end pt-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    Open <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Borehole Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Borehole</DialogTitle>
          </DialogHeader>
          <BoreholeForm
            projectId={projectId}
            mode="create"
            onSuccess={handleCreateSuccess}
            onError={(msg) => setErrorMessage(msg)}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Borehole Dialog */}
      <Dialog
        open={!!editingBorehole}
        onOpenChange={(open) => {
          if (!open) setEditingBorehole(null);
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Borehole</DialogTitle>
          </DialogHeader>
          {editingBorehole && (
            <BoreholeForm
              projectId={projectId}
              borehole={editingBorehole}
              mode="edit"
              onSuccess={handleEditSuccess}
              onError={(msg) => setErrorMessage(msg)}
              onCancel={() => setEditingBorehole(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingBorehole}
        onOpenChange={(open) => {
          if (!open) setDeletingBorehole(null);
        }}
        title="Delete Borehole"
        description={`Are you sure you want to delete "${deletingBorehole?.borehole_id}"? This will permanently remove the borehole and all its strata, core runs, and other data. This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
