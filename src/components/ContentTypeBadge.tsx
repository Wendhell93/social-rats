import { cn } from "@/lib/utils";
import { useContentTypes } from "@/hooks/use-content-types";

const defaultStyles: Record<string, string> = {
  technical: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  meme: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  announcement: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

interface ContentTypeBadgeProps {
  contentType: string | null;
}

export function ContentTypeBadge({ contentType }: ContentTypeBadgeProps) {
  const { types } = useContentTypes();
  if (!contentType) return null;
  const found = types.find(t => t.key === contentType);
  const label = found?.label || contentType;
  const emoji = found?.emoji || "📝";
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium",
      defaultStyles[contentType] || "bg-purple-500/10 text-purple-400 border-purple-500/20"
    )}>
      {emoji} {label}
    </span>
  );
}
