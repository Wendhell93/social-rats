import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle, CheckCircle, XCircle, ExternalLink, Loader2, ShieldAlert, Clock,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Dispute {
  id: string;
  post_id: string;
  disputed_by: string;
  reason: string;
  status: string;
  admin_response: string | null;
  resolved_by: string | null;
  created_at: string;
  resolved_at: string | null;
  post?: {
    id: string;
    url: string;
    title: string | null;
    score: number;
    platform: string;
    post_creators?: { creator: { name: string } }[];
  };
  disputer_profile?: { email: string } | null;
}

export default function Disputes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "resolved">("pending");
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"accept" | "reject" | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [processing, setProcessing] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("post_disputes")
      .select("*, post:posts(id, url, title, score, platform, post_creators(creator:members(name)))")
      .order("created_at", { ascending: false });
    if (data) setDisputes(data as unknown as Dispute[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const pending = disputes.filter(d => d.status === "pending");
  const resolved = disputes.filter(d => d.status !== "pending");
  const shown = tab === "pending" ? pending : resolved;

  async function handleAction() {
    if (!actionId || !actionType || !user) return;
    setProcessing(true);

    const updates: any = {
      status: actionType === "accept" ? "accepted" : "rejected",
      admin_response: adminResponse.trim() || null,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("post_disputes")
      .update(updates)
      .eq("id", actionId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      setProcessing(false);
      return;
    }

    // If accepted, zero the post score
    if (actionType === "accept") {
      const dispute = disputes.find(d => d.id === actionId);
      if (dispute?.post_id) {
        await supabase.from("posts").update({ score: 0 }).eq("id", dispute.post_id);
      }
    }

    toast({
      title: actionType === "accept" ? "Contestação aceita — score zerado" : "Contestação rejeitada",
    });

    setActionId(null);
    setActionType(null);
    setAdminResponse("");
    setProcessing(false);
    load();
  }

  function openAction(id: string, type: "accept" | "reject") {
    setActionId(id);
    setActionType(type);
    setAdminResponse("");
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs gap-1"><Clock className="w-3 h-3" />Pendente</Badge>;
      case "accepted":
        return <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-xs gap-1"><CheckCircle className="w-3 h-3" />Aceita</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-xs gap-1"><XCircle className="w-3 h-3" />Rejeitada</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <h1 className="text-2xl font-bold">Contestações</h1>
        </div>
        <p className="text-muted-foreground text-sm">Gerencie contestações de conteúdo reportadas pelos criadores</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={tab === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("pending")}
          className="text-xs gap-1.5"
        >
          <Clock className="w-3.5 h-3.5" />
          Pendentes ({pending.length})
        </Button>
        <Button
          variant={tab === "resolved" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("resolved")}
          className="text-xs gap-1.5"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          Resolvidas ({resolved.length})
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-xl bg-card animate-pulse" />)}
        </div>
      ) : shown.length === 0 ? (
        <div className="text-center py-20">
          <ShieldAlert className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {tab === "pending" ? "Nenhuma contestação pendente." : "Nenhuma contestação resolvida."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {shown.map(d => (
            <Card key={d.id} className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {statusBadge(d.status)}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(d.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate">
                      Post: {d.post?.title || d.post?.url || "Post removido"}
                    </p>
                    {d.post?.post_creators && d.post.post_creators.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Criador(es): {d.post.post_creators.map(pc => pc.creator?.name).filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  {d.post?.url && (
                    <a href={d.post.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary flex-shrink-0">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Reason */}
                <div className="rounded-lg bg-muted/30 border border-border p-3 mb-3">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">Motivo da contestação:</p>
                  <p className="text-sm">{d.reason}</p>
                </div>

                {/* Admin response (if resolved) */}
                {d.admin_response && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 mb-3">
                    <p className="text-xs text-primary mb-1 font-medium">Resposta do admin:</p>
                    <p className="text-sm">{d.admin_response}</p>
                  </div>
                )}

                {/* Score info */}
                {d.status === "accepted" && (
                  <p className="text-xs text-green-400 mb-3">Score do post foi zerado.</p>
                )}

                {/* Actions (pending only) */}
                {d.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1.5 border-green-500/30 text-green-400 hover:bg-green-500/10"
                      onClick={() => openAction(d.id, "accept")}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Aceitar (zerar score)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10"
                      onClick={() => openAction(d.id, "reject")}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Rejeitar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Dialog */}
      <AlertDialog open={!!actionId} onOpenChange={(open) => { if (!open) { setActionId(null); setActionType(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "accept" ? "Aceitar contestação?" : "Rejeitar contestação?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "accept"
                ? "O score do post será zerado. Essa ação pode ser revertida manualmente editando o post."
                : "A contestação será marcada como rejeitada. O post mantém sua pontuação."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Textarea
              placeholder="Resposta para o criador (opcional)..."
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              className="min-h-[80px] resize-none bg-input border-border"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={processing}
              className={actionType === "accept" ? "bg-green-600 hover:bg-green-700" : "bg-destructive hover:bg-destructive/90"}
            >
              {processing && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {actionType === "accept" ? "Aceitar e zerar score" : "Rejeitar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
