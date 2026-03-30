import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export function WizardProgress({ currentStep, totalSteps, labels }: WizardProgressProps) {
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-sm mx-auto mb-6">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            {/* Dot */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                  isCompleted && "gradient-primary text-white shadow-md",
                  isActive && "gradient-primary text-white shadow-lg scale-110 glow-blue",
                  !isActive && !isCompleted && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step}
              </div>
              {labels?.[i] && (
                <span className={cn(
                  "text-[10px] mt-1 font-medium transition-colors hidden sm:block",
                  isActive ? "text-primary" : isCompleted ? "text-foreground/60" : "text-muted-foreground"
                )}>
                  {labels[i]}
                </span>
              )}
            </div>
            {/* Connecting line */}
            {step < totalSteps && (
              <div className="flex-1 h-0.5 mx-1.5">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
