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
    } else if (platform === 'twitter') {
      result = await scrapeTwitter(url, headers);
    } else if (platform === 'reddit') {
      result = await scrapeReddit(url, headers);
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

function normalizeYouTubeUrl(url: string): string {
  try {
    const u = new URL(url);
    // youtu.be/ID
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/watch?v=${u.pathname.slice(1).split('/')[0]}`;
    }
    // youtube.com/live/ID or youtube.com/shorts/ID
    const liveMatch = u.pathname.match(/^\/(live|shorts)\/([^/?]+)/);
    if (liveMatch) {
      return `https://www.youtube.com/watch?v=${liveMatch[2]}`;
    }
    // youtube.com/watch?v=ID (already correct)
    if (u.searchParams.get('v')) {
      return `https://www.youtube.com/watch?v=${u.searchParams.get('v')}`;
    }
    // youtube.com/embed/ID
    const embedMatch = u.pathname.match(/^\/embed\/([^/?]+)/);
    if (embedMatch) {
      return `https://www.youtube.com/watch?v=${embedMatch[1]}`;
    }
  } catch {}
  return url;
}

async function scrapeYouTube(url: string, headers: Record<string, string>): Promise<ScrapeResult> {
  const normalizedUrl = normalizeYouTubeUrl(url);
  
  // Try multiple endpoint patterns
  const endpoints = [
    `https://api.sociavault.com/v1/scrape/youtube/video?url=${encodeURIComponent(normalizedUrl)}`,
    `https://api.sociavault.com/youtube/video?url=${encodeURIComponent(normalizedUrl)}`,
    `https://api.sociavault.com/v1/youtube/video?url=${encodeURIComponent(normalizedUrl)}`,
  ];

  for (const apiUrl of endpoints) {
    console.log('Trying YouTube endpoint:', apiUrl);
    const response = await fetch(apiUrl, { method: 'GET', headers });
    
    if (response.status === 404) {
      console.log('Got 404, trying next endpoint...');
      continue;
    }

    if (!response.ok) {
      const text = await response.text();
      console.error('SociaVault YouTube error:', response.status, text);
      return manualFallback(`SociaVault retornou status ${response.status}`);
    }

    const json = await response.json();
    const data = json?.data ?? json;

    if (!data?.id && !data?.title) {
      console.error('YouTube: unexpected response structure', JSON.stringify(json).slice(0, 500));
      continue;
    }

    return {
      success: true,
      scraped: true,
      likes: data.likeCountInt ?? data.like_count ?? 0,
      comments: data.commentCountInt ?? data.comment_count ?? 0,
      shares: 0,
      saves: 0,
      views: data.viewCountInt ?? data.view_count ?? 0,
      title: (data.title || '').slice(0, 200) || null,
      thumbnail_url: data.thumbnail ?? null,
    };
  }

  return manualFallback('Nenhum endpoint do YouTube retornou dados. Preencha manualmente.');
}

// ─── Twitter / X ─────────────────────────────────────────────────────────────

async function scrapeTwitter(url: string, headers: Record<string, string>): Promise<ScrapeResult> {
  const apiUrl = `https://api.sociavault.com/v1/scrape/twitter/tweet?url=${encodeURIComponent(url)}`;

  console.log('Scraping Twitter:', url);
  const response = await fetch(apiUrl, { method: 'GET', headers });

  if (!response.ok) {
    const text = await response.text();
    console.error('SociaVault Twitter error:', response.status, text);
    return manualFallback(`SociaVault retornou status ${response.status}`);
  }

  const json = await response.json();
  const tweet = json?.data ?? null;

  if (!tweet) {
    console.error('Twitter: unexpected response structure', JSON.stringify(json).slice(0, 500));
    return manualFallback('Resposta inesperada da API do Twitter');
  }

  const legacy = tweet.legacy ?? tweet;
  const views = tweet.views?.count ?? tweet.view_count ?? 0;

  return {
    success: true,
    scraped: true,
    likes: legacy.favorite_count ?? 0,
    comments: legacy.reply_count ?? 0,
    shares: (legacy.retweet_count ?? 0) + (legacy.quote_count ?? 0),
    saves: legacy.bookmark_count ?? 0,
    views: typeof views === 'string' ? parseInt(views, 10) || 0 : views,
    title: (legacy.full_text || '').slice(0, 200) || null,
    thumbnail_url: null,
  };
}

// ─── Reddit ──────────────────────────────────────────────────────────────────

async function scrapeReddit(url: string, headers: Record<string, string>): Promise<ScrapeResult> {
  // Use post-comments endpoint which also returns post data
  const apiUrl = `https://api.sociavault.com/v1/scrape/reddit/post/comments?url=${encodeURIComponent(url)}&trim=true`;

  console.log('Scraping Reddit:', url);
  const response = await fetch(apiUrl, { method: 'GET', headers });

  if (!response.ok) {
    const text = await response.text();
    console.error('SociaVault Reddit error:', response.status, text);
    return manualFallback(`SociaVault retornou status ${response.status}`);
  }

  const json = await response.json();
  const post = json?.data?.post ?? null;

  if (!post) {
    console.error('Reddit: unexpected response structure', JSON.stringify(json).slice(0, 500));
    return manualFallback('Resposta inesperada da API do Reddit');
  }

  return {
    success: true,
    scraped: true,
    likes: post.ups ?? post.score ?? 0,
    comments: post.num_comments ?? 0,
    shares: 0,
    saves: 0,
    views: 0,
    title: (post.title || '').slice(0, 200) || null,
    thumbnail_url: post.thumbnail && post.thumbnail !== 'self' && post.thumbnail !== 'default'
      ? post.thumbnail
      : null,
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
