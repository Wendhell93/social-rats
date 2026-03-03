import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Post, calcScore, EngagementWeights } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformBadge } from "@/components/PlatformBadge";
import { Plus, Search, Heart, MessageCircle, Share2, Bookmark, ExternalLink, Trash2, Pencil, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [weights, setWeights] = useState<EngagementWeights | null>(null);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [editMetrics, setEditMetrics] = useState({ likes: 0, comments: 0, shares: 0, saves: 0 });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function load() {
    const [{ data }, { data: w }] = await Promise.all([
      supabase.from("posts").select("*, member:members(*)").order("created_at", { ascending: false }),
      supabase.from("engagement_weights").select("*").limit(1).single(),
    ]);
    if (data) setPosts(data as Post[]);
    if (w) setWeights(w);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function deletePost(id: string) {
    await supabase.from("posts").delete().eq("id", id);
    toast({ title: "Post removido!" });
    load();
  }

  function openEdit(post: Post) {
    setEditPost(post);
    setEditMetrics({ likes: post.likes, comments: post.comments, shares: post.shares, saves: post.saves });
  }

  async function saveEdit() {
    if (!editPost) return;
    setSaving(true);
    const score = weights ? calcScore(editMetrics, weights) : editPost.score;
    const { error } = await supabase.from("posts").update({ ...editMetrics, score }).eq("id", editPost.id);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Métricas atualizadas!" });
      setEditPost(null);
      load();
    }
    setSaving(false);
  }

  const filtered = posts.filter(
    (p) =>
      (p.title || p.url).toLowerCase().includes(search.toLowerCase()) ||
      (p.member as any)?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const editScore = weights && editPost ? calcScore(editMetrics, weights) : 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Conteúdos</h1>
          <p className="text-muted-foreground text-sm mt-1">{posts.length} posts cadastrados</p>
        </div>
        <Button asChild>
          <Link to="/posts/new"><Plus className="w-4 h-4 mr-2" /> Novo Post</Link>
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por título ou membro..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">{search ? "Nenhum resultado encontrado." : "Nenhum post cadastrado ainda."}</p>
          {!search && <Button asChild><Link to="/posts/new">Cadastrar primeiro post</Link></Button>}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {post.thumbnail_url && (
                    <img src={post.thumbnail_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <PlatformBadge platform={post.platform} />
                      <span className="text-sm text-muted-foreground">{(post.member as any)?.name}</span>
                    </div>
                    <p className="font-medium truncate">{post.title || post.url}</p>
                    <a href={post.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-0.5 truncate">
                      <ExternalLink className="w-3 h-3 flex-shrink-0" /> {post.url}
                    </a>
                    {post.posted_at && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <CalendarDays className="w-3 h-3" />
                        {format(new Date(post.posted_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{post.likes.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{post.comments.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><Share2 className="w-3.5 h-3.5" />{post.shares.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><Bookmark className="w-3.5 h-3.5" />{post.saves.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{post.score.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">pontos</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(post)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover post?</AlertDialogTitle>
                            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deletePost(post.id)} className="bg-destructive text-destructive-foreground">Remover</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editPost} onOpenChange={(open) => !open && setEditPost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Métricas</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
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
                  value={editMetrics[key as keyof typeof editMetrics]}
                  onChange={(e) => setEditMetrics((m) => ({ ...m, [key]: parseInt(e.target.value) || 0 }))}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">Novo score:</span>
            <span className="text-xl font-bold text-primary">{editScore.toFixed(0)} pts</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPost(null)}>Cancelar</Button>
            <Button onClick={saveEdit} disabled={saving}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
