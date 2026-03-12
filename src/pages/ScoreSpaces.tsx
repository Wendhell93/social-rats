import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ExternalLink, Star } from "lucide-react";

type ScoreSpace = {
  id: string;
  name: string;
  description: string | null;
  url: string;
  button_label: string;
  display_order: number;
  created_at: string;
};

type SpaceForm = {
  name: string;
  description: string;
  url: string;
  button_label: string;
};

const emptyForm: SpaceForm = {
  name: "",
  description: "",
  url: "",
  button_label: "Acessar",
};

export default function ScoreSpaces() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<ScoreSpace | null>(null);
  const [form, setForm] = useState<SpaceForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<ScoreSpace | null>(null);

  const { data: spaces = [], isLoading } = useQuery({
    queryKey: ["score_spaces"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("score_spaces")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as ScoreSpace[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: SpaceForm) => {
      if (editingSpace) {
        const { error } = await supabase
          .from("score_spaces")
          .update(values)
          .eq("id", editingSpace.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("score_spaces")
          .insert({ ...values, display_order: spaces.length });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["score_spaces"] });
      setDialogOpen(false);
      toast({ title: editingSpace ? "Espaço atualizado!" : "Espaço criado!" });
    },
    onError: () => {
      toast({ title: "Erro ao salvar espaço", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("score_spaces").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["score_spaces"] });
      setDeleteTarget(null);
      toast({ title: "Espaço removido." });
    },
    onError: () => {
      toast({ title: "Erro ao remover espaço", variant: "destructive" });
    },
  });

  function openCreate() {
    setEditingSpace(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(space: ScoreSpace) {
    setEditingSpace(space);
    setForm({
      name: space.name,
      description: space.description ?? "",
      url: space.url,
      button_label: space.button_label,
    });
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim() || !form.button_label.trim()) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
    saveMutation.mutate(form);
  }

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Star className="w-6 h-6 text-primary" />
            Quero Pontuar
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Acesse os espaços abaixo para começar a pontuar
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} className="flex items-center gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Novo Espaço
          </Button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-lg bg-card animate-pulse border border-border" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && spaces.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Star className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="text-foreground font-semibold">Nenhum espaço criado ainda</p>
            <p className="text-muted-foreground text-sm mt-1">
              {isAdmin ? 'Clique em "Novo Espaço" para adicionar o primeiro link de pontuação' : "Nenhum espaço disponível no momento."}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={openCreate} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Criar primeiro espaço
            </Button>
          )}
        </div>
      )}

      {/* Grid of cards */}
      {!isLoading && spaces.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {spaces.map((space) => (
            <Card key={space.id} className="flex flex-col bg-card border-border hover:border-primary/30 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-foreground leading-tight">
                  {space.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pb-3">
                {space.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {space.description}
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-between gap-2 pt-0 border-t border-border mt-auto">
                <a
                  href={space.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button className="w-full gap-2" size="sm">
                    <ExternalLink className="w-3.5 h-3.5" />
                    {space.button_label}
                  </Button>
                </a>
                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => openEdit(space)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(space)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSpace ? "Editar Espaço" : "Novo Espaço"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome do espaço *</Label>
              <Input
                id="name"
                placeholder="Ex: Calendário de conteúdo"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição breve</Label>
              <Textarea
                id="description"
                placeholder="Explique brevemente para que serve este espaço..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="url">URL do link *</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://..."
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="button_label">Texto do botão *</Label>
              <Input
                id="button_label"
                placeholder="Ex: Acessar, Ver Calendário, Abrir Formulário"
                value={form.button_label}
                onChange={(e) => setForm((f) => ({ ...f, button_label: e.target.value }))}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover espaço?</AlertDialogTitle>
            <AlertDialogDescription>
              O espaço <strong>"{deleteTarget?.name}"</strong> será removido permanentemente.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
