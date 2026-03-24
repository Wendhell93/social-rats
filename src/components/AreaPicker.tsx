import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Area } from "@/lib/types";
import { X } from "lucide-react";

interface AreaPickerProps {
  selected: Area[];
  onChange: (areas: Area[]) => void;
}

export function AreaPicker({ selected, onChange }: AreaPickerProps) {
  const [areas, setAreas] = useState<Area[]>([]);

  useEffect(() => {
    supabase.from("areas").select("*").order("name").then(({ data }) => {
      if (data) setAreas(data as Area[]);
    });
  }, []);

  function toggle(area: Area) {
    if (selected.find(a => a.id === area.id)) {
      onChange(selected.filter(a => a.id !== area.id));
    } else {
      onChange([...selected, area]);
    }
  }

  if (areas.length === 0) return <p className="text-xs text-muted-foreground">Nenhuma área cadastrada.</p>;

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(a => (
            <span key={a.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/15 border border-primary/20 text-xs text-primary">
              {a.name}
              <button onClick={() => toggle(a)} className="hover:text-foreground"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {areas.filter(a => !selected.find(s => s.id === a.id)).map(a => (
          <button
            key={a.id}
            type="button"
            onClick={() => toggle(a)}
            className="px-2.5 py-1 rounded-md border border-border text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
          >
            {a.name}
          </button>
        ))}
      </div>
    </div>
  );
}
