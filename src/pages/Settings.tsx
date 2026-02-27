import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EngagementWeights } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Share2, Bookmark, Save, Info } from "lucide-react";
import { Loader2 } from "lucide-react";

const fields = [
  { key: "likes_weight", label: "Curtidas", icon: Heart, description: "Peso por curtida" },
  { key: "comments_weight", label: "Comentários", icon: MessageCircle, description: "Peso por comentário" },
  { key: "shares_weight", label: "Compartilhamentos", icon: Share2, description: "Peso por compartilhamento" },
  { key: "saves_weight", label: "Salvamentos", icon: Bookmark, description: "Peso por salvamento" },
] as const;

export default function Settings() {
  const [weights, setWeights] = useState<EngagementWeights | null>(null);
  const [form, setForm] = useState({ likes_weight: 1, comments_weight: 3, shares_weight: 5, saves_weight: 2 });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("engagement_weights").select("*").limit(1).single();
      if (data) {
        setWeights(data);
        setForm({
          likes_weight: data.likes_weight,
          comments_weight: data.comments_weight,
          shares_weight: data.shares_weight,
          saves_weight: data.saves_weight,
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    if (!weights) return;
    setSaving(true);
    const { error } = await supabase
      .from("engagement_weights")
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq("id", weights.id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Configurações salvas!" });
      // Recalcular scores de todos os posts
      const { data: posts } = await supabase.from("posts").select("*");
      if (posts) {
        for (const p of posts) {
          const score = p.likes * form.likes_weight + p.comments * form.comments_weight + p.shares * form.shares_weight + p.saves * form.saves_weight;
          await supabase.from("posts").update({ score }).eq("id", p.id);
        }
        toast({ title: "Scores recalculados!", description: `${posts.length} posts atualizados.` });
      }
    }
    setSaving(false);
  }

  const exampleScore = 100 * form.likes_weight + 20 * form.comments_weight + 5 * form.shares_weight + 15 * form.saves_weight;

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Defina os pesos para cada tipo de engajamento</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pesos de Engajamento</CardTitle>
              <CardDescription>Cada interação valerá X pontos no cálculo do score.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map(({ key, label, icon: Icon, description }) => (
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

          {/* Preview da fórmula */}
          <Card className="bg-accent border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-accent-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-accent-foreground">Fórmula atual</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Score = (curtidas × {form.likes_weight}) + (comentários × {form.comments_weight}) + (compartilhamentos × {form.shares_weight}) + (salvamentos × {form.saves_weight})
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    <strong>Exemplo</strong>: 100 curtidas, 20 comentários, 5 compartilhamentos, 15 salvamentos = <strong>{exampleScore.toFixed(0)} pts</strong>
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
