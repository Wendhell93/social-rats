import { Instagram, Youtube, Linkedin, Twitter } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlatformBadgeProps {
  platform: string;
  className?: string;
}

const config: Record<string, { label: string; color: string; bg: string; icon?: React.ElementType }> = {
  instagram: { label: "Instagram", color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20", icon: Instagram },
  tiktok: { label: "TikTok", color: "text-foreground", bg: "bg-muted border-border" },
  youtube: { label: "YouTube", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: Youtube },
  twitter: { label: "Twitter / X", color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20", icon: Twitter },
  linkedin: { label: "LinkedIn", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: Linkedin },
};

export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  const p = config[platform?.toLowerCase()] || { label: platform || "—", color: "text-muted-foreground", bg: "bg-muted border-border" };
  const Icon = p.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium", p.bg, p.color, className)}>
      {Icon && <Icon className="w-3 h-3" />}
      {p.label}
    </span>
  );
}
