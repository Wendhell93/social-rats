import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MediaTypeMultipliers {
  id: string;
  static_multiplier: number;
  video_multiplier: number;
  updated_at: string;
}

export function useMediaMultipliers() {
  const [data, setData] = useState<MediaTypeMultipliers | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data: row } = await supabase
      .from("media_type_multipliers")
      .select("*")
      .limit(1)
      .single();
    if (row) setData(row as MediaTypeMultipliers);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function getMediaMultiplier(mediaType: string | null): number {
    if (!data || !mediaType) return 1.0;
    return mediaType === "video" ? data.video_multiplier : data.static_multiplier;
  }

  return { data, loading, reload: load, getMediaMultiplier };
}
