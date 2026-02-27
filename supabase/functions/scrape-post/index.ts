const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ success: false, error: 'URL obrigatória' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: 'Firecrawl não configurado' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Scraping:', url);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        onlyMainContent: false,
        waitFor: 3000,
      }),
    });

    const data = await response.json();
    console.log('Firecrawl response status:', response.status);

    if (!response.ok) {
      console.error('Firecrawl error:', data);
      // Retorna 200 com scraped=false para o frontend exibir formulário manual
      return new Response(JSON.stringify({
        success: true,
        scraped: false,
        likes: 0, comments: 0, shares: 0, saves: 0,
        title: null, thumbnail_url: null,
        scrape_error: data.error || `Status ${response.status}`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const content = data.data?.markdown || data.markdown || '';
    const html = data.data?.html || data.html || '';
    const metadata = data.data?.metadata || data.metadata || {};

    // Extrair métricas do conteúdo
    const metrics = extractMetrics(content, html, url);

    return new Response(JSON.stringify({
      success: true,
      title: metadata.title || metadata.ogTitle || null,
      thumbnail_url: metadata.ogImage || null,
      ...metrics,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractMetrics(markdown: string, _html: string, url: string) {
  const text = markdown.toLowerCase();

  // Padrões para extrair números de engajamento
  const patterns = {
    likes: [
      /(\d[\d,\.k]*)\s*(?:curtidas?|likes?|❤️|👍)/i,
      /(?:curtidas?|likes?)[:\s]+(\d[\d,\.k]*)/i,
    ],
    comments: [
      /(\d[\d,\.k]*)\s*(?:comentários?|comments?|💬)/i,
      /(?:comentários?|comments?)[:\s]+(\d[\d,\.k]*)/i,
    ],
    shares: [
      /(\d[\d,\.k]*)\s*(?:compartilhamentos?|shares?|retweets?)/i,
      /(?:compartilhamentos?|shares?)[:\s]+(\d[\d,\.k]*)/i,
    ],
    saves: [
      /(\d[\d,\.k]*)\s*(?:salvamentos?|saves?|bookmarks?|🔖)/i,
      /(?:salvamentos?|saves?)[:\s]+(\d[\d,\.k]*)/i,
    ],
  };

  const result = { likes: 0, comments: 0, shares: 0, saves: 0 };

  for (const [key, patternList] of Object.entries(patterns)) {
    for (const pattern of patternList) {
      const match = text.match(pattern);
      if (match) {
        result[key as keyof typeof result] = parseEngagementNumber(match[1]);
        break;
      }
    }
  }

  // Se o scraping não encontrou nada, retornar zeros com flag de manual
  const found = Object.values(result).some(v => v > 0);
  return { ...result, scraped: found };
}

function parseEngagementNumber(str: string): number {
  if (!str) return 0;
  const clean = str.replace(/,/g, '').trim();
  if (clean.toLowerCase().endsWith('k')) {
    return Math.round(parseFloat(clean) * 1000);
  }
  if (clean.toLowerCase().endsWith('m')) {
    return Math.round(parseFloat(clean) * 1000000);
  }
  return parseInt(clean) || 0;
}
