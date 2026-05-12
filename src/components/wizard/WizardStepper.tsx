"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  number: number;
  label: string;
}

const steps: Step[] = [
  { number: 1, label: "Project" },
  { number: 2, label: "Borehole" },
  { number: 3, label: "Data" },
  { number: 4, label: "Report" },
];

interface WizardStepperProps {
  currentStep: number;
}

export function WizardStepper({ currentStep }: WizardStepperProps) {
  return (
    <nav aria-label="Wizard progress" className="w-full">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={step.number}
              className={cn("flex items-center", !isLast && "flex-1")}
            >
              {/* Step circle + label */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
                    isCompleted &&
                      "border-primary bg-primary text-primary-foreground",
                    isCurrent &&
                      "border-primary bg-primary/10 text-primary",
                    !isCompleted &&
                      !isCurrent &&
                      "border-muted-foreground/30 text-muted-foreground/50"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    isCurrent && "text-primary font-semibold",
                    isCompleted && "text-primary",
                    !isCompleted && !isCurrent && "text-muted-foreground/60"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1 rounded-full transition-colors sm:mx-4",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/20"
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
