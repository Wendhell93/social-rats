import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";

interface DisputeDialogProps {
  open: boolean;
  onClose: () => void;
  postId: string;
  postTitle: string;
}

export function DisputeDialog({ open, onClose, postId, postTitle }: DisputeDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit() {
    if (!reason.trim()) {
      toast({ title: "Descreva o motivo da contestação", variant: "destructive" });
      return;
    }
    if (!user) return;
    setSending(true);
    const { error } = await supabase.from("post_disputes").insert({
      post_id: postId,
      disputed_by: user.id,
      reason: reason.trim(),
    });
    if (error) {
      toast({ title: "Erro ao enviar contestação", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Contestação enviada!", description: "Os administradores serão notificados." });
      setReason("");
      onClose();
    }
    setSending(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setReason(""); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Contestar Conteúdo
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Você está contestando: <strong className="text-foreground">{postTitle}</strong>
          </p>
          <div>
            <Label className="text-sm mb-1.5 block">Motivo da contestação *</Label>
            <Textarea
              placeholder="Descreva por que este conteúdo deveria ser desqualificado. Ex: fere as políticas da empresa, conteúdo plagiado, métricas artificiais..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[120px] resize-none bg-input border-border"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={sending}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={sending || !reason.trim()} className="bg-amber-500 hover:bg-amber-600 text-white">
            {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
            Enviar Contestação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
