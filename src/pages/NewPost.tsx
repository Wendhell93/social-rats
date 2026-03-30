import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  detectPlatform, detectMediaType, calcScore, getMultiplier,
  EngagementWeights, Creator, MediaType
} from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformBadge } from "@/components/PlatformBadge";
import { useToast } from "@/hooks/use-toast";
import {
  Heart, MessageCircle, Share2, Bookmark, Loader2, CalendarIcon,
  Plus, X, ArrowLeft, Eye, Wand2, CheckCircle, AlertTriangle,
  ChevronRight, ChevronLeft, Send
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
import { useMediaMultipliers } from "@/hooks/use-media-multipliers";
import { MediaTypeBadge } from "@/components/MediaTypeBadge";
import { WizardProgress } from "@/components/wizard/WizardProgress";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";
import { hapticMedium } from "@/lib/haptics";

const STEPS = 4;
const STEP_LABELS = ["Link", "Criador", "Dados", "Enviar"];

export default function NewPost() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, isAdmin } = useAuth();
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [selectedCreators, setSelectedCreators] = useState<Creator[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [weights, setWeights] = useState<EngagementWeights | null>(null);
  const { types: contentTypes, multipliersMap } = useContentTypes();
  const { getMediaMultiplier } = useMediaMultipliers();
  const [saving, setSaving] = useState(false);
  const [metrics, setMetrics] = useState({ likes: 0, comments: 0, shares: 0, saves: 0, views: 0 });
  const [postedAt, setPostedAt] = useState<Date | undefined>(undefined);
  const [creatorSearch, setCreatorSearch] = useState("");
  const [contentType, setContentType] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>("static");
  const [scraping, setScraping] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState<"idle" | "success" | "manual">("idle");
  const [duplicateInfo, setDuplicateInfo] = useState<{ creator: string; date: string } | null>(null);
  const [celebration, setCelebration] = useState<{ type: "post-created" | "voucher-earned"; message: string; subMessage?: string } | null>(null);

  const platform = detectPlatform(url);
  const detectedMediaType = detectMediaType(url, platform);

  useEffect(() => {
    setScrapeStatus("idle");
    setDuplicateInfo(null);
    const p = detectPlatform(url);
    setMediaType(detectMediaType(url, p));
    if (!url.trim() || !p) return;
    const normalized = url.trim().split("?")[0].replace(/\/$/, "");
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("posts")
        .select("id, created_at, post_creators(creator:members(name))")
        .or(`url.eq.${url.trim()},url.ilike.%${normalized}%`)
        .limit(1);
      if (data && data.length > 0) {
        const dup = data[0] as any;
        const names = dup.post_creators?.map((pc: any) => pc.creator?.name).filter(Boolean).join(", ") || "Desconhecido";
        const date = dup.created_at ? new Date(dup.created_at).toLocaleDateString("pt-BR") : "";
        setDuplicateInfo({ creator: names, date });
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [url]);

  useEffect(() => {
    async function load() {
      const [{ data: m }, { data: w }] = await Promise.all([
        supabase.from("members").select("*").order("name"),
        supabase.from("engagement_weights").select("*").limit(1).single(),
      ]);
      if (m) {
        setCreators(m);
        if (profile) {
          const me = m.find((c: Creator) => c.id === profile.id);
          if (me) setSelectedCreators([me]);
        }
      }
      if (w) setWeights(w);
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
          likes: data.likes ?? 0, comments: data.comments ?? 0,
          shares: data.shares ?? 0, saves: data.saves ?? 0, views: data.views ?? 0,
        });
        if (data.title && !title.trim()) setTitle(data.title);
        setScrapeStatus("success");
        toast({ title: "Métricas importadas!", description: "Confira os valores e ajuste se necessário." });
      } else {
        setScrapeStatus("manual");
        toast({ title: "Scraping não retornou métricas", description: data.scrape_error || "Preencha manualmente.", variant: "destructive" });
      }
    } catch (err: any) {
      setScrapeStatus("manual");
      toast({ title: "Erro ao buscar métricas", description: err?.message || "Preencha manualmente.", variant: "destructive" });
    } finally { setScraping(false); }
  }

  async function handleSave() {
    if (selectedCreators.length === 0) { toast({ title: "Selecione ao menos um criador", variant: "destructive" }); return; }
    if (!platform) { toast({ title: "URL inválida", variant: "destructive" }); return; }

    const normalizedUrl = url.trim().split("?")[0].replace(/\/$/, "");
    const { data: existing } = await supabase
      .from("posts")
      .select("id, url, created_at, post_creators(creator:members(name))")
      .or(`url.eq.${url.trim()},url.ilike.%${normalizedUrl}%`)
      .limit(1);

    if (existing && existing.length > 0) {
      const dup = existing[0] as any;
      const creatorNames = dup.post_creators?.map((pc: any) => pc.creator?.name).filter(Boolean).join(", ") || "—";
      const date = dup.created_at ? new Date(dup.created_at).toLocaleDateString("pt-BR") : "";
      toast({ title: "Conteúdo já cadastrado!", description: `Registrado por ${creatorNames} em ${date}.`, variant: "destructive", duration: 8000 });
      return;
    }

    setSaving(true);
    const mult = getMultiplier(contentType, multipliersMap);
    const mediaMult = getMediaMultiplier(mediaType);
    const score = weights ? calcScore(metrics, weights, mult, mediaMult) : 0;

    const { data: post, error } = await supabase.from("posts").insert({
      member_id: selectedCreators[0].id, url, platform,
      title: title.trim() || null, thumbnail_url: null,
      format: "feed", media_type: mediaType,
      ...metrics, views_pico: 0, interactions: 0, forwards: 0, cta_clicks: 0,
      score, content_type: contentType,
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
      setSaving(false);
      return;
    }

    let voucherCount = 0;
    try {
      const { generateVouchersForPost } = await import("@/lib/raffleVouchers");
      voucherCount = await generateVouchersForPost(
        post.id, selectedCreators.map(c => c.id),
        postedAt ? postedAt.toISOString() : new Date().toISOString()
      ) || 0;
    } catch { /* silent */ }

    setSaving(false);

    // Show celebration!
    if (voucherCount > 0) {
      setCelebration({
        type: "voucher-earned",
        message: "Mandou bem!",
        subMessage: `Post cadastrado + ${voucherCount} voucher${voucherCount > 1 ? "s" : ""} para sorteio!`,
      });
    } else {
      setCelebration({
        type: "post-created",
        message: "Post cadastrado!",
        subMessage: `${score > 0 ? score.toFixed(0) + " pontos" : "Métricas serão atualizadas em breve"}`,
      });
    }
  }

  const mult = getMultiplier(contentType, multipliersMap);
  const mediaMult = getMediaMultiplier(mediaType);
  const previewScore = weights ? calcScore(metrics, weights, mult, mediaMult) : 0;

  const filteredCreators = creators.filter(c =>
    c.name.toLowerCase().includes(creatorSearch.toLowerCase()) &&
    !selectedCreators.find(sc => sc.id === c.id)
  );

  // Step validation
  const canNext: Record<number, boolean> = {
    1: !!platform && !duplicateInfo,
    2: selectedCreators.length > 0,
    3: true,
    4: !saving,
  };

  function goNext() {
    if (step < STEPS && canNext[step]) {
      hapticMedium();
      setStep(step + 1);
    }
  }
  function goBack() {
    if (step > 1) { hapticMedium(); setStep(step - 1); }
    else navigate(-1);
  }

  // ── Celebration overlay ──
  if (celebration) {
    return <CelebrationOverlay {...celebration} onComplete={() => navigate("/posts")} />;
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto animate-fade-in">
      <button onClick={goBack} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> {step === 1 ? "Voltar" : "Voltar"}
      </button>

      <WizardProgress currentStep={step} totalSteps={STEPS} labels={STEP_LABELS} />

      {/* ── STEP 1: URL ── */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <div className="text-center mb-2">
            <h1 className="text-xl md:text-2xl font-bold">Cole o link do post</h1>
            <p className="text-muted-foreground text-sm mt-1">Instagram, TikTok, YouTube, Twitter/X ou Reddit</p>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="pt-5 space-y-3">
              <Input
                placeholder="https://www.instagram.com/p/..."
                value={url} onChange={e => setUrl(e.target.value)}
                className="bg-input border-border text-base h-12"
                autoFocus
              />
              {platform && (
                <div className="flex items-center gap-2 flex-wrap">
                  <PlatformBadge platform={platform} />
                  <MediaTypeBadge mediaType={detectedMediaType} />
                  {isAdmin && (
                    <Button
                      type="button" size="sm"
                      variant={scrapeStatus === "success" ? "outline" : "default"}
                      className={cn(
                        "text-xs gap-1.5",
                        scrapeStatus === "idle" && "gradient-primary text-white border-0 glow-blue",
                        scrapeStatus === "success" && "border-green-500/30 text-green-400"
                      )}
                      disabled={scraping}
                      onClick={handleScrape}
                    >
                      {scraping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                       scrapeStatus === "success" ? <CheckCircle className="w-3.5 h-3.5" /> :
                       <Wand2 className="w-3.5 h-3.5" />}
                      {scraping ? "Buscando..." : scrapeStatus === "success" ? "Importado!" : "Buscar métricas"}
                    </Button>
                  )}
                  {isAdmin && scrapeStatus === "manual" && (
                    <span className="text-xs text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Preencha manualmente
                    </span>
                  )}
                </div>
              )}
              {url && !platform && <p className="text-xs text-destructive">URL não reconhecida.</p>}
              {duplicateInfo && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Conteúdo já cadastrado</p>
                    <p className="text-xs text-destructive/80">
                      Por <strong>{duplicateInfo.creator}</strong> em {duplicateInfo.date}.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── STEP 2: Creators + Content Type ── */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <div className="text-center mb-2">
            <h1 className="text-xl md:text-2xl font-bold">Quem criou?</h1>
            <p className="text-muted-foreground text-sm mt-1">Selecione os criadores e o tipo de conteúdo</p>
          </div>

          {/* Criadores */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-base">Criadores *</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {selectedCreators.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedCreators.map(c => (
                    <span key={c.id} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/15 border border-primary/20 text-sm text-primary">
                      {c.name}
                      <button onClick={() => toggleCreator(c)} className="hover:text-foreground"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
              <Input placeholder="Buscar criador..." value={creatorSearch} onChange={e => setCreatorSearch(e.target.value)} className="bg-input border-border text-sm" />
              {creators.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum criador cadastrado.</p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-0.5 rounded-lg border border-border p-1">
                  {filteredCreators.map(c => (
                    <button key={c.id} onClick={() => toggleCreator(c)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm hover:bg-muted/50 transition-colors text-left min-h-[44px]">
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

          {/* Media Type */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-base">Tipo de Mídia</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {(["static", "video"] as MediaType[]).map(mt => (
                  <button key={mt} type="button" onClick={() => setMediaType(mt)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-sm transition-all min-h-[56px]",
                      mediaType === mt ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border bg-card text-muted-foreground hover:border-primary/40"
                    )}>
                    <span className="text-lg leading-none">{mt === "video" ? "🎬" : "📷"}</span>
                    <span className="text-xs font-medium">{mt === "video" ? "Vídeo" : "Estático"}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Content Type */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-base">Tipo de Conteúdo</CardTitle></CardHeader>
            <CardContent>
              <ContentTypePicker value={contentType} onChange={setContentType} types={contentTypes} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── STEP 3: Date + Metrics ── */}
      {step === 3 && (
        <div className="space-y-4 animate-fade-in">
          <div className="text-center mb-2">
            <h1 className="text-xl md:text-2xl font-bold">Dados do post</h1>
            <p className="text-muted-foreground text-sm mt-1">Data e métricas de engajamento</p>
          </div>

          {/* Date */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-base">Data de Publicação</CardTitle></CardHeader>
            <CardContent>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal border-border bg-input min-h-[44px]", !postedAt && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {postedAt ? format(postedAt, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border" align="start" side="top">
                  <Calendar mode="single" selected={postedAt} onSelect={setPostedAt} disabled={d => d > new Date()} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          {/* Metrics */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-base">Métricas</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "likes", label: "Curtidas", icon: Heart },
                  { key: "comments", label: "Comentários", icon: MessageCircle },
                  { key: "shares", label: "Compartilh.", icon: Share2 },
                  { key: "saves", label: "Salvamentos", icon: Bookmark },
                  { key: "views", label: "Visualizações", icon: Eye },
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key}>
                    <Label className="flex items-center gap-1.5 mb-1.5 text-xs">
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
              {/* Score preview */}
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Score</span>
                <span className="text-2xl font-bold gradient-text">{previewScore.toFixed(0)} pts</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── STEP 4: Review + Submit ── */}
      {step === 4 && (
        <div className="space-y-4 animate-fade-in">
          <div className="text-center mb-2">
            <h1 className="text-xl md:text-2xl font-bold">Tudo certo?</h1>
            <p className="text-muted-foreground text-sm mt-1">Revise e cadastre o post</p>
          </div>

          {/* Title (optional) */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-base">Título (opcional)</CardTitle></CardHeader>
            <CardContent>
              <Input placeholder="Descrição curta do post" value={title} onChange={e => setTitle(e.target.value)} className="bg-input border-border" />
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-card border-border">
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                {platform && <PlatformBadge platform={platform} />}
                <MediaTypeBadge mediaType={mediaType} />
                {contentType && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {contentTypes.find(t => t.key === contentType)?.label || contentType}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{url}</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedCreators.map(c => (
                  <span key={c.id} className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary">{c.name}</span>
                ))}
              </div>
              {postedAt && <p className="text-xs text-muted-foreground">Publicado em {format(postedAt, "dd/MM/yyyy", { locale: ptBR })}</p>}
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/40">
                <span>❤️ {metrics.likes}</span>
                <span>💬 {metrics.comments}</span>
                <span>🔁 {metrics.shares}</span>
                <span>🔖 {metrics.saves}</span>
                <span>👁 {metrics.views}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <span className="text-sm font-medium">Score total</span>
                <span className="text-xl font-bold gradient-text">{previewScore.toFixed(0)} pts</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Navigation buttons ── */}
      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <Button variant="outline" className="border-border min-h-[44px]" onClick={goBack}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
        )}
        {step < STEPS && (
          <Button
            className="flex-1 gradient-primary text-white border-0 glow-blue min-h-[44px]"
            disabled={!canNext[step]}
            onClick={goNext}
          >
            Próximo <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
        {step === STEPS && (
          <Button
            className="flex-1 gradient-primary text-white border-0 glow-blue min-h-[48px] text-base"
            disabled={saving || selectedCreators.length === 0 || !!duplicateInfo}
            onClick={handleSave}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            {saving ? "Cadastrando..." : "Cadastrar Post"}
          </Button>
        )}
      </div>
    </div>
  );
}
