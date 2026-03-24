import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ScrollText, Plus, Pencil, Trash2, Pin, Search, Loader2,
  ShieldCheck, CheckCircle, XCircle, AlertTriangle, Bell, Megaphone,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const CATEGORIES = [
  { value: "boas-praticas", label: "Boas Práticas", icon: ShieldCheck, color: "bg-green-500/15 text-green-400 border-green-500/30" },
  { value: "permitido", label: "Permitido", icon: CheckCircle, color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  { value: "proibido", label: "Proibido", icon: XCircle, color: "bg-red-500/15 text-red-400 border-red-500/30" },
  { value: "alertas", label: "Alertas", icon: AlertTriangle, color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  { value: "atualizacoes", label: "Atualizações", icon: Bell, color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  { value: "divulgacoes", label: "Divulgações", icon: Megaphone, color: "bg-pink-500/15 text-pink-400 border-pink-500/30" },
] as const;

interface Policy {
  id: string;
  title: string;
  body: string;
  category: string;
  is_pinned: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

function getCat(value: string) {
  return CATEGORIES.find(c => c.value === value) || CATEGORIES[0];
}

function CategoryBadge({ category }: { category: string }) {
  const cat = getCat(category);
  const Icon = cat.icon;
  return (
    <Badge className={`${cat.color} text-xs gap-1 border`}>
      <Icon className="w-3 h-3" />{cat.label}
    </Badge>
  );
}

export default function Policies() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPolicy, setEditPolicy] = useState<Policy | null>(null);
  const [form, setForm] = useState({ title: "", body: "", category: "boas-praticas", is_pinned: false });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Policy | null>(null);

  async function load() {
    const { data } = await supabase
      .from("policies")
      .select("*")
      .eq("is_published", true)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    if (data) setPolicies(data as Policy[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditPolicy(null);
    setForm({ title: "", body: "", category: "boas-praticas", is_pinned: false });
    setDialogOpen(true);
  }

  function openEdit(p: Policy) {
    setEditPolicy(p);
    setForm({ title: p.title, body: p.body, category: p.category, is_pinned: p.is_pinned });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast({ title: "Título obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      category: form.category,
      is_pinned: form.is_pinned,
      is_published: true,
      updated_at: new Date().toISOString(),
    };

    const { error } = editPolicy
      ? await supabase.from("policies").update(payload).eq("id", editPolicy.id)
      : await supabase.from("policies").insert(payload);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editPolicy ? "Artigo atualizado!" : "Artigo publicado!" });
      setDialogOpen(false);
      load();
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from("policies").delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
    toast({ title: "Artigo removido" });
    load();
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const filtered = policies.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.body.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || p.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="p-4 md:p-8 max-w-4xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ScrollText className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold">Políticas</h1>
          </div>
          <p className="text-muted-foreground text-sm">Regras, boas práticas e comunicados</p>
        </div>
        {isAdmin && (
          <Button onClick={openNew} className="flex-shrink-0">
            <Plus className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Novo artigo</span><span className="sm:hidden">Novo</span>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 bg-card border-border text-sm h-9" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-44 h-9 text-xs">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl bg-card animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <ScrollText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">{search || catFilter !== "all" ? "Nenhum resultado." : "Nenhum artigo publicado."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(p => {
            const isExpanded = expanded.has(p.id);
            const isLong = p.body.length > 200;
            return (
              <Card key={p.id} className="bg-card border-border overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <CategoryBadge category={p.category} />
                        {p.is_pinned && (
                          <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
                            <Pin className="w-3 h-3" />Fixado
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(p.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <h3 className="font-semibold text-base">{p.title}</h3>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="w-8 h-8 hover:text-primary" onClick={() => openEdit(p)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(p)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {isLong && !isExpanded ? (
                      <>
                        {p.body.slice(0, 200)}...
                        <button onClick={() => toggleExpand(p.id)} className="text-primary hover:underline ml-1 text-xs font-medium">
                          Ler mais
                        </button>
                      </>
                    ) : (
                      <>
                        {p.body}
                        {isLong && (
                          <button onClick={() => toggleExpand(p.id)} className="text-primary hover:underline ml-1 text-xs font-medium block mt-2">
                            Mostrar menos
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) setDialogOpen(false); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPolicy ? "Editar Artigo" : "Novo Artigo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm mb-1.5 block">Título *</Label>
              <Input
                placeholder="Título do artigo"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="bg-input border-border"
              />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Categoria</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Conteúdo</Label>
              <Textarea
                placeholder="Escreva o conteúdo do artigo..."
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                className="min-h-[200px] resize-y bg-input border-border"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_pinned}
                onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))}
                className="rounded border-border"
              />
              <span className="text-sm flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5 text-primary" /> Fixar no topo
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editPolicy ? "Salvar" : "Publicar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover artigo?</AlertDialogTitle>
            <AlertDialogDescription>
              O artigo <strong>"{deleteTarget?.title}"</strong> será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
