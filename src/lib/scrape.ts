/**
 * Scrape post metrics via the Supabase Edge Function (scrape-post).
 * Since the app now runs on the same Supabase project as the Edge Function,
 * we use the supabase client directly — no extra keys needed.
 */

import { supabase } from "@/integrations/supabase/client";

export interface ScrapeResult {
  scraped: boolean;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  views: number;
  title: string | null;
  thumbnail_url: string | null;
  scrape_error?: string;
}

function fallback(scrape_error: string): ScrapeResult {
  return { scraped: false, likes: 0, comments: 0, shares: 0, saves: 0, views: 0, title: null, thumbnail_url: null, scrape_error };
}

export async function scrapePost(url: string, platform: string): Promise<ScrapeResult> {
  try {
    const { data, error } = await supabase.functions.invoke("scrape-post", {
      body: { url, platform },
    });

    if (error) throw error;

    if (data?.scraped) {
      return data as ScrapeResult;
    } else {
      return fallback(data?.scrape_error || "Scraping não retornou métricas");
    }
  } catch (err: any) {
    console.error("Scrape error:", err);
    return fallback(err?.message || "Erro ao conectar com a Edge Function");
  }
}