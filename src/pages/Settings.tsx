import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EngagementWeights, ContentTypeMultipliers, calcScore, getMultiplier } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Share2, Bookmark, Save, Info, Layers, Loader2 } from "lucide-react";

const weightFields = [
  { key: "likes_weight", label: "Curtidas", icon: Heart, description: "Peso por curtida" },
  { key: "comments_weight", label: "Comentários", icon: MessageCircle, description: "Peso por comentário" },
  { key: "shares_weight", label: "Compartilhamentos", icon: Share2, description: "Peso por compartilhamento" },
  { key: "saves_weight", label: "Salvamentos", icon: Bookmark, description: "Peso por salvamento" },
] as const;

const multiplierFields = [
  { key: "technical", label: "Técnico", emoji: "🔧", description: "Posts educativos, tutoriais, dicas" },
  { key: "meme", label: "Meme", emoji: "😂", description: "Posts humorísticos, entretenimento" },
  { key: "announcement", label: "Anúncio", emoji: "📣", description: "Posts patrocinados, publicidade" },
] as const;

export default function Settings() {
  const [weights, setWeights] = useState<EngagementWeights | null>(null);
  const [form, setForm] = useState({ likes_weight: 1, comments_weight: 3, shares_weight: 5, saves_weight: 2 });
  const [multipliers, setMultipliers] = useState<ContentTypeMultipliers | null>(null);
  const [multForm, setMultForm] = useState({ technical: 1.0, meme: 1.0, announcement: 1.0 });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      const [{ data: w }, { data: m }] = await Promise.all([
        supabase.from("engagement_weights").select("*").limit(1).single(),
        supabase.from("content_type_multipliers").select("*").limit(1).single(),
      ]);
      if (w) {
        setWeights(w);
        setForm({
          likes_weight: w.likes_weight,
          comments_weight: w.comments_weight,
          shares_weight: w.shares_weight,
          saves_weight: w.saves_weight,
        });
      }
      if (m) {
        setMultipliers(m as ContentTypeMultipliers);
        setMultForm({ technical: m.technical, meme: m.meme, announcement: m.announcement });
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    if (!weights || !multipliers) return;
    setSaving(true);

    const [{ error: we }, { error: me }] = await Promise.all([
      supabase.from("engagement_weights").update({ ...form, updated_at: new Date().toISOString() }).eq("id", weights.id),
      supabase.from("content_type_multipliers").update({ ...multForm, updated_at: new Date().toISOString() }).eq("id", multipliers.id),
    ]);

    if (we || me) {
      toast({ title: "Erro ao salvar", description: (we || me)?.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    toast({ title: "Configurações salvas!" });

    // Recalculate all post scores
    const { data: posts } = await supabase.from("posts").select("*");
    if (posts) {
      for (const p of posts) {
        const mult = getMultiplier(p.content_type ?? null, { ...multipliers, ...multForm });
        const score = calcScore(
          { likes: p.likes, comments: p.comments, shares: p.shares, saves: p.saves },
          { ...weights, ...form },
          mult
        );
        await supabase.from("posts").update({ score }).eq("id", p.id);
      }
      toast({ title: "Scores recalculados!", description: `${posts.length} posts atualizados.` });
    }
    setSaving(false);
  }

  const exampleScore = (100 * form.likes_weight + 20 * form.comments_weight + 5 * form.shares_weight + 15 * form.saves_weight);

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Pesos de engajamento e multiplicadores por tipo de conteúdo</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : (
        <div className="space-y-6">
          {/* Pesos de Engajamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pesos de Engajamento</CardTitle>
              <CardDescription>Cada interação valerá X pontos no cálculo do score base.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {weightFields.map(({ key, label, icon: Icon, description }) => (
                <div key={key} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium">{label}</Label>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      className="w-20 text-center"
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: parseFloat(e.target.value) || 0 }))}
                    />
                    <span className="text-xs text-muted-foreground">pts</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Multiplicadores por Tipo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Multiplicadores por Tipo de Conteúdo
              </CardTitle>
              <CardDescription>
                O score final é multiplicado pelo fator do tipo. Ex: Meme = 0,5× reduz a pontuação pela metade.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {multiplierFields.map(({ key, label, emoji, description }) => (
                <div key={key} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0 text-lg">
                    {emoji}
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium">{label}</Label>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      step={0.1}
                      className="w-20 text-center"
                      value={multForm[key]}
                      onChange={(e) => setMultForm((f) => ({ ...f, [key]: parseFloat(e.target.value) || 0 }))}
                    />
                    <span className="text-xs text-muted-foreground">×</span>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-1">
                Posts sem tipo classificado usam multiplicador <strong>1×</strong> (neutro).
              </p>
            </CardContent>
          </Card>

          {/* Fórmula */}
          <Card className="bg-accent border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-accent-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-accent-foreground">Fórmula atual</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Score = ((curtidas × {form.likes_weight}) + (comentários × {form.comments_weight}) + (compartilhamentos × {form.shares_weight}) + (salvamentos × {form.saves_weight})) × tipo
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    <strong>Exemplo</strong>: 100❤️, 20💬, 5🔁, 15🔖 sem tipo = <strong>{exampleScore.toFixed(0)} pts</strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? "Salvando e recalculando..." : "Salvar Configurações"}
          </Button>
        </div>
      )}
    </div>
  );
}
