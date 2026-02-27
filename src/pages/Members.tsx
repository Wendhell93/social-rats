import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Member } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, X, Check } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const { toast } = useToast();

  async function load() {
    const { data } = await supabase.from("members").select("*").order("name");
    if (data) setMembers(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!name.trim()) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    const { error } = await supabase.from("members").insert({ name: name.trim(), role: role.trim() || null });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Membro cadastrado!" });
    setName(""); setRole(""); setOpen(false);
    load();
  }

  async function handleDelete(id: string) {
    await supabase.from("members").delete().eq("id", id);
    toast({ title: "Membro removido!" });
    load();
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return;
    await supabase.from("members").update({ name: editName.trim(), role: editRole.trim() || null }).eq("id", id);
    setEditId(null);
    toast({ title: "Membro atualizado!" });
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Membros</h1>
          <p className="text-muted-foreground text-sm mt-1">{members.length} membros da equipe</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Novo Membro</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Cadastrar Membro</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Nome *</Label>
                <Input className="mt-1" placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Cargo / Função</Label>
                <Input className="mt-1" placeholder="Ex: Designer, Copywriter..." value={role} onChange={(e) => setRole(e.target.value)} />
              </div>
              <Button className="w-full" onClick={handleCreate}>Cadastrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : members.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">Nenhum membro cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-4">
                {editId === m.id ? (
                  <div className="space-y-2">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nome" />
                    <Input value={editRole} onChange={(e) => setEditRole(e.target.value)} placeholder="Cargo" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdate(m.id)}><Check className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditId(null)}><X className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="font-bold">{m.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{m.name}</p>
                      {m.role && <p className="text-xs text-muted-foreground truncate">{m.role}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => { setEditId(m.id); setEditName(m.name); setEditRole(m.role || ""); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="w-8 h-8 text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover membro?</AlertDialogTitle>
                            <AlertDialogDescription>Todos os posts associados também serão removidos.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(m.id)} className="bg-destructive text-destructive-foreground">Remover</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
