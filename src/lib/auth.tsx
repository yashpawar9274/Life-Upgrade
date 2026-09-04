import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { loadCloudState, saveCloudConfig, saveCloudDay } from "@/lib/cloud";
import { todayKey, useStore } from "@/lib/store";

type AuthValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  syncing: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setProfile, merge, state, hydrated } = useStore();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const cloudLoaded = useRef(false);

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

  // Pull the account's cloud data (plan, profile, routines, habits, limits, logs).
  useEffect(() => {
    if (!user || !hydrated) return;
    let cancelled = false;
    cloudLoaded.current = false;
    setSyncing(true);

    (async () => {
      const { data: plan } = await supabase.rpc("current_plan");
      if (!cancelled && (plan === "premium" || plan === "free")) setProfile({ plan });

      const snapshot = await loadCloudState(user.id);
      if (!cancelled && snapshot) merge(snapshot);

      if (!cancelled && !snapshot?.profile?.name) {
        const fallback = (user.user_metadata?.["full_name"] as string | undefined) ?? "";
        if (fallback) setProfile({ name: fallback });
      }

      if (!cancelled) {
        cloudLoaded.current = true;
        setSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, hydrated]);

  // Autosave config (profile, routines, habits, limits, roadmap) to the backend.
  useEffect(() => {
    if (!user || !cloudLoaded.current) return;
    const timer = setTimeout(() => {
      void saveCloudConfig(user.id, state);
      const name = state.profile.name.trim();
      void supabase.from("profiles").upsert({
        id: user.id,
        email: user.email ?? null,
        name: name || null,
        updated_at: new Date().toISOString(),
      });
    }, 700);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, state.profile, state.routines, state.habits, state.limits, state.roadmap]);

  // Autosave today's check-ins so weekly analytics live in the backend.
  useEffect(() => {
    if (!user || !cloudLoaded.current) return;
    const day = todayKey();
    const timer = setTimeout(() => {
      void saveCloudDay(user.id, state, day);
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, state.routineLog, state.habitLog, state.limitLog, state.moodLog, state.focusLog]);

  const value: AuthValue = {
    user,
    session,
    loading,
    syncing,
    signOut: async () => {
      cloudLoaded.current = false;
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
