import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { detectPlatform, calcScore, EngagementWeights, Member } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformBadge } from "@/components/PlatformBadge";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Share2, Bookmark, Loader2, Search, CheckCircle2, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ScrapeResult = {
  title?: string;
  thumbnail_url?: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  scraped: boolean;
};

export default function NewPost() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [memberId, setMemberId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [weights, setWeights] = useState<EngagementWeights | null>(null);
  const [scraping, setScraping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<ScrapeResult | null>(null);
  const [metrics, setMetrics] = useState({ likes: 0, comments: 0, shares: 0, saves: 0 });

  const platform = detectPlatform(url);

  useEffect(() => {
    async function load() {
      const [{ data: m }, { data: w }] = await Promise.all([
        supabase.from("members").select("*").order("name"),
        supabase.from("engagement_weights").select("*").limit(1).single(),
      ]);
      if (m) setMembers(m);
      if (w) setWeights(w);
    }
    load();
  }, []);

  async function handleScrape() {
    if (!url || !platform) {
      toast({ title: "URL inválida", description: "Cole um link do Instagram ou TikTok.", variant: "destructive" });
      return;
    }
    setScraping(true);
    setPreview(null);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-post", { body: { url } });
      if (error) throw error;
      if (data?.success) {
        setPreview(data);
        setMetrics({ likes: data.likes || 0, comments: data.comments || 0, shares: data.shares || 0, saves: data.saves || 0 });
        if (!data.scraped) {
          toast({ title: "Dados não encontrados automaticamente", description: "O conteúdo está protegido ou privado. Preencha os dados manualmente." });
        }
      } else {
        throw new Error(data?.error || "Erro no scraping");
      }
    } catch (e: any) {
      toast({ title: "Erro ao buscar dados", description: e.message, variant: "destructive" });
    } finally {
      setScraping(false);
    }
  }

  async function handleSave() {
    if (!memberId) { toast({ title: "Selecione um membro", variant: "destructive" }); return; }
    if (!platform) { toast({ title: "URL inválida", variant: "destructive" }); return; }
    setSaving(true);
    const score = weights ? calcScore(metrics, weights) : 0;
    const { error } = await supabase.from("posts").insert({
      member_id: memberId,
      url,
      platform,
      title: preview?.title || null,
      thumbnail_url: preview?.thumbnail_url || null,
      ...metrics,
      score,
    });
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Post cadastrado com sucesso!" });
      navigate("/posts");
    }
    setSaving(false);
  }

  const score = weights ? calcScore(metrics, weights) : 0;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Cadastrar Conteúdo</h1>
        <p className="text-muted-foreground text-sm mt-1">Cole o link do post para buscar os dados automaticamente</p>
      </div>

      <div className="space-y-6">
        {/* URL + plataforma */}
        <Card>
          <CardHeader><CardTitle className="text-base">Link do Post</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="https://www.instagram.com/p/... ou https://www.tiktok.com/@..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <Button onClick={handleScrape} disabled={!url || !platform || scraping}>
                {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {scraping ? "Buscando..." : "Buscar"}
              </Button>
            </div>
            {platform && <PlatformBadge platform={platform} />}
            {url && !platform && <p className="text-xs text-destructive">URL não reconhecida. Use links do Instagram ou TikTok.</p>}
          </CardContent>
        </Card>

        {/* Preview */}
        {preview && (
          <Card className="border-primary/30 bg-accent">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {preview.scraped ? (
                  <><CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" /> Dados encontrados automaticamente</>
                ) : (
                  <><AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" /> Dados não encontrados — preencha manualmente</>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {preview.title && <p className="font-medium mb-3 text-sm">{preview.title}</p>}
            </CardContent>
          </Card>
        )}

        {/* Métricas */}
        {(preview || url) && (
          <Card>
            <CardHeader><CardTitle className="text-base">Métricas de Engajamento</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "likes", label: "Curtidas", icon: Heart },
                  { key: "comments", label: "Comentários", icon: MessageCircle },
                  { key: "shares", label: "Compartilhamentos", icon: Share2 },
                  { key: "saves", label: "Salvamentos", icon: Bookmark },
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key}>
                    <Label className="flex items-center gap-1.5 mb-1.5 text-sm">
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={metrics[key as keyof typeof metrics]}
                      onChange={(e) => setMetrics((m) => ({ ...m, [key]: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Score calculado:</span>
                <span className="text-2xl font-bold text-primary">{score.toFixed(0)} pts</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Membro */}
        {(preview || url) && (
          <Card>
            <CardHeader><CardTitle className="text-base">Associar a Membro</CardTitle></CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum membro cadastrado. <a href="/members" className="text-primary underline">Cadastre um membro</a> primeiro.</p>
              ) : (
                <Select value={memberId} onValueChange={setMemberId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o membro..." />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name} {m.role ? `— ${m.role}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
          {(preview || url) && (
            <Button onClick={handleSave} disabled={saving || !memberId}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar Post
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
