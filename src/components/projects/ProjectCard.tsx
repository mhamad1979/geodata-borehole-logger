"use client";

import { useRouter } from "next/navigation";
import { Pencil, Trash2, MapPin, Hash, Building2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types/database";

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
  return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/projects/${project.id}`);
  };

  return (
    <Card
      className="group cursor-pointer transition-all hover:shadow-lg hover:border-primary/30"
      onClick={handleCardClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-bold leading-tight text-foreground group-hover:text-primary">
            {project.name}
          </CardTitle>
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); onEdit(project); }}
              aria-label={`Edit ${project.name}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(project); }}
              aria-label={`Delete ${project.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Hash className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{project.project_number}</span>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{project.client_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{project.location}</span>
        </div>
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground/70">
            Modified {formatRelativeTime(project.updated_at)}
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            Open <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
