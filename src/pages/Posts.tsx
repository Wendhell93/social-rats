import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Post } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlatformBadge } from "@/components/PlatformBadge";
import { Plus, Search, Heart, MessageCircle, Share2, Bookmark, ExternalLink, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  async function load() {
    const { data } = await supabase.from("posts").select("*, member:members(*)").order("created_at", { ascending: false });
    if (data) setPosts(data as Post[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function deletePost(id: string) {
    await supabase.from("posts").delete().eq("id", id);
    toast({ title: "Post removido!" });
    load();
  }

  const filtered = posts.filter(
    (p) =>
      (p.title || p.url).toLowerCase().includes(search.toLowerCase()) ||
      (p.member as any)?.name?.toLowerCase().includes(search.toLowerCase())
  );

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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
