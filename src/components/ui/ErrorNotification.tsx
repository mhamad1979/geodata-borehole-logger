"use client";

import { useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ErrorNotificationProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export function ErrorNotification({
  message,
  onDismiss,
  onRetry,
}: ErrorNotificationProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "fixed top-4 right-4 z-50 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-lg",
        "dark:border-red-800 dark:bg-red-950"
      )}
    >
      <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400" />
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-red-800 dark:text-red-200">
          {message}
        </p>
        {onRetry && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onRetry}
          >
            Retry
          </Button>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          setVisible(false);
          onDismiss?.();
        }}
        className="ml-2 rounded-md p-1 text-red-600 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-red-400 dark:hover:bg-red-900"
        aria-label="Dismiss error"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
