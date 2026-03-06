import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Post, Creator, EngagementWeights, ContentTypeMultipliers,
  calcScore, getMultiplier, CONTENT_TYPE_LABELS
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Share2, Bookmark, Loader2, ArrowLeft, Plus, X, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ContentTypePicker } from "@/components/ContentTypePicker";

type PostWithCreators = Post & { post_creators: { id: string; creator: Creator }[] };

export default function EditPost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [post, setPost] = useState<PostWithCreators | null>(null);
  const [allCreators, setAllCreators] = useState<Creator[]>([]);
  const [selectedCreators, setSelectedCreators] = useState<Creator[]>([]);
  const [weights, setWeights] = useState<EngagementWeights | null>(null);
  const [multipliers, setMultipliers] = useState<ContentTypeMultipliers | null>(null);
  const [metrics, setMetrics] = useState({ likes: 0, comments: 0, shares: 0, saves: 0 });
  const [postedAt, setPostedAt] = useState<Date | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [creatorSearch, setCreatorSearch] = useState("");
  const [openDate, setOpenDate] = useState(false);
  const [contentType, setContentType] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [{ data: p }, { data: c }, { data: w }, { data: mp }] = await Promise.all([
        supabase.from("posts").select("*, post_creators(id, creator:members(*))").eq("id", id!).single(),
        supabase.from("members").select("*").order("name"),
        supabase.from("engagement_weights").select("*").limit(1).single(),
        supabase.from("content_type_multipliers").select("*").limit(1).single(),
      ]);
      if (p) {
        setPost(p as PostWithCreators);
        setMetrics({ likes: p.likes, comments: p.comments, shares: p.shares, saves: p.saves });
        setPostedAt(p.posted_at ? new Date(p.posted_at) : undefined);
        setSelectedCreators((p as any).post_creators?.map((pc: any) => pc.creator).filter(Boolean) || []);
        setContentType((p as any).content_type ?? null);
      }
      if (c) setAllCreators(c);
      if (w) setWeights(w);
      if (mp) setMultipliers(mp as ContentTypeMultipliers);
    }
    load();
  }, [id]);

  function toggleCreator(creator: Creator) {
    setSelectedCreators(prev =>
      prev.find(c => c.id === creator.id) ? prev.filter(c => c.id !== creator.id) : [...prev, creator]
    );
  }

  async function save() {
    if (!post) return;
    if (selectedCreators.length === 0) { toast({ title: "Selecione ao menos um criador", variant: "destructive" }); return; }
    setSaving(true);
    const mult = getMultiplier(contentType, multipliers);
    const score = weights ? calcScore(metrics, weights, mult) : post.score;

    const { error } = await supabase.from("posts").update({
      ...metrics,
      score,
      content_type: contentType,
      member_id: selectedCreators[0].id,
      posted_at: postedAt ? postedAt.toISOString() : null,
    }).eq("id", post.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); setSaving(false); return; }

    await supabase.from("post_creators").delete().eq("post_id", post.id);
    await supabase.from("post_creators").insert(selectedCreators.map(c => ({ post_id: post.id, creator_id: c.id })));

    toast({ title: "Post atualizado!" });
    navigate("/posts");
    setSaving(false);
  }

  const mult = getMultiplier(contentType, multipliers);
  const score = weights ? calcScore(metrics, weights, mult) : 0;
  const filteredCreators = allCreators.filter(c =>
    c.name.toLowerCase().includes(creatorSearch.toLowerCase()) &&
    !selectedCreators.find(sc => sc.id === c.id)
  );

  if (!post) return <div className="p-8"><div className="h-40 bg-card rounded-xl animate-pulse" /></div>;

  return (
    <div className="p-8 max-w-2xl animate-fade-in">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Editar Post</h1>
        <p className="text-muted-foreground text-sm mt-1 truncate">{post.url}</p>
      </div>

      <div className="space-y-5">
        {/* Criadores */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-base">Criadores</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {selectedCreators.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedCreators.map(c => (
                  <span key={c.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/15 border border-primary/20 text-sm text-primary">
                    {c.name}
                    <button onClick={() => toggleCreator(c)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
            <Input placeholder="Buscar criador..." value={creatorSearch} onChange={e => setCreatorSearch(e.target.value)} className="bg-input border-border text-sm" />
            <div className="max-h-40 overflow-y-auto space-y-1 rounded-lg border border-border p-1">
              {filteredCreators.map(c => (
                <button key={c.id} onClick={() => toggleCreator(c)} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted/50 transition-colors text-left">
                  <Plus className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="font-medium">{c.name}</span>
                  {c.role && <span className="text-muted-foreground text-xs">— {c.role}</span>}
                </button>
              ))}
              {filteredCreators.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Nenhum resultado</p>}
            </div>
          </CardContent>
        </Card>

        {/* Tipo de Conteúdo */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-base">Tipo de Conteúdo</CardTitle></CardHeader>
          <CardContent>
            <ContentTypePicker
              value={contentType}
              onChange={setContentType}
              multipliers={multipliers}
            />
          </CardContent>
        </Card>

        {/* Data de Publicação */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-base">Data de Publicação</CardTitle></CardHeader>
          <CardContent>
            <Popover open={openDate} onOpenChange={setOpenDate}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal border-border bg-input", !postedAt && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {postedAt ? format(postedAt, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                <Calendar mode="single" selected={postedAt} onSelect={(d) => { setPostedAt(d); setOpenDate(false); }} disabled={d => d > new Date()} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        {/* Métricas */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              Métricas de Engajamento
              {weights && (
                <span className="text-xs font-normal text-muted-foreground">
                  Score = {weights.likes_weight}×❤️ + {weights.comments_weight}×💬 + {weights.shares_weight}×🔁 + {weights.saves_weight}×🔖
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: "likes", label: "Curtidas", icon: Heart },
                { key: "comments", label: "Comentários", icon: MessageCircle },
                { key: "shares", label: "Compartilhamentos", icon: Share2 },
                { key: "saves", label: "Salvamentos", icon: Bookmark },
              ].map(({ key, label, icon: Icon }) => (
                <div key={key}>
                  <Label className="flex items-center gap-1.5 mb-1.5 text-sm"><Icon className="w-3.5 h-3.5" /> {label}</Label>
                  <Input
                    type="number" min={0} className="bg-input border-border"
                    value={metrics[key as keyof typeof metrics]}
                    onChange={e => setMetrics(m => ({ ...m, [key]: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <div>
                <span className="text-sm text-muted-foreground">Score calculado</span>
                {contentType && mult !== 1.0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (×{mult} {CONTENT_TYPE_LABELS[contentType]})
                  </span>
                )}
              </div>
              <span className="text-2xl font-bold gradient-text">{score.toFixed(0)} pts</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" className="border-border" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button onClick={save} disabled={saving} className="gradient-primary text-white border-0 glow-blue">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Salvar Alterações
          </Button>
        </div>
      </div>
    </div>
  );
}
