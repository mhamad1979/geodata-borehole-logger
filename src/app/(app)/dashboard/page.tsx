"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, FolderOpen, ArrowRight, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SuccessNotification } from "@/components/ui/SuccessNotification";
import { ErrorNotification } from "@/components/ui/ErrorNotification";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { Project } from "@/types/database";

export default function DashboardPage() {
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

  const recentProjects = projects.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
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

      {/* Welcome Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground">
            Manage your geotechnical borehole logging projects.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/new-log">
            <Button size="lg" className="text-base font-semibold shadow-md">
              <FilePlus className="mr-2 h-5 w-5" />
              New Borehole Log
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="text-base font-semibold" onClick={() => { setEditingProject(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-5 w-5" />
            New Project
          </Button>
        </div>
      </div>

      {/* Workflow Guide */}
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="py-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">How it works</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
              <div>
                <p className="text-sm font-semibold text-foreground">Create a Project</p>
                <p className="text-xs text-muted-foreground">Click &quot;New Project&quot; above</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
              <div>
                <p className="text-sm font-semibold text-foreground">Add Boreholes</p>
                <p className="text-xs text-muted-foreground">Open a project, then add boreholes</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</div>
              <div>
                <p className="text-sm font-semibold text-foreground">Enter Data</p>
                <p className="text-xs text-muted-foreground">Add strata, core runs, and more</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">4</div>
              <div>
                <p className="text-sm font-semibold text-foreground">Generate PDF</p>
                <p className="text-xs text-muted-foreground">Download your borehole log report</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Projects */}
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Projects</h2>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View All Projects
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={(p) => { setEditingProject(p); setFormOpen(true); }}
                onDelete={(p) => setDeletingProject(p)}
              />
            ))}
          </div>
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
