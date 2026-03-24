import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Creator, Post, EngagementWeights } from "@/lib/types";
import { PlatformBadge } from "@/components/PlatformBadge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Heart, MessageCircle, Share2, Bookmark, Trophy, FileText, TrendingUp, ExternalLink, CalendarDays, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type PostWithCreators = Post & { post_creators: { creator: Creator }[] };

export default function CreatorProfile() {
  const { id } = useParams<{ id: string }>();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [posts, setPosts] = useState<PostWithCreators[]>([]);
  const [weights, setWeights] = useState<EngagementWeights | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: pc }, { data: w }, { data: allPC }] = await Promise.all([
        supabase.from("members").select("*").eq("id", id!).single(),
        supabase.from("post_creators").select("post:posts(*, post_creators(creator:members(*)))").eq("creator_id", id!),
        supabase.from("engagement_weights").select("*").limit(1).single(),
        supabase.from("post_creators").select("creator_id, post:posts(score)"),
      ]);

      if (c) setCreator(c);
      if (w) setWeights(w);

      const creatorPosts = (pc || []).map((p: any) => p.post).filter(Boolean);
      setPosts(creatorPosts);

      // Calculate rank
      if (allPC) {
        const scoreMap: Record<string, number> = {};
        allPC.forEach((r: any) => {
          scoreMap[r.creator_id] = (scoreMap[r.creator_id] || 0) + (r.post?.score || 0);
        });
        const sorted = Object.entries(scoreMap).sort((a, b) => b[1] - a[1]);
        const myRank = sorted.findIndex(([cid]) => cid === id) + 1;
        setRank(myRank || null);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div className="p-4 md:p-8"><div className="h-40 bg-card rounded-xl animate-pulse" /></div>;
  if (!creator) return <div className="p-4 md:p-8 text-muted-foreground">Criador não encontrado.</div>;

  const totalScore = posts.reduce((a, p) => a + (p.score || 0), 0);
  const totalViews = posts.reduce((a, p) => a + (p.views || 0), 0);
  const totalLikes = posts.reduce((a, p) => a + (p.likes || 0), 0);
  const totalComments = posts.reduce((a, p) => a + (p.comments || 0), 0);
  const totalShares = posts.reduce((a, p) => a + (p.shares || 0), 0);
  const totalSaves = posts.reduce((a, p) => a + (p.saves || 0), 0);

  // Chart data - score over time
  const chartData = [...posts]
    .filter(p => p.posted_at)
    .sort((a, b) => new Date(a.posted_at!).getTime() - new Date(b.posted_at!).getTime())
    .map(p => ({
      date: format(new Date(p.posted_at!), "dd/MM", { locale: ptBR }),
      score: p.score,
    }));

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <Link to="/creators" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar para Criadores
      </Link>

      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-5 md:p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center flex-shrink-0 border border-primary/20 glow-blue">
            {creator.avatar_url ? (
              <img src={creator.avatar_url} alt={creator.name} className="w-20 h-20 rounded-2xl object-cover" />
            ) : (
              <User className="w-8 h-8 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{creator.name}</h1>
            {creator.role && <p className="text-muted-foreground">{creator.role}</p>}
            {rank && (
              <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-amber-400">#{rank} no ranking geral</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Score Total", value: totalScore.toLocaleString(), icon: Trophy, color: "text-amber-400", bg: "bg-amber-400/10" },
          { label: "Posts", value: posts.length, icon: FileText, color: "text-primary", bg: "bg-primary/10" },
          { label: "Visualizações", value: totalViews.toLocaleString(), icon: Eye, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Curtidas", value: totalLikes.toLocaleString(), icon: Heart, color: "text-pink-400", bg: "bg-pink-400/10" },
          { label: "Comentários", value: totalComments.toLocaleString(), icon: MessageCircle, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Salvamentos", value: totalSaves.toLocaleString(), icon: Bookmark, color: "text-secondary", bg: "bg-secondary/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-lg font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm">Evolução do Score por Post</h2>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={{ background: "hsl(225 22% 11%)", border: "1px solid hsl(225 20% 18%)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "hsl(210 40% 96%)" }}
              />
              <Area type="monotone" dataKey="score" stroke="hsl(217 91% 60%)" strokeWidth={2} fill="url(#scoreGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Posts */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">{posts.length} Conteúdos Vinculados</h2>
        </div>
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Nenhum conteúdo vinculado ainda.</p>
        ) : (
          <div className="space-y-3">
            {posts.map(post => (
              <div key={post.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <PlatformBadge platform={post.platform} />
                    {post.posted_at && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {format(new Date(post.posted_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{post.title || post.url}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{(post.views ?? 0).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{post.comments.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Share2 className="w-3 h-3" />{post.shares.toLocaleString()}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-primary">{post.score.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">pts</p>
                </div>
                <a href={post.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
