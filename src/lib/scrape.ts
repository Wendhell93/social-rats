import { supabase } from "@/integrations/supabase/client";

export interface ScrapeResult {
  success: boolean;
  scraped: boolean;
  title: string | null;
  thumbnail_url: string | null;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  scrape_error?: string;
  error?: string;
}

export async function scrapePost(url: string): Promise<ScrapeResult> {
  try {
    const { data, error } = await supabase.functions.invoke("scrape-post", {
      body: { url },
    });

    if (error) {
      return {
        success: false,
        scraped: false,
        title: null,
        thumbnail_url: null,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        error: error.message,
      };
    }

    return data as ScrapeResult;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return {
      success: false,
      scraped: false,
      title: null,
      thumbnail_url: null,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      error: message,
    };
  }
}
