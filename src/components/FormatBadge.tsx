import { cn } from "@/lib/utils";
import { Layers, BookImage } from "lucide-react";

interface FormatBadgeProps {
  format: string;
  className?: string;
}

export function FormatBadge({ format, className }: FormatBadgeProps) {
  const isStories = format === "stories";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium",
        isStories
          ? "bg-primary/10 border-primary/20 text-primary"
          : "bg-secondary/50 border-border text-secondary-foreground",
        className
      )}
    >
      {isStories ? <BookImage className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
      {isStories ? "Stories" : "Feed"}
    </span>
  );
}
