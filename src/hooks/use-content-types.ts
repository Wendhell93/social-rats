import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ContentTypeConfig {
  id: string;
  key: string;
  label: string;
  emoji: string;
  description: string;
  multiplier: number;
}

export function useContentTypes() {
  const [types, setTypes] = useState<ContentTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase
      .from("content_types")
      .select("*")
      .order("label");
    if (data) setTypes(data as ContentTypeConfig[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  /** Build a key→multiplier map for score calculation */
  const multipliersMap: Record<string, number> = {};
  for (const t of types) {
    multipliersMap[t.key] = t.multiplier;
  }

  return { types, loading, reload: load, multipliersMap };
}
