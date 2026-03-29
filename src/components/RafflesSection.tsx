import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Plus, Trophy, CalendarDays, Users, Dices, PartyPopper, X } from "lucide-react";
import { performDraw } from "@/lib/raffleVouchers";

type Area = { id: string; name: string };
type Raffle = {
  id: string; name: string; description: string | null;
  start_date: string; end_date: string;
  max_vouchers_per_creator: number; status: string; created_at: string;
};
type RafflePrize = {
  id: string; raffle_id: string; name: string; description: string | null;
  image_url: string | null; position: number;
};
type RaffleWinner = {
  id: string; raffle_id: string; creator_id: string;
  voucher_id: string; prize_id: string | null;
  drawn_at: string; position: number;
};
type Member = { id: string; name: string; avatar_url: string | null };

export function RafflesSection() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [raffleAreas, setRaffleAreas] = useState<Record<string, Area[]>>({});
  const [rafflePrizes, setRafflePrizes] = useState<Record<string, RafflePrize[]>>({});
  const [raffleWinners, setRaffleWinners] = useState<Record<string, (RaffleWinner & { member?: Member })[]>>({});
  const [voucherCounts, setVoucherCounts] = useState<Record<string, { total: number; participants: number }>>({});
  const [areas, setAreas] = useState<Area[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [detailRaffle, setDetailRaffle] = useState<Raffle | null>(null);
  const [detailVouchers, setDetailVouchers] = useState<{ creator_id: string; count: number; member?: Member }[]>([]);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formMax, setFormMax] = useState(5);
  const [formAreas, setFormAreas] = useState<string[]>([]);
  const [formPrizes, setFormPrizes] = useState<{ name: string; description: string }[]>([{ name: "", description: "" }]);
  const [saving, setSaving] = useState(false);

  // Draw state
  const [drawing, setDrawing] = useState(false);
  const [lastWinner, setLastWinner] = useState<{ name: string; position: number } | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const [
      { data: r }, { data: ra }, { data: rp }, { data: rw },
      { data: rv }, { data: a }, { data: m },
    ] = await Promise.all([
      supabase.from("raffles").select("*").order("created_at", { ascending: false }),
      supabase.from("raffle_areas").select("raffle_id, area:areas(id, name)"),
      supabase.from("raffle_prizes").select("*").order("position"),
      supabase.from("raffle_winners").select("*, member:members(id, name, avatar_url)"),
      supabase.from("raffle_vouchers").select("raffle_id, creator_id"),
      supabase.from("areas").select("id, name").order("name"),
      supabase.from("members").select("id, name, avatar_url").order("name"),
    ]);

    setRaffles(r || []);
    setAreas(a || []);
    setMembers(m || []);

    // Build raffle areas map
    const raMap: Record<string, Area[]> = {};
    for (const row of (ra || []) as any[]) {
      if (!raMap[row.raffle_id]) raMap[row.raffle_id] = [];
      if (row.area) raMap[row.raffle_id].push(row.area);
    }
    setRaffleAreas(raMap);

    // Build prizes map
    const pMap: Record<string, RafflePrize[]> = {};
    for (const p of rp || []) { if (!pMap[p.raffle_id]) pMap[p.raffle_id] = []; pMap[p.raffle_id].push(p); }
    setRafflePrizes(pMap);

    // Build winners map
    const wMap: Record<string, (RaffleWinner & { member?: Member })[]> = {};
    for (const w of (rw || []) as any[]) {
      if (!wMap[w.raffle_id]) wMap[w.raffle_id] = [];
      wMap[w.raffle_id].push(w);
    }
    setRaffleWinners(wMap);

    // Build voucher counts
    const vcMap: Record<string, { total: number; participantSet: Set<string> }> = {};
    for (const v of rv || []) {
      if (!vcMap[v.raffle_id]) vcMap[v.raffle_id] = { total: 0, participantSet: new Set() };
      vcMap[v.raffle_id].total++;
      vcMap[v.raffle_id].participantSet.add(v.creator_id);
    }
    const vcFinal: Record<string, { total: number; participants: number }> = {};
    for (const [k, v] of Object.entries(vcMap)) {
      vcFinal[k] = { total: v.total, participants: v.participantSet.size };
    }
    setVoucherCounts(vcFinal);
  }

  async function handleCreate() {
    if (!formName.trim()) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    if (!formStart || !formEnd) { toast({ title: "Datas obrigatórias", variant: "destructive" }); return; }
    if (formAreas.length === 0) { toast({ title: "Selecione ao menos uma área", variant: "destructive" }); return; }
    setSaving(true);

    const { data: raffle, error } = await supabase.from("raffles").insert({
      name: formName.trim(),
      description: formDesc.trim() || null,
      start_date: new Date(formStart).toISOString(),
      end_date: new Date(formEnd).toISOString(),
      max_vouchers_per_creator: formMax,
    }).select().single();

    if (error || !raffle) { toast({ title: "Erro", description: error?.message, variant: "destructive" }); setSaving(false); return; }

    // Insert areas
    await supabase.from("raffle_areas").insert(formAreas.map(aId => ({ raffle_id: raffle.id, area_id: aId })));

    // Insert prizes
    const validPrizes = formPrizes.filter(p => p.name.trim());
    if (validPrizes.length > 0) {
      await supabase.from("raffle_prizes").insert(
        validPrizes.map((p, i) => ({ raffle_id: raffle.id, name: p.name.trim(), description: p.description.trim() || null, position: i + 1 }))
      );
    }

    toast({ title: "Sorteio criado!" });
    setCreateOpen(false);
    resetForm();
    load();
    setSaving(false);
  }

  function resetForm() {
    setFormName(""); setFormDesc(""); setFormStart(""); setFormEnd("");
    setFormMax(5); setFormAreas([]); setFormPrizes([{ name: "", description: "" }]);
  }

  async function handleDraw(raffle: Raffle) {
    setDrawing(true);
    setLastWinner(null);
    const prizes = rafflePrizes[raffle.id] || [];
    const winners = raffleWinners[raffle.id] || [];
    const nextPrize = prizes.find(p => !winners.some(w => w.prize_id === p.id));

    const result = await performDraw(raffle.id, nextPrize?.id);
    if (result) {
      setLastWinner({ name: result.winnerName, position: result.position });
      toast({ title: `Ganhador sorteado!`, description: `${result.winnerName} — ${result.position}o lugar` });
      load();
    } else {
      toast({ title: "Sem participantes elegíveis", description: "Todos já foram sorteados ou não há vouchers.", variant: "destructive" });
    }
    setDrawing(false);
  }

  async function handleFinish(raffleId: string) {
    await supabase.from("raffles").update({ status: "finished" }).eq("id", raffleId);
    toast({ title: "Sorteio finalizado!" });
    load();
  }

  async function handleDelete(raffleId: string) {
    await supabase.from("raffles").delete().eq("id", raffleId);
    toast({ title: "Sorteio removido!" });
    load();
  }

  async function openDetail(raffle: Raffle) {
    setDetailRaffle(raffle);
    const { data } = await supabase
      .from("raffle_vouchers")
      .select("creator_id")
      .eq("raffle_id", raffle.id);

    const countMap = new Map<string, number>();
    for (const v of data || []) {
      countMap.set(v.creator_id, (countMap.get(v.creator_id) || 0) + 1);
    }
    const detail = Array.from(countMap.entries()).map(([cid, count]) => ({
      creator_id: cid,
      count,
      member: members.find(m => m.id === cid),
    })).sort((a, b) => b.count - a.count);
    setDetailVouchers(detail);
  }

  const activeRaffles = raffles.filter(r => r.status === "active");
  const finishedRaffles = raffles.filter(r => r.status === "finished");

  function daysLeft(endDate: string) {
    const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
    return Math.max(0, diff);
  }

  function progress(start: string, end: string) {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const now = Date.now();
    if (now >= e) return 100;
    if (now <= s) return 0;
    return Math.round(((now - s) / (e - s)) * 100);
  }

  return (
    <section className="mt-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Ticket className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Sorteios</h2>
          <p className="text-xs text-muted-foreground">Cadastre conteúdo e ganhe vouchers para concorrer a prêmios</p>
        </div>
        {isAdmin && (
          <Button size="sm" className="ml-auto gap-1.5" onClick={() => { resetForm(); setCreateOpen(true); }}>
            <Plus className="w-4 h-4" /> Novo Sorteio
          </Button>
        )}
      </div>

      {activeRaffles.length === 0 && finishedRaffles.length === 0 && (
        <Card className="border-dashed"><CardContent className="py-10 text-center text-muted-foreground">Nenhum sorteio criado ainda.</CardContent></Card>
      )}

      {/* Active Raffles */}
      {activeRaffles.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {activeRaffles.map(raffle => {
            const vc = voucherCounts[raffle.id] || { total: 0, participants: 0 };
            const rAreas = raffleAreas[raffle.id] || [];
            const prizes = rafflePrizes[raffle.id] || [];
            const winners = raffleWinners[raffle.id] || [];
            const days = daysLeft(raffle.end_date);
            const pct = progress(raffle.start_date, raffle.end_date);

            return (
              <Card key={raffle.id} className="relative overflow-hidden">
                {/* Progress bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
                  <div className="h-full bg-amber-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <CardContent className="pt-5 pb-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{raffle.name}</h3>
                      {raffle.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{raffle.description}</p>}
                    </div>
                    <Badge variant="outline" className="text-amber-400 border-amber-400/30 text-[10px]">
                      {days > 0 ? `${days}d restantes` : "Encerrado"}
                    </Badge>
                  </div>

                  {/* Areas badges */}
                  <div className="flex flex-wrap gap-1">
                    {rAreas.map(a => (
                      <Badge key={a.id} variant="secondary" className="text-[10px]">{a.name}</Badge>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-muted/50 rounded-lg py-1.5">
                      <p className="text-xs text-muted-foreground">Vouchers</p>
                      <p className="font-bold text-sm">{vc.total}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg py-1.5">
                      <p className="text-xs text-muted-foreground">Participantes</p>
                      <p className="font-bold text-sm">{vc.participants}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg py-1.5">
                      <p className="text-xs text-muted-foreground">Máx/pessoa</p>
                      <p className="font-bold text-sm">{raffle.max_vouchers_per_creator}</p>
                    </div>
                  </div>

                  {/* Prizes */}
                  {prizes.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Prêmios:</span>{" "}
                      {prizes.map(p => p.name).join(", ")}
                    </div>
                  )}

                  {/* Period */}
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <CalendarDays className="w-3 h-3" />
                    {new Date(raffle.start_date).toLocaleDateString("pt-BR")} — {new Date(raffle.end_date).toLocaleDateString("pt-BR")}
                  </div>

                  {/* Winners */}
                  {winners.length > 0 && (
                    <div className="space-y-1">
                      {winners.map(w => (
                        <div key={w.id} className="flex items-center gap-2 text-xs">
                          <Trophy className="w-3 h-3 text-amber-400" />
                          <span className="font-medium">{w.position}o</span>
                          <span>{(w as any).member?.name || "—"}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => openDetail(raffle)}>
                      <Users className="w-3.5 h-3.5 mr-1" /> Detalhes
                    </Button>
                    {isAdmin && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" className="flex-1 text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-black" disabled={drawing}>
                            <Dices className="w-3.5 h-3.5" /> Sortear
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Sortear ganhador?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {vc.total} vouchers de {vc.participants} participantes. O sistema escolherá aleatoriamente. Quem tem mais vouchers tem mais chance.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDraw(raffle)}>Sortear!</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>

                  {/* Admin: finish/delete */}
                  {isAdmin && (
                    <div className="flex gap-2 pt-1 border-t border-border/30">
                      <Button size="sm" variant="ghost" className="text-[10px] text-muted-foreground" onClick={() => handleFinish(raffle.id)}>
                        Finalizar sorteio
                      </Button>
                      <Button size="sm" variant="ghost" className="text-[10px] text-destructive" onClick={() => handleDelete(raffle.id)}>
                        Remover
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Finished Raffles */}
      {finishedRaffles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Sorteios finalizados</h3>
          {finishedRaffles.map(raffle => {
            const winners = raffleWinners[raffle.id] || [];
            const rAreas = raffleAreas[raffle.id] || [];
            return (
              <Card key={raffle.id} className="opacity-70">
                <CardContent className="py-3 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{raffle.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {rAreas.map(a => <Badge key={a.id} variant="secondary" className="text-[10px]">{a.name}</Badge>)}
                    </div>
                  </div>
                  {winners.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <div className="text-xs">
                        {winners.map(w => (
                          <span key={w.id} className="block">{w.position}o — {(w as any).member?.name || "—"}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Last winner celebration ── */}
      {lastWinner && (
        <Dialog open={!!lastWinner} onOpenChange={() => setLastWinner(null)}>
          <DialogContent className="text-center max-w-sm">
            <PartyPopper className="w-12 h-12 text-amber-400 mx-auto mb-2" />
            <DialogTitle className="text-xl">Parabéns!</DialogTitle>
            <p className="text-lg font-bold text-amber-400">{lastWinner.name}</p>
            <p className="text-sm text-muted-foreground">{lastWinner.position}o lugar</p>
            <Button className="mt-4" onClick={() => setLastWinner(null)}>Fechar</Button>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Create Raffle Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Sorteio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Sorteio de Março" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Opcional" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data início *</Label>
                <Input type="date" value={formStart} onChange={e => setFormStart(e.target.value)} />
              </div>
              <div>
                <Label>Data fim *</Label>
                <Input type="date" value={formEnd} onChange={e => setFormEnd(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Máx. vouchers por pessoa</Label>
              <Input type="number" min={1} value={formMax} onChange={e => setFormMax(Number(e.target.value))} />
            </div>

            {/* Areas */}
            <div>
              <Label>Áreas participantes *</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {areas.map(a => (
                  <label key={a.id} className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formAreas.includes(a.id)}
                      onChange={e => {
                        if (e.target.checked) setFormAreas([...formAreas, a.id]);
                        else setFormAreas(formAreas.filter(id => id !== a.id));
                      }}
                      className="rounded"
                    />
                    {a.name}
                  </label>
                ))}
              </div>
              {areas.length === 0 && <p className="text-xs text-muted-foreground mt-1">Nenhuma área cadastrada. Crie áreas primeiro em Configurações.</p>}
            </div>

            {/* Prizes */}
            <div>
              <Label>Prêmios</Label>
              <div className="space-y-2 mt-1.5">
                {formPrizes.map((p, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}o</span>
                    <Input
                      placeholder="Nome do prêmio"
                      value={p.name}
                      onChange={e => {
                        const next = [...formPrizes];
                        next[i] = { ...next[i], name: e.target.value };
                        setFormPrizes(next);
                      }}
                      className="flex-1"
                    />
                    {formPrizes.length > 1 && (
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setFormPrizes(formPrizes.filter((_, j) => j !== i))}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button size="sm" variant="outline" className="text-xs" onClick={() => setFormPrizes([...formPrizes, { name: "", description: "" }])}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar prêmio
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Salvando..." : "Criar Sorteio"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Detail Dialog ── */}
      <Dialog open={!!detailRaffle} onOpenChange={() => setDetailRaffle(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailRaffle?.name}</DialogTitle>
          </DialogHeader>
          {detailRaffle && (
            <div className="space-y-4">
              {detailRaffle.description && <p className="text-sm text-muted-foreground">{detailRaffle.description}</p>}

              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                {new Date(detailRaffle.start_date).toLocaleDateString("pt-BR")} — {new Date(detailRaffle.end_date).toLocaleDateString("pt-BR")}
              </div>

              {/* Winners */}
              {(raffleWinners[detailRaffle.id] || []).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Trophy className="w-4 h-4 text-amber-400" /> Ganhadores</h4>
                  <div className="space-y-2">
                    {(raffleWinners[detailRaffle.id] || []).map(w => (
                      <div key={w.id} className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-amber-400 w-5">{w.position}o</span>
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={(w as any).member?.avatar_url} />
                          <AvatarFallback className="text-[10px]">{((w as any).member?.name || "?")[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{(w as any).member?.name || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Participants */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Users className="w-4 h-4" /> Participantes ({detailVouchers.length})</h4>
                {detailVouchers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum voucher registrado ainda.</p>
                ) : (
                  <div className="space-y-1.5">
                    {detailVouchers.map(v => (
                      <div key={v.creator_id} className="flex items-center gap-2.5">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={v.member?.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px]">{(v.member?.name || "?")[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm flex-1">{v.member?.name || "—"}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          <Ticket className="w-3 h-3 mr-0.5" /> {v.count}/{detailRaffle.max_vouchers_per_creator}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
