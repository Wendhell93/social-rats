import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Creator } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  /** The linked member profile (null if not yet created) */
  profile: Creator | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function checkIsAdmin(email: string | undefined): Promise<boolean> {
  if (!email) return false;
  const { data } = await supabase
    .from("admin_emails" as any)
    .select("email")
    .eq("email", email)
    .maybeSingle();
  return !!data;
}

async function fetchProfile(userId: string): Promise<Creator | null> {
  const { data } = await supabase
    .from("members")
    .select("*, creator_areas(area:areas(*))")
    .eq("auth_id", userId)
    .maybeSingle();
  return data as Creator | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);

  async function handleSession(session: Session | null) {
    setSession(session);
    setUser(session?.user ?? null);
    if (session?.user) {
      const [admin, prof] = await Promise.all([
        checkIsAdmin(session.user.email),
        fetchProfile(session.user.id),
      ]);
      setIsAdmin(admin);
      setProfile(prof);
    } else {
      setIsAdmin(false);
      setProfile(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setProfile(null);
  }

  async function refreshProfile() {
    if (user) {
      const prof = await fetchProfile(user.id);
      setProfile(prof);
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, profile, signInWithGoogle, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
