import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Vercel Cron endpoint — triggers Supabase edge function to refresh all post metrics.
 * Runs daily at 4:00 AM (America/Sao_Paulo) via vercel.json cron config.
 *
 * Required env vars on Vercel:
 *   CRON_SECRET        — auto-injected by Vercel for cron auth
 *   REFRESH_SECRET     — shared secret to authenticate with the edge function
 *   SUPABASE_URL       — e.g. https://kcfopagleppcazuodyal.supabase.co
 *   VITE_SUPABASE_PUBLISHABLE_KEY — Supabase anon key (required for edge function auth)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel Cron sends this header to prove it's a legitimate cron invocation
  const authHeader = req.headers["authorization"];
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabaseUrl = process.env.SUPABASE_URL || "https://kcfopagleppcazuodyal.supabase.co";
  const refreshSecret = process.env.REFRESH_SECRET;
  const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!refreshSecret) {
    return res.status(500).json({ error: "REFRESH_SECRET not configured" });
  }

  if (!supabaseAnonKey) {
    return res.status(500).json({ error: "VITE_SUPABASE_PUBLISHABLE_KEY not configured" });
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/refresh-all-metrics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseAnonKey}`,
        "x-refresh-secret": refreshSecret,
      },
      body: JSON.stringify({
        triggered_by: "cron",
        days_back: 30,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Edge function error:", data);
      return res.status(502).json({ error: "Edge function failed", details: data });
    }

    console.log("Cron refresh completed:", data);
    return res.status(200).json(data);
  } catch (error) {
    console.error("Cron refresh error:", error);
    return res.status(500).json({ error: "Failed to call edge function" });
  }
}
