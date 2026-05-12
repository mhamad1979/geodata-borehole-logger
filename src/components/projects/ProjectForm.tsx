"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Project } from "@/types/database";

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  onSuccess: () => void;
  onError: (message: string) => void;
}

interface FormErrors {
  name?: string;
  project_number?: string;
  client_name?: string;
  location?: string;
}

export function ProjectForm({
  open,
  onOpenChange,
  project,
  onSuccess,
  onError,
}: ProjectFormProps) {
  const isEditing = !!project;

  const [name, setName] = useState(project?.name ?? "");
  const [projectNumber, setProjectNumber] = useState(project?.project_number ?? "");
  const [clientName, setClientName] = useState(project?.client_name ?? "");
  const [location, setLocation] = useState(project?.location ?? "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Sync form state when project prop changes (e.g. opening edit dialog)
  useEffect(() => {
    if (open) {
      setName(project?.name ?? "");
      setProjectNumber(project?.project_number ?? "");
      setClientName(project?.client_name ?? "");
      setLocation(project?.location ?? "");
      setErrors({});
      setSubmitting(false);
    }
  }, [open, project]);

  // Reset form when project changes
  const resetForm = () => {
    setName(project?.name ?? "");
    setProjectNumber(project?.project_number ?? "");
    setClientName(project?.client_name ?? "");
    setLocation(project?.location ?? "");
    setErrors({});
    setSubmitting(false);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) newErrors.name = "Name is required";
    if (!projectNumber.trim()) newErrors.project_number = "Project number is required";
    if (!clientName.trim()) newErrors.client_name = "Client name is required";
    if (!location.trim()) newErrors.location = "Location is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        project_number: projectNumber.trim(),
        client_name: clientName.trim(),
        location: location.trim(),
      };

      const url = isEditing ? `/api/projects/${project.id}` : "/api/projects";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        onError(json.error || "Failed to save project");
        setSubmitting(false);
        return;
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch {
      onError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) resetForm();
        onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Project" : "New Project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Highway Bridge Investigation"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-destructive">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-number">Project Number</Label>
            <Input
              id="project-number"
              value={projectNumber}
              onChange={(e) => setProjectNumber(e.target.value)}
              placeholder="e.g. PRJ-2024-001"
              aria-invalid={!!errors.project_number}
              aria-describedby={errors.project_number ? "project-number-error" : undefined}
            />
            {errors.project_number && (
              <p id="project-number-error" className="text-sm text-destructive">
                {errors.project_number}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-name">Client Name</Label>
            <Input
              id="client-name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Acme Construction Ltd"
              aria-invalid={!!errors.client_name}
              aria-describedby={errors.client_name ? "client-name-error" : undefined}
            />
            {errors.client_name && (
              <p id="client-name-error" className="text-sm text-destructive">
                {errors.client_name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-location">Location</Label>
            <Input
              id="project-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Manchester, UK"
              aria-invalid={!!errors.location}
              aria-describedby={errors.location ? "location-error" : undefined}
            />
            {errors.location && (
              <p id="location-error" className="text-sm text-destructive">
                {errors.location}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
