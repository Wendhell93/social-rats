import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Member } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";
import { subDays, startOfMonth, isAfter, parseISO, isWithinInterval } from "date-fns";
import { usePeriod } from "@/contexts/PeriodContext";

interface PostCreatorRow {
  creator_id: string;
  post: { id: string; score: number; created_at: string } | null;
}

interface RankingEntry {
  member: Member;
  totalScore: number;
  totalPosts: number;
}

const medalBg = ["bg-rank-gold", "bg-rank-silver", "bg-rank-bronze"];
const medalColors = ["rank-gold", "rank-silver", "rank-bronze"];
const medals = ["🥇", "🥈", "🥉"];

export default function Ranking() {
  const [members, setMembers] = useState<Member[]>([]);
  const [postCreators, setPostCreators] = useState<PostCreatorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { period, customStart, customEnd } = usePeriod();

  useEffect(() => {
    async function load() {
      const [{ data: m }, { data: pc }] = await Promise.all([
        supabase.from("members").select("*"),
        supabase.from("post_creators").select("creator_id, post:posts(id, score, created_at)"),
      ]);
      if (m) setMembers(m);
      if (pc) setPostCreators(pc as PostCreatorRow[]);
      setLoading(false);
    }
    load();
  }, []);

  function filterPostCreators(rows: PostCreatorRow[]): PostCreatorRow[] {
    const now = new Date();
    return rows.filter((pc) => {
      if (!pc.post) return false;
      const date = parseISO(pc.post.created_at);
      if (period === "7d") return isAfter(date, subDays(now, 7));
      if (period === "30d") return isAfter(date, subDays(now, 30));
      if (period === "month") return isAfter(date, startOfMonth(now));
      if (period === "custom" && customStart && customEnd) {
        return isWithinInterval(date, { start: customStart, end: customEnd });
      }
      return true;
    });
  }

  const filtered = filterPostCreators(postCreators);

  const ranking: RankingEntry[] = members
    .map((m) => {
      const mp = filtered.filter((pc) => pc.creator_id === m.id);
      const uniquePostIds = new Set(mp.map((pc) => pc.post!.id));
      const totalScore = mp.reduce((a, pc) => a + pc.post!.score, 0);
      return { member: m, totalScore, totalPosts: uniquePostIds.size };
    })
    .sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Ranking</h1>
        <p className="text-muted-foreground text-sm mt-1">Classificação por engajamento</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : ranking.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">Nenhum dado disponível para este período.</p>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Trophy className="w-4 h-4 text-primary" /> Classificação</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {ranking.map((entry, i) => (
                  <div key={entry.member.id} className={`flex items-center gap-4 px-6 py-4 ${i < 3 ? medalBg[i] : ""}`}>
                    <span className="w-8 text-center font-bold text-lg">{i < 3 ? medals[i] : `#${i + 1}`}</span>
                    <Avatar>
                      <AvatarImage src={entry.member.avatar_url || undefined} alt={entry.member.name} />
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
