"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  label?: string;
  className?: string;
}

export function LoadingSpinner({ label, className }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label || "Loading"}
      className={cn("flex flex-col items-center justify-center gap-2", className)}
    >
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
      {label && (
        <p className="text-sm text-muted-foreground">{label}</p>
      )}
      <span className="sr-only">{label || "Loading"}</span>
    </div>
  );
}
