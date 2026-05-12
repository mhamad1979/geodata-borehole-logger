"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SuccessNotification } from "@/components/ui/SuccessNotification";
import { ErrorNotification } from "@/components/ui/ErrorNotification";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { Project } from "@/types/database";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      const json = await res.json();
      if (res.ok && json.data) {
        setProjects(json.data);
      }
    } catch {
      setErrorMessage("Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = async () => {
    if (!deletingProject) return;

    try {
      const res = await fetch(`/api/projects/${deletingProject.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccessMessage("Project deleted successfully");
        fetchProjects();
      } else {
        const json = await res.json();
        setErrorMessage(json.error || "Failed to delete project");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setDeletingProject(null);
    }
  };

  const handleFormSuccess = () => {
    setSuccessMessage(editingProject ? "Project updated successfully" : "Project created successfully");
    setEditingProject(null);
    fetchProjects();
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

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            All your borehole logging projects, sorted by most recently modified.
          </p>
        </div>
        <Button onClick={() => { setEditingProject(null); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Project List */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h2 className="text-lg font-semibold">No projects yet</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Create your first project to start logging borehole data.
            </p>
            <Button onClick={() => { setEditingProject(null); setFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={(p) => { setEditingProject(p); setFormOpen(true); }}
              onDelete={(p) => setDeletingProject(p)}
            />
          ))}
        </div>
      )}

      {/* Project Form Dialog */}
      <ProjectForm
        open={formOpen}
        onOpenChange={setFormOpen}
        project={editingProject}
        onSuccess={handleFormSuccess}
        onError={(msg) => setErrorMessage(msg)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingProject}
        onOpenChange={(open) => { if (!open) setDeletingProject(null); }}
        title="Delete Project"
        description={`Are you sure you want to delete "${deletingProject?.name}"? This will permanently remove the project and all its boreholes, strata, and other data. This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
