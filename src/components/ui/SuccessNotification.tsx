"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessNotificationProps {
  message: string;
  onDismiss?: () => void;
  duration?: number;
}

export function SuccessNotification({
  message,
  onDismiss,
  duration = 3000,
}: SuccessNotificationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 shadow-lg",
        "dark:border-green-800 dark:bg-green-950"
      )}
    >
      <CheckCircle2 className="size-5 shrink-0 text-green-600 dark:text-green-400" />
      <p className="text-sm font-medium text-green-800 dark:text-green-200">
        {message}
      </p>
      <button
        type="button"
        onClick={() => {
          setVisible(false);
          onDismiss?.();
        }}
        className="ml-2 rounded-md p-1 text-green-600 hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 dark:text-green-400 dark:hover:bg-green-900"
        aria-label="Dismiss notification"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
