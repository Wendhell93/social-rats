import { Instagram, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlatformBadgeProps {
  platform: "instagram" | "tiktok";
  className?: string;
}

export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        platform === "instagram"
          ? "bg-platform-instagram platform-instagram"
          : "bg-platform-tiktok platform-tiktok",
        className
      )}
    >
      {platform === "instagram" ? (
        <Instagram className="w-3 h-3" />
      ) : (
        <Music2 className="w-3 h-3" />
      )}
      {platform === "instagram" ? "Instagram" : "TikTok"}
    </span>
  );
}
