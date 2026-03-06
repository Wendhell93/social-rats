import { CONTENT_TYPE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  technical: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  meme: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  announcement: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

const emojis: Record<string, string> = {
  technical: "🔧",
  meme: "😂",
  announcement: "📣",
};

interface ContentTypeBadgeProps {
  contentType: string | null;
}

export function ContentTypeBadge({ contentType }: ContentTypeBadgeProps) {
  if (!contentType) return null;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium",
      styles[contentType] || "bg-muted text-muted-foreground border-border"
    )}>
      {emojis[contentType]} {CONTENT_TYPE_LABELS[contentType] || contentType}
    </span>
  );
}
