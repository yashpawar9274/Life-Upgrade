import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";

type AuthValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setProfile, state } = useStore();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const user = session?.user ?? null;

  // Sync plan + profile with the cloud whenever a user signs in.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const { data: plan } = await supabase.rpc("current_plan");
      if (!cancelled && (plan === "premium" || plan === "free")) setProfile({ plan });

      const { data: row } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .maybeSingle();

      const cloudName = row?.name?.trim();
      const localName = state.profile.name.trim();
      if (!cancelled && cloudName) {
        setProfile({ name: cloudName });
      } else {
        const fallback =
          localName || (user.user_metadata?.["full_name"] as string | undefined) || "";
        await supabase.from("profiles").upsert({
          id: user.id,
          email: user.email ?? null,
          name: fallback || null,
          updated_at: new Date().toISOString(),
        });
        if (!cancelled && fallback) setProfile({ name: fallback });
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Keep the cloud copy of the display name up to date.
  useEffect(() => {
    if (!user) return;
    const name = state.profile.name.trim();
    if (!name) return;
    const t = setTimeout(() => {
      void supabase
        .from("profiles")
        .upsert({ id: user.id, email: user.email ?? null, name, updated_at: new Date().toISOString() });
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.profile.name, user?.id]);

  const value: AuthValue = {
    user,
    session,
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
      setProfile({ plan: "free" });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
