import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Area } from "@/lib/types";
import { AreaPicker } from "@/components/AreaPicker";
import { WizardProgress } from "@/components/wizard/WizardProgress";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { hapticMedium } from "@/lib/haptics";
import { Chrome, ChevronRight, ChevronLeft, Upload, X, Loader2, Sparkles } from "lucide-react";

const STEPS = 4;
const LABELS = ["Entrar", "Dados", "Área", "Avatar"];

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading: authLoading, signInWithGoogle, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<Area[]>([]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [celebration, setCelebration] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If already has profile, go home
  useEffect(() => {
    if (!authLoading && profile) {
      navigate("/", { replace: true });
    }
  }, [authLoading, profile]);

  // When user logs in, advance to step 2 and pre-fill
  useEffect(() => {
    if (user && step === 1) {
      setName(user.user_metadata?.full_name || "");
      setAvatarUrl(user.user_metadata?.avatar_url || "");
      setStep(2);
    }
  }, [user]);

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

  async function handleFinish() {
    if (!name.trim()) { toast({ title: "Nome é obrigatório", variant: "destructive" }); return; }
    if (selectedAreas.length === 0) { toast({ title: "Selecione ao menos uma área", variant: "destructive" }); return; }
    if (!user) return;
    setSaving(true);

    let avatar = avatarUrl.trim() || null;
    if (uploadFile) {
      const url = await uploadAvatar();
      if (url) avatar = url;
    }

    const { data, error } = await supabase.from("members").insert({
      name: name.trim(),
      role: role.trim() || null,
      avatar_url: avatar,
      auth_id: user.id,
    }).select().single();

    if (error || !data) {
      toast({ title: "Erro ao criar perfil", description: error?.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    // Sync areas
    if (selectedAreas.length > 0) {
      await supabase.from("creator_areas").insert(
        selectedAreas.map(a => ({ creator_id: data.id, area_id: a.id }))
      );
    }

    await refreshProfile();
    setSaving(false);
    setCelebration(true);
  }

  const canNext: Record<number, boolean> = {
    1: !!user,
    2: !!name.trim(),
    3: selectedAreas.length > 0,
    4: !saving,
  };

  function goNext() {
    if (step < STEPS && canNext[step]) { hapticMedium(); setStep(step + 1); }
  }
  function goBack() {
    if (step > 1 && (step > 2 || !user)) { hapticMedium(); setStep(step - 1); }
  }

  if (celebration) {
    return (
      <CelebrationOverlay
        type="voucher-earned"
        message="Bem-vindo ao SocialRats!"
        subMessage="Seu perfil foi criado. Agora é só cadastrar seus conteúdos!"
        onComplete={() => navigate("/")}
      />
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img src="/logo-icon-40.png" alt="SocialRats" width={56} height={56} className="rounded-xl mb-3" />
          <h1 className="text-xl font-bold">SocialRats</h1>
          <p className="text-sm text-muted-foreground">Crie seu perfil de criador</p>
        </div>

        <WizardProgress currentStep={step} totalSteps={STEPS} labels={LABELS} />

        {/* ── Step 1: Login ── */}
        {step === 1 && (
          <div className="animate-fade-in space-y-4">
            <Card className="bg-card border-border">
              <CardContent className="pt-6 pb-6 flex flex-col items-center gap-4">
                <Sparkles className="w-10 h-10 text-primary" />
                <div className="text-center">
                  <h2 className="text-lg font-bold">Vamos começar!</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Entre com sua conta Google para criar seu perfil de criador.
                  </p>
                </div>
                <Button
                  onClick={signInWithGoogle}
                  className="w-full gap-2 gradient-primary text-white border-0 glow-blue h-12 text-base"
                >
                  <Chrome className="w-5 h-5" />
                  Entrar com Google
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Step 2: Name + Role ── */}
        {step === 2 && (
          <div className="animate-fade-in space-y-4">
            <div className="text-center mb-2">
              <h2 className="text-lg font-bold">Como você se chama?</h2>
              <p className="text-sm text-muted-foreground">Preencha seus dados básicos</p>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="pt-5 space-y-4">
                <div>
                  <Label>Nome *</Label>
                  <Input
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="bg-input border-border h-11 text-base"
                    autoFocus
                  />
                </div>
                <div>
                  <Label>Cargo / Função</Label>
                  <Input
                    placeholder="Ex: Motion Designer, Videomaker..."
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Step 3: Area ── */}
        {step === 3 && (
          <div className="animate-fade-in space-y-4">
            <div className="text-center mb-2">
              <h2 className="text-lg font-bold">Qual é a sua área?</h2>
              <p className="text-sm text-muted-foreground">Isso define em quais sorteios você participa</p>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="pt-5">
                <AreaPicker selected={selectedAreas} onChange={setSelectedAreas} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Step 4: Avatar ── */}
        {step === 4 && (
          <div className="animate-fade-in space-y-4">
            <div className="text-center mb-2">
              <h2 className="text-lg font-bold">Sua foto de perfil</h2>
              <p className="text-sm text-muted-foreground">Opcional — você pode alterar depois</p>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="pt-5 space-y-4">
                {/* Preview */}
                {(uploadPreview || avatarUrl) && (
                  <div className="flex justify-center">
                    <div className="relative">
                      <img
                        src={uploadPreview || avatarUrl}
                        alt="avatar"
                        className="w-24 h-24 rounded-full object-cover border-2 border-primary/40"
                      />
                      <button
                        onClick={() => { setUploadFile(null); setUploadPreview(null); setAvatarUrl(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload */}
                {!uploadPreview && !avatarUrl && (
                  <>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-28 rounded-xl border-2 border-dashed border-border hover:border-primary/60 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Upload className="w-7 h-7" />
                      <span className="text-sm">Toque para selecionar foto</span>
                    </button>
                  </>
                )}

                <p className="text-xs text-center text-muted-foreground">
                  {avatarUrl && !uploadFile ? "Usando sua foto do Google" : ""}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="flex gap-3 mt-6">
          {step > 2 && (
            <Button variant="outline" className="border-border min-h-[44px]" onClick={goBack}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
          )}
          {step >= 2 && step < STEPS && (
            <Button
              className="flex-1 gradient-primary text-white border-0 glow-blue min-h-[44px]"
              disabled={!canNext[step]}
              onClick={goNext}
            >
              Próximo <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
          {step === STEPS && (
            <Button
              className="flex-1 gradient-primary text-white border-0 glow-blue min-h-[48px] text-base"
              disabled={saving}
              onClick={handleFinish}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {saving ? "Criando perfil..." : "Criar meu perfil!"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
