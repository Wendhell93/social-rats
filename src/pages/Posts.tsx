import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Post, Creator, EngagementWeights, calcScore } from "@/lib/types";
import { PlatformBadge } from "@/components/PlatformBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search, Heart, MessageCircle, Share2, Bookmark, ExternalLink, Trash2, Pencil, CalendarDays, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type PostWithCreators = Post & { post_creators: { creator: Creator }[] };

export default function Posts() {
  const [posts, setPosts] = useState<PostWithCreators[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [weights, setWeights] = useState<EngagementWeights | null>(null);
  const [editPost, setEditPost] = useState<PostWithCreators | null>(null);
  const [editMetrics, setEditMetrics] = useState({ likes: 0, comments: 0, shares: 0, saves: 0 });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function load() {
    const [{ data }, { data: w }] = await Promise.all([
      supabase.from("posts").select("*, post_creators(creator:members(*))").order("created_at", { ascending: false }),
      supabase.from("engagement_weights").select("*").limit(1).single(),
    ]);
    if (data) setPosts(data as PostWithCreators[]);
    if (w) setWeights(w);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function deletePost(id: string) {
    await supabase.from("posts").delete().eq("id", id);
    toast({ title: "Post removido!" });
    load();
  }

  function openEdit(post: PostWithCreators) {
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

  const filtered = posts.filter(p => {
    const creatorNames = p.post_creators?.map(pc => pc.creator?.name || "").join(" ") || "";
    return (
      (p.title || p.url).toLowerCase().includes(search.toLowerCase()) ||
      creatorNames.toLowerCase().includes(search.toLowerCase())
    );
  });

  const editScore = weights && editPost ? calcScore(editMetrics, weights) : 0;

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold">Conteúdos</h1>
          </div>
          <p className="text-muted-foreground text-sm">{posts.length} posts cadastrados</p>
        </div>
        <Button asChild className="gradient-primary text-white border-0 glow-blue">
          <Link to="/posts/new"><Plus className="w-4 h-4 mr-2" /> Novo Post</Link>
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9 bg-card border-border" placeholder="Buscar por título ou criador..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-card animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{search ? "Nenhum resultado." : "Nenhum post cadastrado ainda."}</p>
          {!search && <Button asChild className="gradient-primary text-white border-0"><Link to="/posts/new">Cadastrar primeiro post</Link></Button>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(post => (
            <div key={post.id} className="bg-card border border-border rounded-xl p-5 card-glow">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <PlatformBadge platform={post.platform} />
                    {post.post_creators?.map(pc => pc.creator && (
                      <Link key={pc.creator.id} to={`/creators/${pc.creator.id}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                        {pc.creator.name}
                      </Link>
                    ))}
                    {post.posted_at && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                        <CalendarDays className="w-3 h-3" />
                        {format(new Date(post.posted_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                  <p className="font-medium truncate text-sm">{post.title || post.url}</p>
                  <a href={post.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-0.5 truncate">
                    <ExternalLink className="w-3 h-3 flex-shrink-0" /> {post.url}
                  </a>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{post.comments.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Share2 className="w-3 h-3" />{post.shares.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Bookmark className="w-3 h-3" />{post.saves.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-2xl font-bold gradient-text">{post.score.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">pontos</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="w-8 h-8 hover:text-primary" onClick={() => openEdit(post)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover post?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deletePost(post.id)} className="bg-destructive text-destructive-foreground">Remover</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editPost} onOpenChange={open => !open && setEditPost(null)}>
        <DialogContent className="bg-card border-border">
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
                  type="number" min={0} className="bg-input border-border"
                  value={editMetrics[key as keyof typeof editMetrics]}
                  onChange={e => setEditMetrics(m => ({ ...m, [key]: parseInt(e.target.value) || 0 }))}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm text-muted-foreground">Novo score:</span>
            <span className="text-xl font-bold gradient-text">{editScore.toFixed(0)} pts</span>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-border" onClick={() => setEditPost(null)}>Cancelar</Button>
            <Button onClick={saveEdit} disabled={saving} className="gradient-primary text-white border-0">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
