const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-refresh-secret',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Protect with a shared secret
  const expectedSecret = Deno.env.get('REFRESH_SECRET');
  if (expectedSecret) {
    const providedSecret = req.headers.get('x-refresh-secret');
    if (providedSecret !== expectedSecret) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const sociavaultKey = Deno.env.get('SOCIAVAULT_API_KEY');
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Parse optional body
  let triggeredBy = 'manual';
  let daysBack = 30;
  try {
    const body = await req.json();
    if (body.triggered_by) triggeredBy = body.triggered_by;
    if (body.days_back) daysBack = body.days_back;
  } catch { /* no body is fine */ }

  if (!sociavaultKey) {
    return jsonResponse({ error: 'SOCIAVAULT_API_KEY not configured' }, 500);
  }

  // Create log entry
  const { data: log } = await supabase.from('scrape_logs').insert({
    triggered_by: triggeredBy,
    status: 'running',
  }).select().single();

  const logId = log?.id;

  try {
    // Fetch posts from last N days that are Instagram or TikTok
    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    const { data: posts, error: fetchErr } = await supabase
      .from('posts')
      .select('id, url, platform, format, content_type')
      .or('platform.eq.instagram,platform.eq.tiktok')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });

    if (fetchErr || !posts) {
      throw new Error(fetchErr?.message || 'Failed to fetch posts');
    }

    console.log(`Refreshing metrics for ${posts.length} posts (last ${daysBack} days)`);

    // Fetch weights for score recalculation
    const [{ data: weights }, { data: multipliers }, { data: storiesW }] = await Promise.all([
      supabase.from('engagement_weights').select('*').limit(1).single(),
      supabase.from('content_type_multipliers').select('*').limit(1).single(),
      supabase.from('stories_weights').select('*').limit(1).single(),
    ]);

    let updated = 0;
    let failed = 0;
    const BATCH_SIZE = 10; // SociaVault-friendly concurrency

    for (let i = 0; i < posts.length; i += BATCH_SIZE) {
      const batch = posts.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (post) => {
          try {
            const metrics = await scrapeOne(post.url, post.platform, sociavaultKey);
            if (!metrics) return false;

            // Calculate new score
            let score = 0;
            if (post.format === 'stories') {
              score = (metrics.views_pico ?? 0) * (storiesW?.views_pico_weight ?? 0.25)
                + (metrics.interactions ?? 0) * (storiesW?.interactions_weight ?? 3)
                + (metrics.forwards ?? 0) * (storiesW?.forwards_weight ?? 5)
                + (metrics.cta_clicks ?? 0) * (storiesW?.cta_clicks_weight ?? 10);
            } else if (weights) {
              const mult = getMultiplier(post.content_type, multipliers);
              score = (
                metrics.likes * (weights.likes_weight ?? 1)
                + metrics.comments * (weights.comments_weight ?? 3)
                + metrics.shares * (weights.shares_weight ?? 5)
                + metrics.saves * (weights.saves_weight ?? 2)
                + metrics.views * (weights.views_weight ?? 0)
              ) * mult;
            }

            await supabase.from('posts').update({
              likes: metrics.likes,
              comments: metrics.comments,
              shares: metrics.shares,
              saves: metrics.saves,
              views: metrics.views,
              score,
            }).eq('id', post.id);

            return true;
          } catch (e) {
            console.error(`Failed to scrape post ${post.id}:`, e);
            return false;
          }
        })
      );

      results.forEach(r => {
        if (r.status === 'fulfilled' && r.value) updated++;
        else failed++;
      });

      // Small delay between batches to be nice to SociaVault
      if (i + BATCH_SIZE < posts.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // Update log
    if (logId) {
      await supabase.from('scrape_logs').update({
        finished_at: new Date().toISOString(),
        posts_total: posts.length,
        posts_updated: updated,
        posts_failed: failed,
        status: 'done',
      }).eq('id', logId);
    }

    return jsonResponse({
      success: true,
      posts_total: posts.length,
      posts_updated: updated,
      posts_failed: failed,
    });

  } catch (error) {
    console.error('Batch scrape error:', error);
    if (logId) {
      await supabase.from('scrape_logs').update({
        finished_at: new Date().toISOString(),
        status: 'error',
      }).eq('id', logId);
    }
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

// ─── Scrape a single post ─────────────────────────────────────────────────────

async function scrapeOne(url: string, platform: string, apiKey: string) {
  const headers = { 'x-api-key': apiKey, 'Content-Type': 'application/json' };

  if (platform === 'instagram') {
    const res = await fetch(
      `https://api.sociavault.com/v1/scrape/instagram/post-info?url=${encodeURIComponent(url)}&trim=true`,
      { method: 'GET', headers }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const media = json?.data?.data?.xdt_shortcode_media ?? json?.data?.xdt_shortcode_media;
    if (!media) return null;
    return {
      likes: media.edge_media_preview_like?.count ?? media.like_count ?? 0,
      comments: media.edge_media_to_parent_comment?.count ?? media.comment_count ?? 0,
      shares: 0,
      saves: 0,
      views: media.video_play_count ?? media.video_view_count ?? 0,
      views_pico: 0, interactions: 0, forwards: 0, cta_clicks: 0,
    };
  }

  if (platform === 'tiktok') {
    const res = await fetch(
      `https://api.sociavault.com/v1/scrape/tiktok/video-info?url=${encodeURIComponent(url)}`,
      { method: 'GET', headers }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const detail = json?.data?.aweme_detail;
    if (!detail) return null;
    const stats = detail.statistics ?? {};
    return {
      likes: stats.digg_count ?? 0,
      comments: stats.comment_count ?? 0,
      shares: stats.share_count ?? 0,
      saves: stats.collect_count ?? 0,
      views: stats.play_count ?? 0,
      views_pico: 0, interactions: 0, forwards: 0, cta_clicks: 0,
    };
  }

  return null;
}

function getMultiplier(contentType: string | null, multipliers: any): number {
  if (!contentType || !multipliers) return 1.0;
  if (contentType === 'technical') return multipliers.technical ?? 1.0;
  if (contentType === 'meme') return multipliers.meme ?? 1.0;
  if (contentType === 'announcement') return multipliers.announcement ?? 1.0;
  return 1.0;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
