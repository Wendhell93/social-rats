import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  detectPlatform, calcScore, calcScoreStories, getMultiplier,
  EngagementWeights, StoriesWeights, Creator, PostFormat
} from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformBadge } from "@/components/PlatformBadge";
import { FormatBadge } from "@/components/FormatBadge";
import { useToast } from "@/hooks/use-toast";
import {
  Heart, MessageCircle, Share2, Bookmark, Loader2, CalendarIcon,
  Plus, X, ArrowLeft, Eye, Send, MousePointerClick, Repeat2, Info, Wand2, CheckCircle, AlertTriangle
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ContentTypePicker } from "@/components/ContentTypePicker";
import { scrapePost } from "@/lib/scrape";
import { useAuth } from "@/contexts/AuthContext";
import { useContentTypes } from "@/hooks/use-content-types";

export default function NewPost() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, isAdmin } = useAuth();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [postFormat, setPostFormat] = useState<PostFormat>("feed");
  const [selectedCreators, setSelectedCreators] = useState<Creator[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [weights, setWeights] = useState<EngagementWeights | null>(null);
  const { types: contentTypes, multipliersMap } = useContentTypes();
  const [storiesWeights, setStoriesWeights] = useState<StoriesWeights | null>(null);
  const [saving, setSaving] = useState(false);
  // Feed metrics
  const [metrics, setMetrics] = useState({ likes: 0, comments: 0, shares: 0, saves: 0, views: 0 });
  // Stories metrics
  const [storiesMetrics, setStoriesMetrics] = useState({ views_pico: 0, interactions: 0, forwards: 0, cta_clicks: 0 });
  const [postedAt, setPostedAt] = useState<Date | undefined>(undefined);
  const [creatorSearch, setCreatorSearch] = useState("");
  const [contentType, setContentType] = useState<string | null>(null);
  const [scraping, setScraping] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState<"idle" | "success" | "manual">("idle");

  const platform = detectPlatform(url);
  const showForm = !!platform;

  // Reset scrape status when URL changes
  useEffect(() => {
    setScrapeStatus("idle");
  }, [url]);

  useEffect(() => {
    async function load() {
      const [{ data: m }, { data: w }, { data: sw }] = await Promise.all([
        supabase.from("members").select("*").order("name"),
        supabase.from("engagement_weights").select("*").limit(1).single(),
        (supabase as any).from("stories_weights").select("*").limit(1).single(),
      ]);
      if (m) {
        setCreators(m);
        if (profile) {
          const me = m.find((c: Creator) => c.id === profile.id);
          if (me) setSelectedCreators([me]);
        }
      }
      if (w) setWeights(w);
      if (sw) setStoriesWeights(sw as StoriesWeights);
    }
    load();
  }, [profile]);

  function toggleCreator(creator: Creator) {
    setSelectedCreators(prev =>
      prev.find(c => c.id === creator.id) ? prev.filter(c => c.id !== creator.id) : [...prev, creator]
    );
  }

  async function handleScrape() {
    if (!platform || !url) return;
    setScraping(true);
    setScrapeStatus("idle");
    try {
      const data = await scrapePost(url, platform);
      if (data.scraped) {
        setMetrics({
          likes: data.likes ?? 0,
          comments: data.comments ?? 0,
          shares: data.shares ?? 0,
          saves: data.saves ?? 0,
          views: data.views ?? 0,
        });
        if (data.title && !title.trim()) {
          setTitle(data.title);
        }
        setScrapeStatus("success");
        toast({ title: "Métricas importadas!", description: "Confira os valores e ajuste se necessário." });
      } else {
        setScrapeStatus("manual");
        toast({
          title: "Scraping não retornou métricas",
          description: data.scrape_error || "Preencha os valores manualmente.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Scrape error:", err);
      setScrapeStatus("manual");
      toast({
        title: "Erro ao buscar métricas",
        description: err?.message || "Preencha manualmente.",
        variant: "destructive",
      });
    } finally {
      setScraping(false);
    }
  }

  async function handleSave() {
    if (selectedCreators.length === 0) { toast({ title: "Selecione ao menos um criador", variant: "destructive" }); return; }
    if (!platform) { toast({ title: "URL inválida", variant: "destructive" }); return; }

    // Validate stories limit: max 10 per creator per day
    if (postFormat === "stories" && postedAt) {
      const dayStart = new Date(postedAt); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(postedAt); dayEnd.setHours(23, 59, 59, 999);
      for (const creator of selectedCreators) {
        const { count } = await supabase
          .from("post_creators")
          .select("id", { count: "exact", head: true })
          .eq("creator_id", creator.id)
          .in("post_id",
            (await supabase.from("posts")
              .select("id")
              .eq("format", "stories")
              .gte("posted_at", dayStart.toISOString())
              .lte("posted_at", dayEnd.toISOString())
            ).data?.map(p => p.id) ?? []
          );
        if ((count ?? 0) >= 10) {
          toast({
            title: `Limite atingido`,
            description: `${creator.name} já possui 10 stories cadastrados neste dia.`,
            variant: "destructive"
          });
          return;
        }
      }
    }

    setSaving(true);
    let score = 0;
    if (postFormat === "stories") {
      score = calcScoreStories(storiesMetrics, storiesWeights ?? undefined);
    } else {
      const mult = getMultiplier(contentType, multipliersMap);
      score = weights ? calcScore(metrics, weights, mult) : 0;
    }

    const { data: post, error } = await supabase.from("posts").insert({
      member_id: selectedCreators[0].id,
      url,
      platform,
      title: title.trim() || null,
      thumbnail_url: null,
      format: postFormat,
      ...(postFormat === "feed"
        ? { ...metrics, views_pico: 0, interactions: 0, forwards: 0, cta_clicks: 0 }
        : { likes: 0, comments: 0, shares: 0, saves: 0, views: 0, ...storiesMetrics }
      ),
      score,
      content_type: postFormat === "stories" ? null : contentType,
      posted_at: postedAt ? postedAt.toISOString() : null,
    } as any).select().single();

    if (error || !post) {
      toast({ title: "Erro ao salvar", description: error?.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    const { error: pcError } = await supabase.from("post_creators").insert(
      selectedCreators.map(c => ({ post_id: post.id, creator_id: c.id }))
    );

    if (pcError) {
      toast({ title: "Post salvo, mas erro ao vincular criadores", description: pcError.message, variant: "destructive" });
    } else {
      toast({ title: "Post cadastrado com sucesso!" });
      navigate("/posts");
    }
    setSaving(false);
  }

  const mult = getMultiplier(contentType, multipliersMap);
  const previewScore = postFormat === "stories"
    ? calcScoreStories(storiesMetrics, storiesWeights ?? undefined)
    : (weights ? calcScore(metrics, weights, mult) : 0);

  const filteredCreators = creators.filter(c =>
    c.name.toLowerCase().includes(creatorSearch.toLowerCase()) &&
    !selectedCreators.find(sc => sc.id === c.id)
  );

  return (
    <div className="p-8 max-w-2xl animate-fade-in">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">Cadastrar Conteúdo</h1>
        <p className="text-muted-foreground text-sm mt-1">Preencha os dados do post manualmente</p>
      </div>

      <div className="space-y-5">
        {/* URL */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-base">Link do Post *</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="https://www.instagram.com/p/... ou https://www.tiktok.com/@..."
              value={url} onChange={e => setUrl(e.target.value)}
              className="bg-input border-border"
            />
            {platform && (
              <div className="flex items-center gap-2 flex-wrap">
                <PlatformBadge platform={platform} />
                {isAdmin && (platform === "instagram" || platform === "tiktok" || platform === "youtube") && (
                  <Button
                    type="button"
                    size="sm"
                    variant={scrapeStatus === "success" ? "outline" : "default"}
                    className={cn(
                      "text-xs gap-1.5",
                      scrapeStatus === "idle" && "gradient-primary text-white border-0 glow-blue",
                      scrapeStatus === "success" && "border-green-500/30 text-green-400 hover:text-green-300"
                    )}
                    disabled={scraping}
                    onClick={handleScrape}
                  >
                    {scraping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                     scrapeStatus === "success" ? <CheckCircle className="w-3.5 h-3.5" /> :
                     <Wand2 className="w-3.5 h-3.5" />}
                    {scraping ? "Buscando..." : scrapeStatus === "success" ? "Importado! Buscar novamente" : "Buscar métricas"}
                  </Button>
                )}
                {isAdmin && scrapeStatus === "manual" && (
                  <span className="text-xs text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Preencha manualmente
                  </span>
                )}
              </div>
            )}
            {url && !platform && <p className="text-xs text-destructive">URL não reconhecida. Use links do Instagram, TikTok, YouTube, etc.</p>}
          </CardContent>
        </Card>

        {showForm && (
          <>
            {/* Formato */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3"><CardTitle className="text-base">Formato *</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {(["feed", "stories"] as PostFormat[]).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setPostFormat(f)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 rounded-xl border px-4 py-4 text-sm transition-all",
                        postFormat === f
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      <FormatBadge format={f} />
                      <span className="text-xs text-muted-foreground mt-1">
                        {f === "feed" ? "Foto, carrossel ou vídeo no perfil" : "Conteúdo efêmero de 24h"}
                      </span>
                    </button>
                  ))}
                </div>
                {postFormat === "stories" && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2.5 text-xs text-primary">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Regras Stories:</strong> views_pico = story com mais views do dia; máx. 10 stories elegíveis por criador/dia; fórmula fixa sem multiplicador de tipo.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Título */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3"><CardTitle className="text-base">Título do Post</CardTitle></CardHeader>
              <CardContent>
                <Input placeholder="Título ou descrição resumida (opcional)" value={title} onChange={e => setTitle(e.target.value)} className="bg-input border-border" />
              </CardContent>
            </Card>

            {/* Tipo de Conteúdo (Feed only) */}
            {postFormat === "feed" && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3"><CardTitle className="text-base">Tipo de Conteúdo</CardTitle></CardHeader>
                <CardContent>
                  <ContentTypePicker value={contentType} onChange={setContentType} types={contentTypes} />
                </CardContent>
              </Card>
            )}

            {/* Criadores */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3"><CardTitle className="text-base">Criadores *</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {selectedCreators.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedCreators.map(c => (
                      <span key={c.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/15 border border-primary/20 text-sm text-primary">
                        {c.name}
                        <button onClick={() => toggleCreator(c)} className="hover:text-foreground transition-colors"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
                <Input
                  placeholder="Buscar criador..."
                  value={creatorSearch}
                  onChange={e => setCreatorSearch(e.target.value)}
                  className="bg-input border-border text-sm"
                />
                {creators.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum criador cadastrado. <a href="/creators" className="text-primary underline">Cadastre um criador</a> primeiro.</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-border p-1">
                    {filteredCreators.map(c => (
                      <button
                        key={c.id}
                        onClick={() => toggleCreator(c)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted/50 transition-colors text-left"
                      >
                        <Plus className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="font-medium">{c.name}</span>
                        {c.role && <span className="text-muted-foreground text-xs">— {c.role}</span>}
                      </button>
                    ))}
                    {filteredCreators.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Nenhum resultado</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Data */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3"><CardTitle className="text-base">Data de Publicação</CardTitle></CardHeader>
              <CardContent>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal border-border bg-input", !postedAt && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {postedAt ? format(postedAt, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                    <Calendar mode="single" selected={postedAt} onSelect={setPostedAt} disabled={d => d > new Date()} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            {/* Métricas */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  Métricas de Engajamento
                  {postFormat === "feed" && weights && (
                    <span className="text-xs font-normal text-muted-foreground">
                      Score = {weights.likes_weight}×❤️ + {weights.comments_weight}×💬 + {weights.shares_weight}×🔁 + {weights.saves_weight}×🔖 + {weights.views_weight}×👁️
                    </span>
                  )}
                  {postFormat === "stories" && (
                    <span className="text-xs font-normal text-muted-foreground">
                      Score = views×0.25 + int×3 + enc×5 + cta×10
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {postFormat === "feed" ? (
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: "likes", label: "Curtidas", icon: Heart },
                      { key: "comments", label: "Comentários", icon: MessageCircle },
                      { key: "shares", label: "Compartilhamentos", icon: Share2 },
                      { key: "saves", label: "Salvamentos", icon: Bookmark },
                      { key: "views", label: "Visualizações", icon: Eye },
                    ].map(({ key, label, icon: Icon }) => (
                      <div key={key}>
                        <Label className="flex items-center gap-1.5 mb-1.5 text-sm">
                          <Icon className="w-3.5 h-3.5" /> {label}
                        </Label>
                        <Input
                          type="number" min={0} className="bg-input border-border"
                          value={metrics[key as keyof typeof metrics]}
                          onChange={e => setMetrics(m => ({ ...m, [key]: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: "views_pico", label: "Views Pico", icon: Eye, hint: "Maior nº de views de um único story do dia" },
                      { key: "interactions", label: "Interações", icon: MessageCircle, hint: "Respostas, enquetes, quizzes, etc." },
                      { key: "forwards", label: "Encaminhamentos", icon: Repeat2, hint: "Stories repassados para outros" },
                      { key: "cta_clicks", label: "Cliques no Link", icon: MousePointerClick, hint: "Cliques no link/CTA do story" },
                    ].map(({ key, label, icon: Icon, hint }) => (
                      <div key={key}>
                        <Label className="flex items-center gap-1.5 mb-1 text-sm">
                          <Icon className="w-3.5 h-3.5" /> {label}
                        </Label>
                        <p className="text-xs text-muted-foreground mb-1.5">{hint}</p>
                        <Input
                          type="number" min={0} className="bg-input border-border"
                          value={storiesMetrics[key as keyof typeof storiesMetrics]}
                          onChange={e => setStoriesMetrics(m => ({ ...m, [key]: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <div>
                    <span className="text-sm text-muted-foreground">Score calculado</span>
                    {postFormat === "feed" && contentType && mult !== 1.0 && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (×{mult} {contentTypes.find(t => t.key === contentType)?.label || contentType})
                      </span>
                    )}
                  </div>
                  <span className="text-2xl font-bold gradient-text">{previewScore.toFixed(0)} pts</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="border-border" onClick={() => navigate(-1)}>Cancelar</Button>
          {showForm && (
            <Button onClick={handleSave} disabled={saving || selectedCreators.length === 0} className="gradient-primary text-white border-0 glow-blue">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar Post
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
