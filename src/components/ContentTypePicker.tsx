import { ContentTypeMultipliers, CONTENT_TYPE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: null, label: "Nenhum", emoji: "—" },
  { value: "technical", label: "Técnico", emoji: "🔧" },
  { value: "meme", label: "Meme", emoji: "😂" },
  { value: "announcement", label: "Anúncio", emoji: "📣" },
] as const;

interface ContentTypePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  multipliers: ContentTypeMultipliers | null;
}

export function ContentTypePicker({ value, onChange, multipliers }: ContentTypePickerProps) {
  function getMultLabel(v: string | null): string {
    if (!v || !multipliers) return "1×";
    const m = multipliers[v as keyof Pick<ContentTypeMultipliers, "technical" | "meme" | "announcement">];
    return `${m}×`;
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-xl border px-3 py-3 text-sm transition-all",
              active
                ? "border-primary bg-primary/10 text-primary font-semibold"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            <span className="text-lg leading-none">{opt.emoji}</span>
            <span className="text-xs font-medium">{opt.label}</span>
            {opt.value !== null && (
              <span className={cn("text-xs", active ? "text-primary/70" : "text-muted-foreground/60")}>
                {getMultLabel(opt.value)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
