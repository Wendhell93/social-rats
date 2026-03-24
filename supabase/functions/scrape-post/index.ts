const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ScrapeResult {
  success: boolean;
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, platform } = await req.json();

    if (!url) {
      return jsonResponse({ success: false, error: 'URL obrigatória' }, 400);
    }

    const apiKey = Deno.env.get('SOCIAVAULT_API_KEY');
    if (!apiKey) {
      console.error('SOCIAVAULT_API_KEY not configured');
      return jsonResponse(manualFallback('SociaVault API key não configurada. Configure o secret SOCIAVAULT_API_KEY.'));
    }

    const headers = {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    };

    let result: ScrapeResult;

    if (platform === 'instagram') {
      result = await scrapeInstagram(url, headers);
    } else if (platform === 'tiktok') {
      result = await scrapeTikTok(url, headers);
    } else if (platform === 'youtube') {
      result = await scrapeYouTube(url, headers);
    } else {
      return jsonResponse(manualFallback(`Scraping não suportado para "${platform}". Preencha manualmente.`));
    }

    return jsonResponse(result);
  } catch (error) {
    console.error('Error:', error);
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    return jsonResponse(manualFallback(msg));
  }
});

// ─── Instagram ────────────────────────────────────────────────────────────────

async function scrapeInstagram(url: string, headers: Record<string, string>): Promise<ScrapeResult> {
  const apiUrl = `https://api.sociavault.com/v1/scrape/instagram/post-info?url=${encodeURIComponent(url)}&trim=true`;

  console.log('Scraping Instagram:', url);
  const response = await fetch(apiUrl, { method: 'GET', headers });

  if (!response.ok) {
    const text = await response.text();
    console.error('SociaVault Instagram error:', response.status, text);
    return manualFallback(`SociaVault retornou status ${response.status}`);
  }

  const json = await response.json();

  const media = json?.data?.data?.xdt_shortcode_media
    ?? json?.data?.xdt_shortcode_media
    ?? null;

  if (!media) {
    console.error('Instagram: unexpected response structure', JSON.stringify(json).slice(0, 500));
    return manualFallback('Resposta inesperada da API do Instagram');
  }

  const likes = media.edge_media_preview_like?.count ?? media.like_count ?? 0;
  const comments = media.edge_media_to_parent_comment?.count ?? media.comment_count ?? 0;
  const shares = 0;
  const saves = 0;
  const views = media.video_play_count ?? media.video_view_count ?? 0;

  const caption = media.edge_media_to_caption?.edges?.[0]?.node?.text
    ?? media.edge_media_to_caption?.edges?.["0"]?.node?.text
    ?? null;

  const thumbnail = media.display_url ?? media.thumbnail_src ?? null;

  return {
    success: true,
    scraped: true,
    likes,
    comments,
    shares,
    saves,
    views,
    title: caption ? caption.slice(0, 200) : null,
    thumbnail_url: thumbnail,
  };
}

// ─── TikTok ───────────────────────────────────────────────────────────────────

async function scrapeTikTok(url: string, headers: Record<string, string>): Promise<ScrapeResult> {
  const apiUrl = `https://api.sociavault.com/v1/scrape/tiktok/video-info?url=${encodeURIComponent(url)}`;

  console.log('Scraping TikTok:', url);
  const response = await fetch(apiUrl, { method: 'GET', headers });

  if (!response.ok) {
    const text = await response.text();
    console.error('SociaVault TikTok error:', response.status, text);
    return manualFallback(`SociaVault retornou status ${response.status}`);
  }

  const json = await response.json();
  const detail = json?.data?.aweme_detail ?? null;

  if (!detail) {
    console.error('TikTok: unexpected response structure', JSON.stringify(json).slice(0, 500));
    return manualFallback('Resposta inesperada da API do TikTok');
  }

  const stats = detail.statistics ?? {};

  return {
    success: true,
    scraped: true,
    likes: stats.digg_count ?? 0,
    comments: stats.comment_count ?? 0,
    shares: stats.share_count ?? 0,
    saves: stats.collect_count ?? 0,
    views: stats.play_count ?? 0,
    title: detail.desc ? detail.desc.slice(0, 200) : null,
    thumbnail_url: detail.video?.cover?.url_list?.[0]
      ?? detail.video?.origin_cover?.url_list?.[0]
      ?? null,
  };
}

// ─── YouTube ──────────────────────────────────────────────────────────────────

async function scrapeYouTube(url: string, headers: Record<string, string>): Promise<ScrapeResult> {
  const apiUrl = `https://api.sociavault.com/youtube/video?url=${encodeURIComponent(url)}`;

  console.log('Scraping YouTube:', url);
  const response = await fetch(apiUrl, { method: 'GET', headers });

  if (!response.ok) {
    const text = await response.text();
    console.error('SociaVault YouTube error:', response.status, text);
    return manualFallback(`SociaVault retornou status ${response.status}`);
  }

  const json = await response.json();
  const data = json?.data ?? json;

  if (!data?.id) {
    console.error('YouTube: unexpected response structure', JSON.stringify(json).slice(0, 500));
    return manualFallback('Resposta inesperada da API do YouTube');
  }

  return {
    success: true,
    scraped: true,
    likes: data.likeCountInt ?? 0,
    comments: data.commentCountInt ?? 0,
    shares: 0,
    saves: 0,
    views: data.viewCountInt ?? 0,
    title: data.title ? data.title.slice(0, 200) : null,
    thumbnail_url: data.thumbnail ?? null,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function manualFallback(scrape_error: string): ScrapeResult {
  return {
    success: true,
    scraped: false,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    views: 0,
    title: null,
    thumbnail_url: null,
    scrape_error,
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
