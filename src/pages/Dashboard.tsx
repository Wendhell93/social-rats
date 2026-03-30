import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Users, FileText, Trophy, TrendingUp, Heart, MessageCircle, Share2, Bookmark, Eye, RefreshCw, Clock, CheckCircle2, XCircle, Loader2, Instagram, Youtube, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePeriodFilter } from "@/hooks/use-period-filter";
import { useAreaCreatorIds } from "@/hooks/use-area-filter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type PostRow = { id: string; score: number; likes: number; comments: number; shares: number; saves: number; views: number; created_at: string };
type PostCreatorRow = { creator_id: string; post: { id: string; score: number; created_at: string } | null };
type MemberRow = { id: string; name: string; role: string | null; avatar_url: string | null };
type TopCreator = { id: string; name: string; role: string | null; avatar_url: string | null; score: number; post_count: number };

export default function Dashboard() {
  const [allPosts, setAllPosts] = useState<PostRow[]>([]);
  const [allPostCreators, setAllPostCreators] = useState<PostCreatorRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { inPeriod } = usePeriodFilter();
  const { matchesArea } = useAreaCreatorIds();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [lastScrape, setLastScrape] = useState<{
    status: string;
    triggered_by: string;
    started_at: string;
    finished_at: string | null;
    posts_total: number | null;
    posts_updated: number | null;
    posts_failed: number | null;
  } | null>(null);

  async function loadLastScrape() {
    const { data } = await supabase
      .from("scrape_logs")
      .select("status, triggered_by, started_at, finished_at, posts_total, posts_updated, posts_failed")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();
    if (data) setLastScrape(data as any);
  }

  useEffect(() => {
    async function load() {
      const [{ data: posts }, { data: pc }, { data: m }] = await Promise.all([
        supabase.from("posts").select("id, score, likes, comments, shares, saves, views, created_at"),
        supabase.from("post_creators").select("creator_id, post:posts(id, score, created_at)"),
        supabase.from("members").select("id, name, role, avatar_url"),
      ]);
      if (posts) setAllPosts(posts as PostRow[]);
      if (pc) setAllPostCreators(pc as PostCreatorRow[]);
      if (m) setMembers(m);
      setLoading(false);
    }
    load();
    loadLastScrape();
  }, []);

  const filteredPc = useMemo(() => allPostCreators.filter(pc => pc.post && inPeriod(pc.post.created_at) && matchesArea(pc.creator_id)), [allPostCreators, inPeriod, matchesArea]);

  // Post IDs that have at least one creator matching the area
  const areaPostIds = useMemo(() => new Set(filteredPc.map(pc => pc.post!.id)), [filteredPc]);
  const filteredPosts = useMemo(() => allPosts.filter(p => inPeriod(p.created_at) && areaPostIds.has(p.id)), [allPosts, inPeriod, areaPostIds]);

  const filteredMembers = useMemo(() => members.filter(m => matchesArea(m.id)), [members, matchesArea]);

  const stats = useMemo(() => ({
    creators: filteredMembers.length,
    posts: filteredPosts.length,
    totalScore: filteredPosts.reduce((a, p) => a + (p.score || 0), 0),
    totalViews: filteredPosts.reduce((a, p) => a + (p.views || 0), 0),
    totalLikes: filteredPosts.reduce((a, p) => a + (p.likes || 0), 0),
    totalComments: filteredPosts.reduce((a, p) => a + (p.comments || 0), 0),
    totalShares: filteredPosts.reduce((a, p) => a + (p.shares || 0), 0),
    totalSaves: filteredPosts.reduce((a, p) => a + (p.saves || 0), 0),
  }), [filteredPosts, filteredMembers]);

  const topCreators = useMemo(() => {
    const map: Record<string, number> = {};
    const countMap: Record<string, number> = {};
    filteredPc.forEach((pc) => {
      map[pc.creator_id] = (map[pc.creator_id] || 0) + (pc.post?.score || 0);
      countMap[pc.creator_id] = (countMap[pc.creator_id] || 0) + 1;
    });
    return filteredMembers
      .map(c => ({ ...c, score: map[c.id] || 0, post_count: countMap[c.id] || 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [filteredPc, filteredMembers]);

  const statCards = [
    { label: "Criadores", value: stats.creators, icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Posts no período", value: stats.posts, icon: FileText, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "Score Total", value: stats.totalScore.toLocaleString(), icon: Trophy, color: "text-amber-400", bg: "bg-amber-400/10" },
  ];

  const engagementCards = [
    { label: "Visualizações", value: stats.totalViews, icon: Eye },
    { label: "Curtidas", value: stats.totalLikes, icon: Heart },
    { label: "Comentários", value: stats.totalComments, icon: MessageCircle },
    { label: "Compartilhamentos", value: stats.totalShares, icon: Share2 },
    { label: "Salvamentos", value: stats.totalSaves, icon: Bookmark },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Banner */}
      <div className="relative w-full h-48 md:h-64 overflow-hidden rounded-none md:rounded-b-2xl">
        <img
          src="/hero-banner.png"
          alt="SocialRats"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutDashboard className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-bold">Dashboard</h1>
            </div>
            <p className="text-muted-foreground text-sm">Visão geral do desempenho de conteúdo</p>
          </div>
          {isAdmin && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1.5"
              disabled={refreshing}
              onClick={async () => {
                setRefreshing(true);
                try {
                  const res = await fetch("https://kcfopagleppcazuodyal.supabase.co/functions/v1/refresh-all-metrics", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ""}`,
                      "x-refresh-secret": import.meta.env.VITE_REFRESH_SECRET || "",
                    },
                    body: JSON.stringify({ triggered_by: "manual", days_back: 30 }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    toast({ title: "Métricas atualizadas!", description: `${data.posts_updated} posts atualizados, ${data.posts_failed} falharam.` });
                    // Reload data
                    const [{ data: posts }, { data: pc }] = await Promise.all([
                      supabase.from("posts").select("id, score, likes, comments, shares, saves, views, created_at"),
                      supabase.from("post_creators").select("creator_id, post:posts(id, score, created_at)"),
                    ]);
                    if (posts) setAllPosts(posts as PostRow[]);
                    if (pc) setAllPostCreators(pc as PostCreatorRow[]);
                    loadLastScrape();
                  } else {
                    toast({ title: "Erro ao atualizar", description: data.error || "Tente novamente.", variant: "destructive" });
                  }
                } catch (err: any) {
                  toast({ title: "Erro", description: err?.message, variant: "destructive" });
                } finally {
                  setRefreshing(false);
                }
              }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Atualizando..." : "Atualizar métricas"}
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 md:p-8">

      {loading ? (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1,2,3].map(i => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {statCards.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-5 card-glow">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {engagementCards.map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
                <p className="text-xl font-bold">{value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Supported Platforms */}
          <div className="flex items-center gap-3 mb-8 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Plataformas:</span>
            {[
              { label: "Instagram", icon: Instagram, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
              { label: "TikTok", color: "text-foreground", bg: "bg-muted border-border", emoji: "🎵" },
              { label: "YouTube", icon: Youtube, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
              { label: "Twitter / X", icon: Twitter, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
              { label: "Reddit", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", emoji: "🤖" },
            ].map(({ label, icon: Icon, color, bg, emoji }) => (
              <span key={label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${bg} ${color}`}>
                {Icon ? <Icon className="w-3.5 h-3.5" /> : <span className="text-sm leading-none">{emoji}</span>}
                {label}
              </span>
            ))}
          </div>

          {/* Scrape Status Card (admin only) */}
          {isAdmin && lastScrape && (
            <div className={`border rounded-xl p-4 mb-8 flex items-center gap-4 ${
              lastScrape.status === "done"
                ? "bg-green-500/5 border-green-500/30"
                : lastScrape.status === "error"
                ? "bg-red-500/5 border-red-500/30"
                : "bg-yellow-500/5 border-yellow-500/30"
            }`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                lastScrape.status === "done"
                  ? "bg-green-500/15"
                  : lastScrape.status === "error"
                  ? "bg-red-500/15"
                  : "bg-yellow-500/15"
              }`}>
                {lastScrape.status === "done" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : lastScrape.status === "error" ? (
                  <XCircle className="w-5 h-5 text-red-400" />
                ) : (
                  <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {lastScrape.status === "done"
                    ? "Scraping concluido"
                    : lastScrape.status === "error"
                    ? "Scraping falhou"
                    : "Scraping em andamento..."}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lastScrape.triggered_by === "cron" ? "Agendado (4h)" : "Manual"}
                  {" \u2022 "}
                  {new Date(lastScrape.started_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  {lastScrape.status === "done" && lastScrape.posts_total != null && (
                    <> {" \u2022 "} {lastScrape.posts_updated}/{lastScrape.posts_total} posts atualizados
                    {(lastScrape.posts_failed ?? 0) > 0 && (
                      <span className="text-red-400"> ({lastScrape.posts_failed} falharam)</span>
                    )}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                <Clock className="w-3.5 h-3.5" />
                <span>Prox: 4h</span>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h2 className="font-semibold">Top 5 Criadores</h2>
              </div>
              <Link to="/ranking" className="text-xs text-primary hover:underline">Ver ranking completo →</Link>
            </div>
            {topCreators.filter(c => c.score > 0).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-3">Nenhum dado para este período.</p>
                <Button asChild size="sm" className="gradient-primary text-white border-0">
                  <Link to="/posts/new">Cadastrar primeiro post</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {topCreators.filter(c => c.score > 0).map((creator, i) => (
                  <Link key={creator.id} to={`/creators/${creator.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                    <div className="relative flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden ${
                        !creator.avatar_url ? (
                          i === 0 ? "bg-amber-400/20 text-amber-400" :
                          i === 1 ? "bg-slate-400/20 text-slate-400" :
                          i === 2 ? "bg-orange-400/20 text-orange-400" :
                          "bg-muted text-muted-foreground"
                        ) : ""
                      }`}>
                        {creator.avatar_url
                          ? <img src={creator.avatar_url} alt={creator.name} className="w-full h-full object-cover" />
                          : creator.name.charAt(0).toUpperCase()
                        }
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold border border-card ${
                        i === 0 ? "bg-amber-400 text-amber-950" :
                        i === 1 ? "bg-slate-400 text-slate-950" :
                        i === 2 ? "bg-orange-400 text-orange-950" :
                        "bg-muted text-muted-foreground"
                      }`}>{i + 1}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{creator.name}</p>
                      {creator.role && <p className="text-xs text-muted-foreground truncate">{creator.role}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{creator.score.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">{creator.post_count} posts</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      </div>
    </div>
  );
}
