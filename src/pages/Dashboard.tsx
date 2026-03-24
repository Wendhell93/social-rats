import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Users, FileText, Trophy, TrendingUp, Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePeriodFilter } from "@/hooks/use-period-filter";

type PostRow = { id: string; score: number; likes: number; comments: number; shares: number; saves: number; created_at: string };
type PostCreatorRow = { creator_id: string; post: { id: string; score: number; created_at: string } | null };
type MemberRow = { id: string; name: string; role: string | null; avatar_url: string | null };
type TopCreator = { id: string; name: string; role: string | null; avatar_url: string | null; score: number; post_count: number };

export default function Dashboard() {
  const [allPosts, setAllPosts] = useState<PostRow[]>([]);
  const [allPostCreators, setAllPostCreators] = useState<PostCreatorRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { inPeriod } = usePeriodFilter();

  useEffect(() => {
    async function load() {
      const [{ data: posts }, { data: pc }, { data: m }] = await Promise.all([
        supabase.from("posts").select("id, score, likes, comments, shares, saves, created_at"),
        supabase.from("post_creators").select("creator_id, post:posts(id, score, created_at)"),
        supabase.from("members").select("id, name, role, avatar_url"),
      ]);
      if (posts) setAllPosts(posts as PostRow[]);
      if (pc) setAllPostCreators(pc as PostCreatorRow[]);
      if (m) setMembers(m);
      setLoading(false);
    }
    load();
  }, []);

  const filteredPosts = useMemo(() => allPosts.filter(p => inPeriod(p.created_at)), [allPosts, inPeriod]);
  const filteredPc = useMemo(() => allPostCreators.filter(pc => pc.post && inPeriod(pc.post.created_at)), [allPostCreators, inPeriod]);

  const stats = useMemo(() => ({
    creators: members.length,
    posts: filteredPosts.length,
    totalScore: filteredPosts.reduce((a, p) => a + (p.score || 0), 0),
    totalLikes: filteredPosts.reduce((a, p) => a + (p.likes || 0), 0),
    totalComments: filteredPosts.reduce((a, p) => a + (p.comments || 0), 0),
    totalShares: filteredPosts.reduce((a, p) => a + (p.shares || 0), 0),
    totalSaves: filteredPosts.reduce((a, p) => a + (p.saves || 0), 0),
  }), [filteredPosts, members]);

  const topCreators = useMemo(() => {
    const map: Record<string, number> = {};
    const countMap: Record<string, number> = {};
    filteredPc.forEach((pc) => {
      map[pc.creator_id] = (map[pc.creator_id] || 0) + (pc.post?.score || 0);
      countMap[pc.creator_id] = (countMap[pc.creator_id] || 0) + 1;
    });
    return members
      .map(c => ({ ...c, score: map[c.id] || 0, post_count: countMap[c.id] || 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [filteredPc, members]);

  const statCards = [
    { label: "Criadores", value: stats.creators, icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Posts no período", value: stats.posts, icon: FileText, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "Score Total", value: stats.totalScore.toLocaleString(), icon: Trophy, color: "text-amber-400", bg: "bg-amber-400/10" },
  ];

  const engagementCards = [
    { label: "Curtidas", value: stats.totalLikes, icon: Heart },
    { label: "Comentários", value: stats.totalComments, icon: MessageCircle },
    { label: "Compartilhamentos", value: stats.totalShares, icon: Share2 },
    { label: "Salvamentos", value: stats.totalSaves, icon: Bookmark },
  ];

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-2 mb-1">
          <LayoutDashboard className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <p className="text-muted-foreground text-sm">Visão geral do desempenho de conteúdo</p>
      </div>

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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
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
  );
}
