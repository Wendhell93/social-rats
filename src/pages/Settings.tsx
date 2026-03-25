import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EngagementWeights, calcScore, getMultiplier } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useContentTypes, ContentTypeConfig } from "@/hooks/use-content-types";
import {
  Heart, MessageCircle, Share2, Bookmark, Save, Info, Layers, Loader2,
  Eye, Repeat2, MousePointerClick, BookImage, UserPlus, Trash2, ShieldCheck, Mail, Building2, Plus, Pencil
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

const feedWeightFields = [
  { key: "likes_weight", label: "Curtidas", icon: Heart, description: "Peso por curtida" },
  { key: "comments_weight", label: "Comentários", icon: MessageCircle, description: "Peso por comentário" },
  { key: "shares_weight", label: "Compartilhamentos", icon: Share2, description: "Peso por compartilhamento" },
  { key: "saves_weight", label: "Salvamentos", icon: Bookmark, description: "Peso por salvamento" },
  { key: "views_weight", label: "Visualizações", icon: Eye, description: "Peso por visualização" },
] as const;

type AdminEmail = { id: string; email: string; created_at: string };

export default function Settings() {
  const { user } = useAuth();
  const [weights, setWeights] = useState<EngagementWeights | null>(null);
  const [form, setForm] = useState({ likes_weight: 1, comments_weight: 3, shares_weight: 5, saves_weight: 2, views_weight: 0, use_engagement_rate: true, no_views_factor: 0.02, engagement_bonus_factor: 100 });
  const { types: contentTypes, reload: reloadTypes, multipliersMap } = useContentTypes();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Content type CRUD
  const [ctDialogOpen, setCtDialogOpen] = useState(false);
  const [ctEdit, setCtEdit] = useState<ContentTypeConfig | null>(null);
  const [ctForm, setCtForm] = useState({ key: "", label: "", emoji: "", description: "", multiplier: 1 });
  const [ctSaving, setCtSaving] = useState(false);
  const [ctDeleteTarget, setCtDeleteTarget] = useState<ContentTypeConfig | null>(null);

  // Admin management
  const [adminEmails, setAdminEmails] = useState<AdminEmail[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminEmail | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([]);
  const [newArea, setNewArea] = useState("");
  const [deleteAreaTarget, setDeleteAreaTarget] = useState<{ id: string; name: string } | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      const [{ data: w }, { data: ae }, { data: ar }] = await Promise.all([
        supabase.from("engagement_weights").select("*").limit(1).single(),
        (supabase as any).from("admin_emails").select("*").order("created_at", { ascending: true }),
        supabase.from("areas").select("*").order("name"),
      ]);
      if (w) {
        setWeights(w);
        setForm({ likes_weight: w.likes_weight, comments_weight: w.comments_weight, shares_weight: w.shares_weight, saves_weight: w.saves_weight, views_weight: w.views_weight ?? 0, use_engagement_rate: true, no_views_factor: w.no_views_factor ?? 0.02, engagement_bonus_factor: w.engagement_bonus_factor ?? 100 });
      }
      if (ae) setAdminEmails(ae as AdminEmail[]);
      if (ar) setAreas(ar);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    if (!weights) return;
    setSaving(true);

    const { error: saveErr } = await supabase.from("engagement_weights").update({ ...form, updated_at: new Date().toISOString() }).eq("id", weights.id) as any;
    if (saveErr) {
      toast({ title: "Erro ao salvar", description: saveErr.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    toast({ title: "Configurações salvas!" });

    // Recalculate all post scores
    const { data: posts } = await supabase.from("posts").select("*");
    if (posts) {
      const updates = posts.map((p) => {
        const mult = getMultiplier(p.content_type ?? null, multipliersMap);
        const score = calcScore(
          { likes: p.likes, comments: p.comments, shares: p.shares, saves: p.saves, views: p.views ?? 0 },
          { ...weights, ...form } as EngagementWeights,
          mult
        );
        return { id: p.id, score };
      });

      // Process in batches of 50 concurrent updates
      const BATCH_SIZE = 50;
      for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        const batch = updates.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(({ id, score }) =>
            supabase.from("posts").update({ score }).eq("id", id)
          )
        );
      }
      toast({ title: "Scores recalculados!", description: `${posts.length} posts atualizados.` });
    }
    setSaving(false);
  }

  async function handleAddArea() {
    const name = newArea.trim().toUpperCase();
    if (!name) return;
    const { data, error } = await supabase.from("areas").insert({ name }).select().single();
    if (error) {
      toast({ title: "Erro ao adicionar área", description: error.message, variant: "destructive" });
      return;
    }
    setAreas(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    setNewArea("");
    toast({ title: "Área adicionada!" });
  }

  async function handleAddAdmin() {
    const email = newEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "E-mail inválido", variant: "destructive" });
      return;
    }
    if (adminEmails.some(a => a.email === email)) {
      toast({ title: "Este e-mail já é admin", variant: "destructive" });
      return;
    }
    setAddingAdmin(true);
    const { data, error } = await (supabase as any).from("admin_emails").insert({ email }).select().single();
    if (error) {
      toast({ title: "Erro ao adicionar admin", description: error.message, variant: "destructive" });
    } else {
      setAdminEmails(prev => [...prev, data as AdminEmail]);
      setNewEmail("");
      toast({ title: "Admin adicionado!" });
    }
    setAddingAdmin(false);
  }

  async function handleDeleteAdmin(target: AdminEmail) {
    if (adminEmails.length <= 1) {
      toast({ title: "Deve existir pelo menos um admin", variant: "destructive" });
      setDeleteTarget(null);
      return;
    }
    // Can't remove yourself
    if (target.email === user?.email) {
      toast({ title: "Você não pode remover seu próprio acesso", variant: "destructive" });
      setDeleteTarget(null);
      return;
    }
    setDeletingId(target.id);
    const { error } = await (supabase as any).from("admin_emails").delete().eq("id", target.id);
    if (error) {
      toast({ title: "Erro ao remover admin", description: error.message, variant: "destructive" });
    } else {
      setAdminEmails(prev => prev.filter(a => a.id !== target.id));
      toast({ title: "Admin removido." });
    }
    setDeletingId(null);
    setDeleteTarget(null);
  }

  const exampleBase = (100 * form.likes_weight + 20 * form.comments_weight + 5 * form.shares_weight + 15 * form.saves_weight);
  const exampleBonus = (exampleBase / 5000) * form.engagement_bonus_factor;
  const exampleVideoScore = exampleBase + exampleBonus;
  const exampleCarouselScore = exampleBase; // no bonus (no views)

  return (
    <div className="p-4 md:p-8 max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Pesos de engajamento, multiplicadores e administradores</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : (
        <div className="space-y-6">
          {/* Admin Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Administradores
              </CardTitle>
              <CardDescription>E-mails autorizados a acessar o painel de administração via login Google.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current admins list */}
              <div className="space-y-2">
                {adminEmails.map(a => (
                  <div key={a.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-accent border border-border">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm flex-1 truncate">{a.email}</span>
                    {a.email === user?.email && (
                      <span className="text-[10px] font-medium text-primary px-1.5 py-0.5 bg-primary/10 rounded">você</span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={() => setDeleteTarget(a)}
                      disabled={deletingId === a.id || adminEmails.length <= 1 || a.email === user?.email}
                      title={a.email === user?.email ? "Você não pode remover seu próprio acesso" : "Remover admin"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add new admin */}
              <div className="flex gap-2">
                <Input
                  placeholder="novo@email.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddAdmin()}
                  className="flex-1 text-sm"
                  type="email"
                />
                <Button
                  onClick={handleAddAdmin}
                  disabled={addingAdmin || !newEmail.trim()}
                  className="gap-1.5 shrink-0"
                  size="sm"
                >
                  {addingAdmin ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  Cadastrar admin
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pesos de Interações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <span>Pesos de Interações</span>
              </CardTitle>
              <CardDescription>
                Cada interação vale X pontos na base do score. Views não entram na base — são usadas apenas no bônus de engajamento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {feedWeightFields.filter(f => f.key !== "views_weight").map(({ key, label, icon: Icon, description }) => (
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
                      type="number" min={0} step={0.5} className="w-20 text-center"
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: parseFloat(e.target.value) || 0 }))}
                    />
                    <span className="text-xs text-muted-foreground">pts</span>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-border">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Eye className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Bônus de engajamento (vídeos)</Label>
                    <p className="text-xs text-muted-foreground">Vídeos com views ganham bônus = (base ÷ views) × este fator. Carrosséis sem views não recebem bônus.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number" min={0} step={10} className="w-20 text-center"
                      value={form.engagement_bonus_factor}
                      onChange={(e) => setForm((f) => ({ ...f, engagement_bonus_factor: parseFloat(e.target.value) || 0 }))}
                    />
                    <span className="text-xs text-muted-foreground">×</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Multiplicadores por Tipo */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    Multiplicadores por Tipo de Conteúdo
                  </CardTitle>
                  <CardDescription>
                    O score final é multiplicado pelo fator do tipo. Adicione, edite ou remova tipos.
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => {
                  setCtEdit(null);
                  setCtForm({ key: "", label: "", emoji: "", description: "", multiplier: 1 });
                  setCtDialogOpen(true);
                }}>
                  <Plus className="w-3.5 h-3.5" /> Novo tipo
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {contentTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum tipo cadastrado. Clique em "Novo tipo" para criar.</p>
              ) : (
                contentTypes.map((ct) => (
                  <div key={ct.id} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0 text-lg">
                      {ct.emoji || "📝"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label className="text-sm font-medium">{ct.label}</Label>
                      <p className="text-xs text-muted-foreground truncate">{ct.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold text-primary">{ct.multiplier}×</span>
                      <Button variant="ghost" size="icon" className="w-8 h-8 hover:text-primary" onClick={() => {
                        setCtEdit(ct);
                        setCtForm({ key: ct.key, label: ct.label, emoji: ct.emoji, description: ct.description, multiplier: ct.multiplier });
                        setCtDialogOpen(true);
                      }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive" onClick={() => setCtDeleteTarget(ct)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
              <p className="text-xs text-muted-foreground pt-1">
                Posts sem tipo classificado usam multiplicador <strong>1×</strong> (neutro).
              </p>
            </CardContent>
          </Card>

          {/* Fórmulas */}
          <Card className="bg-accent border-primary/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-accent-foreground mt-0.5 flex-shrink-0" />
                <div className="space-y-3 w-full">
                  <div>
                    <p className="text-sm font-medium text-accent-foreground flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-primary" /> Fórmula (todos os formatos)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Base = curtidas × {form.likes_weight} + comentários × {form.comments_weight} + compartilhamentos × {form.shares_weight} + salvamentos × {form.saves_weight}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Bônus (vídeo) = (base ÷ views) × {form.engagement_bonus_factor}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <strong>Score = (base + bônus) × multiplicador de tipo</strong>
                    </p>
                  </div>
                  <div className="border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground">
                      <strong>Vídeo</strong>: 100❤️, 20💬, 5🔁, 15🔖, 5.000👁️ = <strong>{exampleVideoScore.toFixed(0)} pts</strong>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <strong>Carrossel</strong>: 100❤️, 20💬, 5🔁, 15🔖, 0👁️ = <strong>{exampleCarouselScore.toFixed(0)} pts</strong>
                    </p>
                    <p className="text-xs text-amber-400 mt-1">Vídeos com bom engajamento ganham bônus. Carrosséis nunca são penalizados.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Area Management ─────────────────────────────── */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> Gerenciar Áreas
              </CardTitle>
              <CardDescription>Adicionar ou remover áreas disponíveis para criadores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Nome da nova área..."
                  value={newArea}
                  onChange={e => setNewArea(e.target.value)}
                  className="bg-input border-border text-sm"
                  onKeyDown={e => e.key === "Enter" && handleAddArea()}
                />
                <Button size="sm" onClick={handleAddArea} disabled={!newArea.trim()}>Adicionar</Button>
              </div>
              {areas.length > 0 && (
                <div className="space-y-1">
                  {areas.map(a => (
                    <div key={a.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border">
                      <span className="text-sm">{a.name}</span>
                      <button
                        onClick={() => setDeleteAreaTarget(a)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? "Salvando e recalculando..." : "Salvar Configurações"}
          </Button>
        </div>
      )}

      {/* Delete Admin Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover admin?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.email}</strong> perderá o acesso ao painel administrativo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDeleteAdmin(deleteTarget)}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Area Confirmation */}
      <AlertDialog open={!!deleteAreaTarget} onOpenChange={open => !open && setDeleteAreaTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover área?</AlertDialogTitle>
            <AlertDialogDescription>
              A área <strong>{deleteAreaTarget?.name}</strong> será removida e todos os vínculos com criadores serão desfeitos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteAreaTarget) return;
                await supabase.from("areas").delete().eq("id", deleteAreaTarget.id);
                setAreas(prev => prev.filter(x => x.id !== deleteAreaTarget.id));
                setDeleteAreaTarget(null);
                toast({ title: "Área removida" });
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Content Type Create/Edit Dialog */}
      <Dialog open={ctDialogOpen} onOpenChange={(v) => { if (!v) setCtDialogOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{ctEdit ? "Editar Tipo de Conteúdo" : "Novo Tipo de Conteúdo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm mb-1.5 block">Nome *</Label>
                <Input placeholder="Ex: Tutorial" value={ctForm.label} onChange={e => setCtForm(f => ({ ...f, label: e.target.value }))} className="bg-input border-border" />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Emoji</Label>
                <Input placeholder="Ex: 🔧" value={ctForm.emoji} onChange={e => setCtForm(f => ({ ...f, emoji: e.target.value }))} className="bg-input border-border" />
              </div>
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Descrição</Label>
              <Input placeholder="Ex: Posts educativos, dicas" value={ctForm.description} onChange={e => setCtForm(f => ({ ...f, description: e.target.value }))} className="bg-input border-border" />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Multiplicador *</Label>
              <Input type="number" min={0} step={0.1} value={ctForm.multiplier} onChange={e => setCtForm(f => ({ ...f, multiplier: parseFloat(e.target.value) || 0 }))} className="bg-input border-border w-32" />
              <p className="text-xs text-muted-foreground mt-1">1.0 = neutro, 1.5 = bônus de 50%, 0.5 = reduz pela metade</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCtDialogOpen(false)} disabled={ctSaving}>Cancelar</Button>
            <Button disabled={ctSaving || !ctForm.label.trim()} onClick={async () => {
              setCtSaving(true);
              const key = ctEdit ? ctEdit.key : ctForm.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
              const payload = { key, label: ctForm.label.trim(), emoji: ctForm.emoji.trim() || "📝", description: ctForm.description.trim(), multiplier: ctForm.multiplier };
              const { error } = ctEdit
                ? await supabase.from("content_types").update(payload).eq("id", ctEdit.id)
                : await supabase.from("content_types").insert(payload);
              if (error) {
                toast({ title: "Erro", description: error.message, variant: "destructive" });
              } else {
                toast({ title: ctEdit ? "Tipo atualizado!" : "Tipo criado!" });
                setCtDialogOpen(false);
                reloadTypes();
              }
              setCtSaving(false);
            }}>
              {ctSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {ctEdit ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Content Type Confirmation */}
      <AlertDialog open={!!ctDeleteTarget} onOpenChange={(open) => { if (!open) setCtDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover tipo de conteúdo?</AlertDialogTitle>
            <AlertDialogDescription>
              O tipo <strong>"{ctDeleteTarget?.label}"</strong> será removido. Posts que usam esse tipo terão multiplicador neutro (1×).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!ctDeleteTarget) return;
                await supabase.from("content_types").delete().eq("id", ctDeleteTarget.id);
                setCtDeleteTarget(null);
                reloadTypes();
                toast({ title: "Tipo removido" });
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
