import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Post, Creator } from "@/lib/types";
import { PlatformBadge } from "@/components/PlatformBadge";
import { ContentTypeBadge } from "@/components/ContentTypeBadge";
import { FormatBadge } from "@/components/FormatBadge";
import { MediaTypeBadge } from "@/components/MediaTypeBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Search, Heart, MessageCircle, Share2, Bookmark, ExternalLink,
  Trash2, Pencil, CalendarDays, FileText, Eye, Repeat2, MousePointerClick, AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DisputeDialog } from "@/components/DisputeDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { PeriodSelector } from "@/components/PeriodSelector";
import { usePeriodFilter } from "@/hooks/use-period-filter";
import { useAreaCreatorIds } from "@/hooks/use-area-filter";

type PostWithCreators = Post & { post_creators: { creator: Creator }[] };

export default function Posts() {
  const [posts, setPosts] = useState<PostWithCreators[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "score">("date");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(50);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { inPeriod } = usePeriodFilter();
  const { matchesArea } = useAreaCreatorIds();
  const { isAdmin, user } = useAuth();
  const [disputePost, setDisputePost] = useState<{ id: string; title: string } | null>(null);

  async function load() {
    const { data } = await supabase
      .from("posts")
      .select("*, post_creators(creator:members(*))")
      .order("created_at", { ascending: false });
    if (data) setPosts(data as PostWithCreators[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function deletePost(id: string) {
    await supabase.from("posts").delete().eq("id", id);
    toast({ title: "Post removido!" });
    load();
  }

  const filtered = posts.filter(p => {
    const creatorNames = p.post_creators?.map(pc => pc.creator?.name || "").join(" ") || "";
    const matchSearch = (
      (p.title || p.url).toLowerCase().includes(search.toLowerCase()) ||
      creatorNames.toLowerCase().includes(search.toLowerCase())
    );
    const matchPlatform = platformFilter === "all" || p.platform === platformFilter;
    const matchFormat = formatFilter === "all" || (p.format || "feed") === formatFilter;
    const matchPeriod = inPeriod(p.posted_at || p.created_at);
    const matchArea = !p.post_creators?.length || p.post_creators.some(pc => pc.creator && matchesArea(pc.creator.id));
    return matchSearch && matchPlatform && matchFormat && matchPeriod && matchArea;
  }).sort((a, b) => sortBy === "score" ? b.score - a.score : new Date(b.posted_at || b.created_at).getTime() - new Date(a.posted_at || a.created_at).getTime());

  const platforms = Array.from(new Set(posts.map(p => p.platform))).sort();

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold">Conteúdos</h1>
          </div>
          <p className="text-muted-foreground text-sm">{filtered.length} posts{filtered.length !== posts.length ? ` de ${posts.length}` : ""}</p>
        </div>
        {user && (
          <Button asChild className="gradient-primary text-white border-0 glow-blue flex-shrink-0">
            <Link to="/posts/new"><Plus className="w-4 h-4 mr-1 md:mr-2" /> <span className="hidden sm:inline">Novo Post</span><span className="sm:hidden">Novo</span></Link>
          </Button>
        )}
      </div>

      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9 bg-card border-border" placeholder="Buscar por título ou criador..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Filters — horizontal scroll on mobile */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap scrollbar-none">
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-32 h-9 text-sm flex-shrink-0"><SelectValue placeholder="Plataforma" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {platforms.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={formatFilter} onValueChange={setFormatFilter}>
          <SelectTrigger className="w-32 h-9 text-sm flex-shrink-0"><SelectValue placeholder="Formato" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Feed + Stories</SelectItem>
            <SelectItem value="feed">Feed</SelectItem>
            <SelectItem value="stories">Stories</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={v => setSortBy(v as "date" | "score")}>
          <SelectTrigger className="w-36 h-9 text-sm flex-shrink-0"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Mais recente</SelectItem>
            <SelectItem value="score">Maior score</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-shrink-0"><PeriodSelector /></div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-card animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{search ? "Nenhum resultado." : "Nenhum post cadastrado ainda."}</p>
          {!search && user && <Button asChild className="gradient-primary text-white border-0"><Link to="/posts/new">Cadastrar primeiro post</Link></Button>}
        </div>
      ) : (
        <>
        <div className="space-y-3">
          {filtered.slice(0, visibleCount).map(post => {
            const isStories = (post.format || "feed") === "stories";
            return (
              <div key={post.id} className="bg-card border border-border rounded-xl p-5 card-glow">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <PlatformBadge platform={post.platform} />
                      <FormatBadge format={post.format || "feed"} />
                      {!isStories && <MediaTypeBadge mediaType={(post as any).media_type || "static"} />}
                      {!isStories && <ContentTypeBadge contentType={(post as any).content_type ?? null} />}
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
                      {isStories ? (
                        <>
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{(post.views_pico ?? 0).toLocaleString()} pico</span>
                          <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{(post.interactions ?? 0).toLocaleString()}</span>
                          <span className="flex items-center gap-1"><Repeat2 className="w-3 h-3" />{(post.forwards ?? 0).toLocaleString()}</span>
                          <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" />{(post.cta_clicks ?? 0).toLocaleString()}</span>
                        </>
                      ) : (
                        <>
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{(post.views ?? 0).toLocaleString()}</span>
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes.toLocaleString()}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{post.comments.toLocaleString()}</span>
                          <span className="flex items-center gap-1"><Share2 className="w-3 h-3" />{post.shares.toLocaleString()}</span>
                          <span className="flex items-center gap-1"><Bookmark className="w-3 h-3" />{post.saves.toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                   <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-2xl font-bold gradient-text">{post.score.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">pontos</p>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="w-8 h-8 hover:text-primary" onClick={() => navigate(`/posts/${post.id}/edit`)}>
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
                    )}
                    {user && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs gap-1 text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
                        onClick={() => setDisputePost({ id: post.id, title: post.title || post.url })}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        Contestar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {visibleCount < filtered.length && (
          <div className="flex justify-center mt-6">
            <Button variant="outline" onClick={() => setVisibleCount(v => v + 50)} className="border-border">
              Carregar mais ({filtered.length - visibleCount} restantes)
            </Button>
          </div>
        )}
        </>
      )}

      {disputePost && (
        <DisputeDialog
          open={!!disputePost}
          onClose={() => setDisputePost(null)}
          postId={disputePost.id}
          postTitle={disputePost.title}
        />
      )}
    </div>
  );
}
