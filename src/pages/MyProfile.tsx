import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Area } from "@/lib/types";
import { AreaPicker } from "@/components/AreaPicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { User, Upload, X, Link as LinkIcon, Loader2, Save } from "lucide-react";

export default function MyProfile() {
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<Area[]>([]);
  const [avatarTab, setAvatarTab] = useState<"url" | "upload">("url");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isNew = !profile;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setRole(profile.role || "");
      setAvatarUrl(profile.avatar_url || "");
      const areas = profile.creator_areas?.map((ca: any) => ca.area).filter(Boolean) || [];
      setSelectedAreas(areas);
    } else if (user) {
      // Pre-fill from Google profile
      setName(user.user_metadata?.full_name || "");
      setAvatarUrl(user.user_metadata?.avatar_url || "");
    }
  }, [profile, user]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
  }

  async function uploadAvatar(): Promise<string | null> {
    if (!uploadFile) return null;
    const ext = uploadFile.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, uploadFile, { upsert: true });
    if (error) {
      toast({ title: "Erro ao fazer upload", description: error.message, variant: "destructive" });
      return null;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSave() {
    if (!name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    if (!user) return;
    setSaving(true);

    let avatar = avatarUrl.trim() || null;
    if (avatarTab === "upload" && uploadFile) {
      const url = await uploadAvatar();
      if (!url) { setSaving(false); return; }
      avatar = url;
    }

    const payload = {
      name: name.trim(),
      role: role.trim() || null,
      avatar_url: avatar,
      auth_id: user.id,
    };

    let memberId: string;

    if (isNew) {
      const { data, error } = await supabase.from("members").insert(payload).select().single();
      if (error || !data) {
        toast({ title: "Erro ao criar perfil", description: error?.message, variant: "destructive" });
        setSaving(false);
        return;
      }
      memberId = data.id;
    } else {
      const { error } = await supabase.from("members").update(payload).eq("id", profile!.id);
      if (error) {
        toast({ title: "Erro ao atualizar perfil", description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }
      memberId = profile!.id;
    }

    // Sync areas
    await supabase.from("creator_areas").delete().eq("creator_id", memberId);
    if (selectedAreas.length > 0) {
      await supabase.from("creator_areas").insert(
        selectedAreas.map(a => ({ creator_id: memberId, area_id: a.id }))
      );
    }

    await refreshProfile();
    toast({ title: isNew ? "Perfil criado!" : "Perfil atualizado!" });
    if (isNew) navigate("/");
    setSaving(false);
  }

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-lg animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{isNew ? "Complete seu Perfil" : "Meu Perfil"}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isNew ? "Preencha seus dados para começar a usar o SocialRats" : "Edite suas informações"}
        </p>
      </div>

      <div className="space-y-5">
        {/* Nome */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-base">Nome *</CardTitle></CardHeader>
          <CardContent>
            <Input placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} className="bg-input border-border" />
          </CardContent>
        </Card>

        {/* Cargo */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-base">Cargo / Função</CardTitle></CardHeader>
          <CardContent>
            <Input placeholder="Ex: Motion Designer, Videomaker..." value={role} onChange={e => setRole(e.target.value)} className="bg-input border-border" />
          </CardContent>
        </Card>

        {/* Áreas */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-base">Áreas</CardTitle></CardHeader>
          <CardContent>
            <AreaPicker selected={selectedAreas} onChange={setSelectedAreas} />
          </CardContent>
        </Card>

        {/* Avatar */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3"><CardTitle className="text-base">Avatar</CardTitle></CardHeader>
          <CardContent>
            <Tabs value={avatarTab} onValueChange={v => setAvatarTab(v as "url" | "upload")}>
              <TabsList className="mb-3 bg-muted/40 border border-border h-9">
                <TabsTrigger value="url" className="text-xs gap-1.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <LinkIcon className="w-3 h-3" /> URL
                </TabsTrigger>
                <TabsTrigger value="upload" className="text-xs gap-1.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                  <Upload className="w-3 h-3" /> Upload
                </TabsTrigger>
              </TabsList>
              <TabsContent value="url">
                <Input placeholder="https://..." value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} className="bg-input border-border" />
              </TabsContent>
              <TabsContent value="upload">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                {uploadPreview ? (
                  <div className="relative w-fit">
                    <img src={uploadPreview} alt="preview" className="w-20 h-20 rounded-full object-cover border-2 border-primary/40" />
                    <button
                      onClick={() => { setUploadFile(null); setUploadPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 rounded-lg border-2 border-dashed border-border hover:border-primary/60 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Upload className="w-6 h-6" />
                    <span className="text-xs">Clique para selecionar imagem</span>
                  </button>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-white border-0 glow-blue">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {isNew ? "Criar Perfil" : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}
