import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Post, Member, EngagementWeights } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/PlatformBadge";
import { Trophy, FileText, Users, Heart, Plus, TrendingUp } from "lucide-react";

interface RankingEntry {
  member: Member;
  totalScore: number;
  totalPosts: number;
}

export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [weights, setWeights] = useState<EngagementWeights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: postsData }, { data: membersData }, { data: weightsData }] = await Promise.all([
        supabase.from("posts").select("*, member:members(*)").order("created_at", { ascending: false }).limit(5),
        supabase.from("members").select("*"),
        supabase.from("engagement_weights").select("*").limit(1).single(),
      ]);
      if (postsData) setPosts(postsData as Post[]);
      if (membersData) setMembers(membersData);
      if (weightsData) setWeights(weightsData);
      setLoading(false);
    }
    load();
  }, []);

  const ranking: RankingEntry[] = members.map((m) => {
    const memberPosts = posts.filter((p) => p.member_id === m.id);
    return {
      member: m,
      totalScore: memberPosts.reduce((acc, p) => acc + p.score, 0),
      totalPosts: memberPosts.length,
    };
  }).sort((a, b) => b.totalScore - a.totalScore);

  const topPost = [...posts].sort((a, b) => b.score - a.score)[0];
  const medalColors = ["rank-gold", "rank-silver", "rank-bronze"];
  const medalBg = ["bg-rank-gold", "bg-rank-silver", "bg-rank-bronze"];
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Visão geral do engajamento da equipe</p>
        </div>
        <Button asChild>
          <Link to="/posts/new"><Plus className="w-4 h-4 mr-2" /> Cadastrar Post</Link>
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Posts</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loading ? "—" : posts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Membros Ativos</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loading ? "—" : members.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Maior Engajamento</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loading ? "—" : topPost ? topPost.score.toFixed(0) : "0"}</p>
            {topPost && <p className="text-xs text-muted-foreground mt-1 truncate">{topPost.title || topPost.url}</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pódio Top 3 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="w-4 h-4 text-primary" /> Top 3 do Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : ranking.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum membro cadastrado ainda.</p>
            ) : (
              <div className="space-y-3">
                {ranking.slice(0, 3).map((entry, i) => (
                  <div key={entry.member.id} className={`flex items-center gap-3 p-3 rounded-lg border ${medalBg[i]}`}>
                    <span className="text-xl">{medals[i]}</span>
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs font-bold">{entry.member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{entry.member.name}</p>
                      <p className="text-xs text-muted-foreground">{entry.totalPosts} posts</p>
                    </div>
                    <p className={`font-bold text-sm ${medalColors[i]}`}>{entry.totalScore.toFixed(0)} pts</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Posts recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="w-4 h-4 text-primary" /> Posts Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : posts.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-2">Nenhum post cadastrado.</p>
                <Button size="sm" asChild><Link to="/posts/new">Cadastrar primeiro post</Link></Button>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.slice(0, 5).map((post) => (
                  <div key={post.id} className="flex items-center gap-3">
                    <PlatformBadge platform={post.platform} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{post.title || post.url}</p>
                      <p className="text-xs text-muted-foreground">{(post.member as any)?.name || "—"}</p>
                    </div>
                    <span className="text-sm font-semibold text-primary">{post.score.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
