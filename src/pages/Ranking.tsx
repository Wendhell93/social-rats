import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Member, Post } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { subDays, startOfMonth, isAfter, parseISO } from "date-fns";

type Period = "7d" | "30d" | "month" | "all";

interface RankingEntry {
  member: Member;
  totalScore: number;
  totalPosts: number;
}

const medalBg = ["bg-rank-gold", "bg-rank-silver", "bg-rank-bronze"];
const medalColors = ["rank-gold", "rank-silver", "rank-bronze"];
const medals = ["🥇", "🥈", "🥉"];
const barColors = ["hsl(43,96%,56%)", "hsl(220,10%,65%)", "hsl(25,80%,55%)", "hsl(252,80%,57%)", "hsl(329,80%,55%)", "hsl(180,100%,42%)"];

export default function Ranking() {
  const [members, setMembers] = useState<Member[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [period, setPeriod] = useState<Period>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: m }, { data: p }] = await Promise.all([
        supabase.from("members").select("*"),
        supabase.from("posts").select("*"),
      ]);
      if (m) setMembers(m);
      if (p) setPosts(p as Post[]);
      setLoading(false);
    }
    load();
  }, []);

  function filterPosts(posts: Post[]): Post[] {
    const now = new Date();
    if (period === "7d") return posts.filter((p) => isAfter(parseISO(p.created_at), subDays(now, 7)));
    if (period === "30d") return posts.filter((p) => isAfter(parseISO(p.created_at), subDays(now, 30)));
    if (period === "month") return posts.filter((p) => isAfter(parseISO(p.created_at), startOfMonth(now)));
    return posts;
  }

  const filteredPosts = filterPosts(posts);

  const ranking: RankingEntry[] = members
    .map((m) => {
      const mp = filteredPosts.filter((p) => p.member_id === m.id);
      return { member: m, totalScore: mp.reduce((a, p) => a + p.score, 0), totalPosts: mp.length };
    })
    .sort((a, b) => b.totalScore - a.totalScore);

  const chartData = ranking.map((r) => ({ name: r.member.name.split(" ")[0], score: Math.round(r.totalScore) }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Ranking</h1>
          <p className="text-muted-foreground text-sm mt-1">Classificação por engajamento</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="month">Este mês</SelectItem>
            <SelectItem value="all">Acumulado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : ranking.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">Nenhum dado disponível para este período.</p>
      ) : (
        <div className="space-y-6">
          {/* Gráfico */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Comparativo de Pontuação</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => [`${v} pts`, "Score"]} />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={barColors[i % barColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Tabela */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Trophy className="w-4 h-4 text-primary" /> Classificação</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {ranking.map((entry, i) => (
                  <div key={entry.member.id} className={`flex items-center gap-4 px-6 py-4 ${i < 3 ? medalBg[i] : ""}`}>
                    <span className="w-8 text-center font-bold text-lg">{i < 3 ? medals[i] : `#${i + 1}`}</span>
                    <Avatar>
                      <AvatarFallback className="font-bold text-sm">{entry.member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{entry.member.name}</p>
                      {entry.member.role && <p className="text-xs text-muted-foreground">{entry.member.role}</p>}
                    </div>
                    <div className="text-center px-4">
                      <p className="text-sm text-muted-foreground">Posts</p>
                      <p className="font-semibold">{entry.totalPosts}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${i < 3 ? medalColors[i] : "text-primary"}`}>{entry.totalScore.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">pontos</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
