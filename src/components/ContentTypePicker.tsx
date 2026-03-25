import { cn } from "@/lib/utils";
import { ContentTypeConfig } from "@/hooks/use-content-types";

interface ContentTypePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  types: ContentTypeConfig[];
}

export function ContentTypePicker({ value, onChange, types }: ContentTypePickerProps) {
  const options = [
    { key: null as string | null, label: "Nenhum", emoji: "—", multiplier: 1 },
    ...types.map(t => ({ key: t.key, label: t.label, emoji: t.emoji, multiplier: t.multiplier })),
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={String(opt.key)}
            type="button"
            onClick={() => onChange(opt.key)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-xl border px-3 py-3 text-sm transition-all",
              active
                ? "border-primary bg-primary/10 text-primary font-semibold"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            <span className="text-lg leading-none">{opt.emoji}</span>
            <span className="text-xs font-medium">{opt.label}</span>
            {opt.key !== null && (
              <span className={cn("text-xs", active ? "text-primary/70" : "text-muted-foreground/60")}>
                {opt.multiplier}×
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
