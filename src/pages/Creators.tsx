import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Creator } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, User, Upload, X, Link as LinkIcon, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export default function Creators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [creatorScores, setCreatorScores] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editCreator, setEditCreator] = useState<Creator | null>(null);
  const [form, setForm] = useState({ name: "", role: "", avatar_url: "" });
  const [saving, setSaving] = useState(false);
  const [avatarTab, setAvatarTab] = useState<"url" | "upload">("url");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  async function load() {
    const [{ data: members }, { data: pc }] = await Promise.all([
      supabase.from("members").select("*").order("name"),
      supabase.from("post_creators").select("creator_id, post:posts(score)"),
    ]);
    if (members) setCreators(members);
    if (pc) {
      const scores: Record<string, number> = {};
      (pc as any[]).forEach(row => {
        if (row.post?.score) scores[row.creator_id] = (scores[row.creator_id] || 0) + row.post.score;
      });
      setCreatorScores(scores);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditCreator(null);
    setForm({ name: "", role: "", avatar_url: "" });
    setAvatarTab("url");
    setUploadFile(null);
    setUploadPreview(null);
    setOpen(true);
  }

  function openEdit(c: Creator) {
    setEditCreator(c);
    setForm({ name: c.name, role: c.role || "", avatar_url: c.avatar_url || "" });
    setAvatarTab("url");
    setUploadFile(null);
    setUploadPreview(null);
    setOpen(true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
  }

  async function uploadAvatar(): Promise<string | null> {
    if (!uploadFile) return null;
    setUploading(true);
    const ext = uploadFile.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, uploadFile, { upsert: true });
    setUploading(false);
    if (error) {
      toast({ title: "Erro ao fazer upload", description: error.message, variant: "destructive" });
      return null;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  }

  async function save() {
    if (!form.name.trim()) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    setSaving(true);
    let avatar_url = form.avatar_url.trim() || null;
    if (avatarTab === "upload" && uploadFile) {
      const url = await uploadAvatar();
      if (!url) { setSaving(false); return; }
      avatar_url = url;
    }
    const payload = { name: form.name.trim(), role: form.role.trim() || null, avatar_url };
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
        {isAdmin && (
          <Button onClick={openNew} className="gradient-primary text-white border-0 glow-blue">
            <Plus className="w-4 h-4 mr-2" /> Novo Criador
          </Button>
        )}
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
                <div className="flex items-start gap-3 mb-3">
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
                    <p className="text-xs font-bold text-primary mt-1 flex items-center gap-1">
                      <Star className="w-3 h-3" />{(creatorScores[c.id] || 0).toFixed(0)} pts
                    </p>
                  </div>
                </div>
              <div className="flex items-center gap-2">
                <Link to={`/creators/${c.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs border-border hover:border-primary hover:text-primary">Ver perfil</Button>
                </Link>
                <Button variant="outline" size="sm" className="text-xs border-border hover:border-primary" onClick={() => openEdit(c)}>Editar</Button>
                <Button variant="outline" size="sm" className="text-xs border-border hover:border-primary" onClick={() => openEdit(c)}>Editar</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive">✕</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover criador?</AlertDialogTitle>
                      <AlertDialogDescription>Esta ação não pode ser desfeita. Todos os dados de {c.name} serão removidos.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => del(c.id)} className="bg-destructive text-destructive-foreground">Remover</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
              <Label className="text-sm mb-1.5 block">Avatar</Label>
              <Tabs value={avatarTab} onValueChange={v => setAvatarTab(v as "url" | "upload")}>
                <TabsList className="mb-3 bg-muted/40 border border-border h-9">
                  <TabsTrigger value="url" className="text-xs gap-1.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                    <LinkIcon className="w-3 h-3" /> URL
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="text-xs gap-1.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                    <Upload className="w-3 h-3" /> Upload
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="url">
                  <Input placeholder="https://..." value={form.avatar_url} onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))} className="bg-input border-border" />
                </TabsContent>
                <TabsContent value="upload">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  {uploadPreview ? (
                    <div className="relative w-fit">
                      <img src={uploadPreview} alt="preview" className="w-20 h-20 rounded-full object-cover border-2 border-primary/40" />
                      <button
                        onClick={() => { setUploadFile(null); setUploadPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-24 rounded-lg border-2 border-dashed border-border hover:border-primary/60 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Upload className="w-6 h-6" />
                      <span className="text-xs">Clique para selecionar imagem</span>
                    </button>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="border-border">Cancelar</Button>
            <Button onClick={save} disabled={saving || uploading} className="gradient-primary text-white border-0">
              {saving || uploading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
