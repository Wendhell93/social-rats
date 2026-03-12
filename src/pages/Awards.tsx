import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Member } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Gift,
  Plus,
  Pencil,
  Trash2,
  Trophy,
  Upload,
  CheckCircle,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Scroll,
} from "lucide-react";
import { EngagementWeights, StoriesWeights, ContentTypeMultipliers } from "@/lib/types";
import { parseISO, isWithinInterval, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Award {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

interface AwardPrize {
  id: string;
  award_id: string;
  placement: number;
  title: string;
  description: string | null;
  image_url: string | null;
  winner_member_id: string | null;
  created_at: string;
  winner?: Member | null;
}

interface PostCreatorRow {
  creator_id: string;
  post: { id: string; score: number; created_at: string; posted_at: string | null } | null;
}

interface RankingEntry {
  member: Member;
  totalScore: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const medals = ["🥇", "🥈", "🥉"];
const medalColors = [
  "text-yellow-400",
  "text-slate-400",
  "text-amber-600",
];

function placementLabel(n: number) {
  if (n === 1) return "🥇 1º Lugar";
  if (n === 2) return "🥈 2º Lugar";
  if (n === 3) return "🥉 3º Lugar";
  return `#${n}`;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

// ─── Prize Card ───────────────────────────────────────────────────────────────

function PrizeCard({
  prize,
  winner,
}: {
  prize: AwardPrize;
  winner?: RankingEntry | null;
}) {
  return (
    <Card className="flex flex-col overflow-hidden border-border/60">
      {/* Image */}
      <div className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden">
        {prize.image_url ? (
          <img
            src={prize.image_url}
            alt={prize.title}
            className="object-cover w-full h-full"
          />
        ) : (
          <Gift className="w-10 h-10 text-muted-foreground/40" />
        )}
        <Badge className="absolute top-2 left-2 text-xs font-bold bg-background/80 text-foreground border border-border/60 backdrop-blur-sm">
          {placementLabel(prize.placement)}
        </Badge>
      </div>

      <CardContent className="flex-1 p-4 space-y-2">
        <p className="font-semibold text-sm leading-snug">{prize.title}</p>
        {prize.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {prize.description}
          </p>
        )}

        {/* Live leader or past winner */}
        {winner && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/40 mt-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={winner.member.avatar_url || undefined} />
              <AvatarFallback className="text-[10px]">
                {winner.member.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{winner.member.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {winner.totalScore.toFixed(0)} pts
              </p>
            </div>
          </div>
        )}

        {/* Past winner stored */}
        {!winner && prize.winner && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/40 mt-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={prize.winner.avatar_url || undefined} />
              <AvatarFallback className="text-[10px]">
                {prize.winner.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{prize.winner.name}</p>
              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                Vencedor
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Prize Form Row ───────────────────────────────────────────────────────────

interface PrizeFormItem {
  id?: string;
  placement: number;
  title: string;
  description: string;
  image_url: string;
  imageFile?: File | null;
}

function PrizeFormRow({
  prize,
  onChange,
  onRemove,
}: {
  prize: PrizeFormItem;
  onChange: (p: PrizeFormItem) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange({ ...prize, imageFile: file, image_url: URL.createObjectURL(file) });
  }

  return (
    <div className="border border-border/60 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {placementLabel(prize.placement)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={onRemove}
          type="button"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Image preview + upload */}
      <div
        className="relative aspect-square bg-muted rounded-md overflow-hidden flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        {prize.image_url ? (
          <img
            src={prize.image_url}
            alt=""
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ImageIcon className="w-6 h-6" />
            <span className="text-xs">Clique para adicionar imagem</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
          <Upload className="w-5 h-5 text-white" />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Título do prêmio</Label>
        <Input
          value={prize.title}
          onChange={(e) => onChange({ ...prize, title: e.target.value })}
          placeholder="Ex: iPhone 16 Pro"
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Descrição</Label>
        <Textarea
          value={prize.description}
          onChange={(e) => onChange({ ...prize, description: e.target.value })}
          placeholder="Detalhes do prêmio..."
          className="text-sm min-h-[60px] resize-none"
        />
      </div>
    </div>
  );
}

// ─── Award Form Dialog ────────────────────────────────────────────────────────

function AwardFormDialog({
  open,
  onClose,
  award,
  prizes: initialPrizes,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  award: Partial<Award> | null;
  prizes: AwardPrize[];
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [prizes, setPrizes] = useState<PrizeFormItem[]>([]);

  useEffect(() => {
    if (!open) return;
    setTitle(award?.title ?? "");
    setDescription(award?.description ?? "");
    setStartDate(award?.start_date ?? "");
    setEndDate(award?.end_date ?? "");
    setPrizes(
      initialPrizes.map((p) => ({
        id: p.id,
        placement: p.placement,
        title: p.title,
        description: p.description ?? "",
        image_url: p.image_url ?? "",
        imageFile: null,
      }))
    );
  }, [open]);

  function addPrize() {
    const next = prizes.length + 1;
    setPrizes([
      ...prizes,
      { placement: next, title: "", description: "", image_url: "", imageFile: null },
    ]);
  }

  function removePrize(i: number) {
    setPrizes(prizes.filter((_, idx) => idx !== i).map((p, idx) => ({ ...p, placement: idx + 1 })));
  }

  async function uploadImage(file: File, path: string): Promise<string> {
    const { error } = await supabase.storage
      .from("award-images")
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("award-images").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSave() {
    if (!title.trim()) {
      toast({ title: "Título obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let awardId = award?.id;

      if (awardId) {
        await supabase
          .from("awards")
          .update({ title, description, start_date: startDate || null, end_date: endDate || null })
          .eq("id", awardId);
      } else {
        const { data } = await supabase
          .from("awards")
          .insert({ title, description, start_date: startDate || null, end_date: endDate || null, is_active: true })
          .select()
          .single();
        awardId = data!.id;
      }

      // delete existing prizes then re-insert
      if (award?.id) {
        await supabase.from("award_prizes").delete().eq("award_id", awardId!);
      }

      for (const p of prizes) {
        let imageUrl = p.image_url;
        if (p.imageFile) {
          const ext = p.imageFile.name.split(".").pop();
          const path = `${awardId}/prize-${p.placement}-${Date.now()}.${ext}`;
          imageUrl = await uploadImage(p.imageFile, path);
        }
        await supabase.from("award_prizes").insert({
          award_id: awardId!,
          placement: p.placement,
          title: p.title || `${p.placement}º Lugar`,
          description: p.description || null,
          image_url: imageUrl || null,
        });
      }

      toast({ title: "Desafio salvo com sucesso!" });
      onSaved();
      onClose();
    } catch (e) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{award?.id ? "Editar Desafio" : "Novo Desafio"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="challenge">
          <TabsList className="mb-4">
            <TabsTrigger value="challenge">Desafio</TabsTrigger>
            <TabsTrigger value="prizes">Prêmios ({prizes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="challenge" className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome do desafio *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Desafio Março 2026" />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o desafio, regras, etc."
                className="min-h-[80px] resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Data de início</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Data de término</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="prizes" className="space-y-4">
            {prizes.map((p, i) => (
              <PrizeFormRow
                key={i}
                prize={p}
                onChange={(updated) => setPrizes(prizes.map((x, idx) => (idx === i ? updated : x)))}
                onRemove={() => removePrize(i)}
              />
            ))}
            <Button variant="outline" className="w-full" onClick={addPrize} type="button">
              <Plus className="w-4 h-4 mr-2" /> Adicionar colocação
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando…" : "Salvar desafio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Awards() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [showRules, setShowRules] = useState(false);
  const [weights, setWeights] = useState<EngagementWeights | null>(null);
  const [storiesW, setStoriesW] = useState<StoriesWeights | null>(null);
  const [multipliers, setMultipliers] = useState<ContentTypeMultipliers | null>(null);
  const [activeAward, setActiveAward] = useState<Award | null>(null);
  const [activePrizes, setActivePrizes] = useState<AwardPrize[]>([]);
  const [pastAwards, setPastAwards] = useState<Award[]>([]);
  const [pastPrizesMap, setPastPrizesMap] = useState<Record<string, AwardPrize[]>>({});
  const [members, setMembers] = useState<Member[]>([]);
  const [postCreators, setPostCreators] = useState<PostCreatorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [
      { data: awards },
      { data: allPrizes },
      { data: m },
      { data: pc },
    ] = await Promise.all([
      supabase.from("awards").select("*").order("created_at", { ascending: false }),
      supabase.from("award_prizes").select("*, winner:members!award_prizes_winner_member_id_fkey(*)").order("placement"),
      supabase.from("members").select("*"),
      supabase.from("post_creators").select("creator_id, post:posts(id, score, created_at, posted_at)"),
    ]);

    if (awards) {
      const active = awards.find((a) => a.is_active) ?? null;
      const past = awards.filter((a) => !a.is_active);
      setActiveAward(active);
      setPastAwards(past);

      if (allPrizes) {
        const typedPrizes = allPrizes as unknown as AwardPrize[];
        setActivePrizes(active ? typedPrizes.filter((p) => p.award_id === active.id) : []);
        const map: Record<string, AwardPrize[]> = {};
        past.forEach((a) => {
          map[a.id] = typedPrizes.filter((p) => p.award_id === a.id);
        });
        setPastPrizesMap(map);
      }
    }

    if (m) setMembers(m);
    if (pc) setPostCreators(pc as PostCreatorRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // Load scoring rules (read-only)
    Promise.all([
      supabase.from("engagement_weights").select("*").limit(1).single(),
      supabase.from("stories_weights").select("*").limit(1).single(),
      supabase.from("content_type_multipliers").select("*").limit(1).single(),
    ]).then(([{ data: w }, { data: sw }, { data: ct }]) => {
      if (w) setWeights(w as EngagementWeights);
      if (sw) setStoriesW(sw as StoriesWeights);
      if (ct) setMultipliers(ct as ContentTypeMultipliers);
    });
  }, []);

  // Compute live ranking filtered by award period — uses created_at to match Ranking page
  function computeLiveRanking(award: Award): RankingEntry[] {
    const filtered = postCreators.filter((pc) => {
      if (!pc.post) return false;
      const date = parseISO(pc.post.created_at);
      if (award.start_date && award.end_date) {
        return isWithinInterval(date, {
          start: startOfDay(parseISO(award.start_date)),
          end: endOfDay(parseISO(award.end_date)),
        });
      }
      if (award.start_date) return !isBefore(date, startOfDay(parseISO(award.start_date)));
      if (award.end_date) return !isAfter(date, endOfDay(parseISO(award.end_date)));
      return true;
    });

    return members
      .map((m) => {
        const mp = filtered.filter((pc) => pc.creator_id === m.id);
        const seen = new Set<string>();
        let total = 0;
        mp.forEach((pc) => {
          if (!seen.has(pc.post!.id)) {
            seen.add(pc.post!.id);
            total += pc.post!.score;
          }
        });
        return { member: m, totalScore: total };
      })
      .filter((e) => e.totalScore > 0)
      .sort((a, b) => b.totalScore - a.totalScore);
  }

  async function handleCloseCompetition() {
    if (!activeAward) return;
    setClosingId(activeAward.id);
    try {
      const ranking = computeLiveRanking(activeAward);
      // Save winners into prizes
      for (const prize of activePrizes) {
        const winner = ranking[prize.placement - 1];
        await supabase
          .from("award_prizes")
          .update({ winner_member_id: winner?.member.id ?? null })
          .eq("id", prize.id);
      }
      // Deactivate award
      await supabase.from("awards").update({ is_active: false }).eq("id", activeAward.id);
      toast({ title: "Competição encerrada! Vencedores registrados." });
      load();
    } catch {
      toast({ title: "Erro ao encerrar competição", variant: "destructive" });
    } finally {
      setClosingId(null);
    }
  }

  const liveRanking = activeAward ? computeLiveRanking(activeAward) : [];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="w-6 h-6 text-primary" />
            Prêmios e Regras
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Desafios, prêmios e regras de pontuação
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setDialogOpen(true)} disabled={!!activeAward && activeAward.is_active && !dialogOpen}>
            <Plus className="w-4 h-4 mr-2" />
            Novo desafio
          </Button>
        )}
      </div>

      {/* ── Scoring Rules Toggle ─────────────────────────────────────────── */}
      <div className="mb-8">
        <button
          onClick={() => setShowRules((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <Scroll className="w-4 h-4 text-primary group-hover:text-primary" />
          <span>Ver regras de pontuação</span>
          {showRules ? (
            <ChevronUp className="w-4 h-4 transition-transform" />
          ) : (
            <ChevronDown className="w-4 h-4 transition-transform" />
          )}
        </button>

        {showRules && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Feed */}
            <Card className="border-border/60 bg-card/50">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span className="text-base">📱</span> Feed
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div className="space-y-2">
                  {[
                    { icon: "❤️", label: "Curtidas", val: weights?.likes_weight },
                    { icon: "💬", label: "Comentários", val: weights?.comments_weight },
                    { icon: "🔁", label: "Compartilhamentos", val: weights?.shares_weight },
                    { icon: "🔖", label: "Salvamentos", val: weights?.saves_weight },
                  ].map(({ icon, label, val }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <span>{icon}</span> {label}
                      </span>
                      <span className="font-mono font-semibold text-foreground tabular-nums">
                        ×{val ?? "—"}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-border/40">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Fórmula: <span className="font-mono">(métricas × peso) × multiplicador</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Stories */}
            <Card className="border-border/60 bg-card/50">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span className="text-base">⭕</span> Stories
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div className="space-y-2">
                  {[
                    { icon: "👁️", label: "Views Pico", val: storiesW?.views_pico_weight },
                    { icon: "💬", label: "Interações", val: storiesW?.interactions_weight },
                    { icon: "🔁", label: "Encaminhamentos", val: storiesW?.forwards_weight },
                    { icon: "🖱️", label: "Cliques CTA", val: storiesW?.cta_clicks_weight },
                  ].map(({ icon, label, val }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <span>{icon}</span> {label}
                      </span>
                      <span className="font-mono font-semibold text-foreground tabular-nums">
                        ×{val ?? "—"}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-border/40">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Soma ponderada independente do tipo de conteúdo
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Multipliers */}
            <Card className="border-border/60 bg-card/50">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span className="text-base">✖️</span> Multiplicadores
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div className="space-y-2">
                  {[
                    { icon: "🔧", label: "Técnico", val: multipliers?.technical },
                    { icon: "😂", label: "Meme", val: multipliers?.meme },
                    { icon: "📣", label: "Anúncio", val: multipliers?.announcement },
                  ].map(({ icon, label, val }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <span>{icon}</span> {label}
                      </span>
                      <span className="font-mono font-semibold text-foreground tabular-nums">
                        ×{val ?? "—"}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-border/40">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Aplicado apenas em posts de Feed
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando…</p>
      ) : (
        <>
          {/* ── Active Challenge ─────────────────────────────────────────── */}
          {activeAward ? (
            <section className="mb-10">
              <Card className="border-primary/30 bg-primary/5 overflow-hidden">
                {/* Progress bar */}
                {(() => {
                  const now = new Date();
                  const start = activeAward.start_date ? new Date(activeAward.start_date) : null;
                  const end = activeAward.end_date ? new Date(activeAward.end_date + "T23:59:59") : null;
                  const progress = start && end
                    ? Math.min(100, Math.max(0, ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100))
                    : null;
                  const daysLeft = end
                    ? Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
                    : null;
                  return progress !== null ? (
                    <div>
                      <div className="h-3 w-full bg-primary/10">
                        <div
                          className="h-full transition-all duration-700"
                          style={{
                            width: `${progress}%`,
                            background: "linear-gradient(90deg, hsl(217 91% 55%), hsl(199 95% 60%))",
                            boxShadow: "0 0 14px hsl(217 91% 60% / 0.9), 0 0 4px hsl(199 95% 65% / 0.6)",
                          }}
                        />
                      </div>
                      {daysLeft !== null && (
                        <div className="px-6 pt-2.5 pb-0">
                          <span className="text-sm font-bold tracking-wide" style={{ color: "hsl(217 91% 70%)", textShadow: "0 0 8px hsl(217 91% 60% / 0.5)" }}>
                            {daysLeft === 0 ? "Último dia! 🔥" : `Faltam ${daysLeft} dia${daysLeft !== 1 ? "s" : ""}`}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-xs font-semibold">
                          🏆 Desafio Ativo
                        </Badge>
                        {activeAward.start_date && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(activeAward.start_date)}
                            {activeAward.end_date && ` – ${formatDate(activeAward.end_date)}`}
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-xl">{activeAward.title}</CardTitle>
                      {activeAward.description && (
                        <p className="text-sm text-muted-foreground">{activeAward.description}</p>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDialogOpen(true)}
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1.5" />
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={closingId === activeAward.id}
                          onClick={handleCloseCompetition}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                          {closingId ? "Encerrando…" : "Encerrar"}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Prize cards */}
                  {activePrizes.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-3">
                        Prêmios
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activePrizes.map((prize) => (
                          <PrizeCard
                            key={prize.id}
                            prize={prize}
                            winner={liveRanking[prize.placement - 1] ?? null}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Live ranking */}
                  {liveRanking.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-3">
                        Quem levaria agora
                      </p>
                      <div className="space-y-2">
                        {liveRanking
                          .slice(0, Math.max(activePrizes.length, 3))
                          .map((entry, i) => (
                            <div
                              key={entry.member.id}
                              className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-background/60 border border-border/40"
                            >
                              <span className="w-7 text-center text-base">
                                {i < 3 ? medals[i] : `#${i + 1}`}
                              </span>
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={entry.member.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {entry.member.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{entry.member.name}</p>
                                {entry.member.role && (
                                  <p className="text-xs text-muted-foreground">{entry.member.role}</p>
                                )}
                              </div>
                              <p className={`text-lg font-bold ${medalColors[i] ?? "text-primary"}`}>
                                {entry.totalScore.toFixed(0)}
                                <span className="text-xs font-normal text-muted-foreground ml-1">pts</span>
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {liveRanking.length === 0 && activePrizes.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Configure os prêmios e aguarde publicações no período do desafio.
                    </p>
                  )}
                </CardContent>
              </Card>
            </section>
          ) : (
            <Card className="mb-10 border-dashed">
              <CardContent className="flex flex-col items-center py-12 gap-3">
                <Trophy className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">Nenhum desafio ativo no momento.</p>
                {isAdmin && (
                  <Button variant="outline" onClick={() => setDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Criar desafio
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── History ──────────────────────────────────────────────────── */}
          {pastAwards.length > 0 && (
            <section>
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-muted-foreground" />
                Histórico de Premiações
              </h2>
              <Accordion type="multiple" className="space-y-2">
                {pastAwards.map((award) => {
                  const prizes = pastPrizesMap[award.id] ?? [];
                  return (
                    <AccordionItem
                      key={award.id}
                      value={award.id}
                      className="border border-border/60 rounded-lg px-4 data-[state=open]:bg-muted/30"
                    >
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-3 text-left">
                          <span className="font-medium text-sm">{award.title}</span>
                          {award.start_date && (
                            <span className="text-xs text-muted-foreground">
                              {formatDate(award.start_date)}
                              {award.end_date && ` – ${formatDate(award.end_date)}`}
                            </span>
                          )}
                          {prizes.length > 0 && (
                            <div className="flex items-center gap-1 ml-auto mr-4">
                              {prizes.slice(0, 3).map((p, i) => (
                                <span key={p.id} className="text-sm">
                                  {medals[i] ?? ""}{" "}
                                  <span className="text-xs text-muted-foreground">
                                    {p.winner?.name ?? "—"}
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {award.description && (
                          <p className="text-sm text-muted-foreground mb-4">{award.description}</p>
                        )}
                        {prizes.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-2">
                            {prizes.map((prize) => (
                              <PrizeCard key={prize.id} prize={prize} />
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground py-2">
                            Nenhum prêmio registrado.
                          </p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </section>
          )}
        </>
      )}

      {/* Form Dialog */}
      <AwardFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        award={activeAward}
        prizes={activeAward ? activePrizes : []}
        onSaved={load}
      />
    </div>
  );
}
