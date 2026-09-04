import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

import { Card, Disclaimer } from "@/components/AppShell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { DISCLAIMER } from "@/lib/store";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — LIFE UPGRADE" },
      {
        name: "description",
        content:
          "Sign in to LIFE UPGRADE to sync your routines, habits and progress securely across devices.",
      },
      { property: "og:title", content: "Sign in — LIFE UPGRADE" },
      { property: "og:description", content: "Your routine, habits and progress, saved to your account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your email to confirm your account.");
          return;
        }
        navigate({ to: "/dashboard", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in didn't complete. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-md px-4 pb-12 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="mb-6 flex items-start justify-between">
          <Link to="/" className="press">
            <p className="font-display text-sm font-semibold tracking-[0.3em] text-primary">LIFE</p>
            <p className="gold-text font-display text-2xl font-bold tracking-[0.15em]">UPGRADE</p>
          </Link>
          <ThemeToggle />
        </div>

        <h1 className="font-display text-2xl font-semibold">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your goals, habits and progress stay saved to your account.
        </p>

        <Card className="mt-5 space-y-3">
          <button
            onClick={google}
            disabled={busy}
            className="press flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-elevated py-3 text-sm font-semibold disabled:opacity-60"
          >
            Continue with Google
          </button>

          <div className="flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" ? (
              <label className="block text-xs font-medium text-muted-foreground">
                Your name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Yash"
                  className="mt-1 w-full rounded-xl border border-input bg-elevated px-3 py-2.5 text-base outline-none focus:border-primary"
                />
              </label>
            ) : null}
            <label className="block text-xs font-medium text-muted-foreground">
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-xl border border-input bg-elevated px-3 py-2.5 text-base outline-none focus:border-primary"
              />
            </label>
            <label className="block text-xs font-medium text-muted-foreground">
              Password
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-xl border border-input bg-elevated px-3 py-2.5 text-base outline-none focus:border-primary"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="press flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Mail className="h-4 w-4" aria-hidden />
              )}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="press w-full text-center text-xs font-semibold text-primary"
          >
            {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </Card>

        <div className="mt-4">
          <Disclaimer text={DISCLAIMER} />
        </div>
      </div>
    </div>
  );
}
