import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Area } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";

interface AreaFilterProps {
  value: string;
  onChange: (areaId: string) => void;
}

export function AreaFilter({ value, onChange }: AreaFilterProps) {
  const [areas, setAreas] = useState<Area[]>([]);

  useEffect(() => {
    supabase.from("areas").select("*").order("name").then(({ data }) => {
      if (data) setAreas(data as Area[]);
    });
  }, []);

  if (areas.length === 0) return null;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-48 h-9 text-xs bg-primary/20 border-primary/30 text-white hover:bg-primary/30 backdrop-blur-sm">
        <Building2 className="w-3 h-3 mr-1.5 flex-shrink-0" />
        <SelectValue placeholder="Todas as áreas" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas as áreas</SelectItem>
        {areas.map(a => (
          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
