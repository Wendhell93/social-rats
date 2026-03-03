import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Creator } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Creators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editCreator, setEditCreator] = useState<Creator | null>(null);
  const [form, setForm] = useState({ name: "", role: "", avatar_url: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function load() {
    const { data } = await supabase.from("members").select("*").order("name");
    if (data) setCreators(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditCreator(null);
    setForm({ name: "", role: "", avatar_url: "" });
    setOpen(true);
  }

  function openEdit(c: Creator) {
    setEditCreator(c);
    setForm({ name: c.name, role: c.role || "", avatar_url: c.avatar_url || "" });
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    setSaving(true);
    const payload = { name: form.name.trim(), role: form.role.trim() || null, avatar_url: form.avatar_url.trim() || null };
    const { error } = editCreator
      ? await supabase.from("members").update(payload).eq("id", editCreator.id)
      : await supabase.from("members").insert(payload);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editCreator ? "Criador atualizado!" : "Criador cadastrado!" });
      setOpen(false);
      load();
    }
    setSaving(false);
  }

  async function del(id: string) {
    await supabase.from("members").delete().eq("id", id);
    toast({ title: "Criador removido" });
    load();
  }

  const filtered = creators.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.role || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold">Criadores</h1>
          </div>
          <p className="text-muted-foreground text-sm">{creators.length} criadores cadastrados</p>
        </div>
        <Button onClick={openNew} className="gradient-primary text-white border-0 glow-blue">
          <Plus className="w-4 h-4 mr-2" /> Novo Criador
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9 bg-card border-border" placeholder="Buscar criador..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-32 rounded-xl bg-card animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{search ? "Nenhum resultado." : "Nenhum criador cadastrado."}</p>
          {!search && <Button onClick={openNew}>Cadastrar primeiro criador</Button>}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-5 card-glow group">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center flex-shrink-0 border border-primary/20">
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt={c.name} className="w-12 h-12 rounded-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <User className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{c.name}</p>
                  {c.role && <p className="text-xs text-muted-foreground truncate">{c.role}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link to={`/creators/${c.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs border-border hover:border-primary hover:text-primary">Ver perfil</Button>
                </Link>
                <Button variant="outline" size="sm" className="text-xs border-border hover:border-primary" onClick={() => openEdit(c)}>Editar</Button>
                <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive" onClick={() => del(c.id)}>✕</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editCreator ? "Editar Criador" : "Novo Criador"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm mb-1.5 block">Nome *</Label>
              <Input placeholder="Nome do criador" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-input border-border" />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Cargo / Função</Label>
              <Input placeholder="Ex: Motion Designer, Videomaker..." value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="bg-input border-border" />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">URL do Avatar</Label>
              <Input placeholder="https://..." value={form.avatar_url} onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))} className="bg-input border-border" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="border-border">Cancelar</Button>
            <Button onClick={save} disabled={saving} className="gradient-primary text-white border-0">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
