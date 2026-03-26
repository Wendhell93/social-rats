import { cn } from "@/lib/utils";
import { Image, Video } from "lucide-react";

interface MediaTypeBadgeProps {
  mediaType: string;
  className?: string;
}

export function MediaTypeBadge({ mediaType, className }: MediaTypeBadgeProps) {
  const isVideo = mediaType === "video";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        isVideo
          ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
          : "bg-blue-500/15 text-blue-400 border border-blue-500/20",
        className
      )}
    >
      {isVideo ? <Video className="w-3 h-3" /> : <Image className="w-3 h-3" />}
      {isVideo ? "Video" : "Estatico"}
    </span>
  );
}
