import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAreaFilter } from "@/contexts/AreaFilterContext";

/**
 * Returns a Set of creator IDs that belong to the selected area.
 * If areaFilter is "all", returns null (meaning no filtering needed).
 */
export function useAreaCreatorIds() {
  const { areaFilter } = useAreaFilter();
  const [creatorIds, setCreatorIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (areaFilter === "all") {
      setCreatorIds(null);
      return;
    }
    supabase
      .from("creator_areas")
      .select("creator_id")
      .eq("area_id", areaFilter)
      .then(({ data }) => {
        setCreatorIds(new Set((data || []).map((d: any) => d.creator_id)));
      });
  }, [areaFilter]);

  /** Returns true if the creator passes the area filter */
  function matchesArea(creatorId: string): boolean {
    if (!creatorIds) return true; // "all" — no filtering
    return creatorIds.has(creatorId);
  }

  return { matchesArea, areaFilter };
}
