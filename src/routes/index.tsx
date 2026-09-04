import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Flame, ShieldCheck, Sparkles } from "lucide-react";

import { Card, Disclaimer } from "@/components/AppShell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { DISCLAIMER } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LIFE UPGRADE — Daily Discipline & Lifestyle Coach" },
      {
        name: "description",
        content:
          "Build strong daily routines, track habits and streaks, reduce harmful habits gently, and move toward a confident, healthy, productive life.",
      },
      { property: "og:title", content: "LIFE UPGRADE — Your next version starts today" },
      {
        property: "og:description",
        content:
          "Premium mobile coach for routines, habits, focus, mood and progress — with an optional AI Life Coach.",
      },
    ],
  }),
  component: Landing,
});

const HIGHLIGHTS = [
  { icon: Flame, text: "Routines, habits and streaks that actually stick" },
  { icon: Sparkles, text: "AI Life Coach in Hindi, Hinglish or English" },
  { icon: ShieldCheck, text: "Only the data you enter — never any phone monitoring" },
];

function Landing() {
  const navigate = useNavigate();
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 1600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  if (splash) {
    return (
      <div className="hero-gradient fixed inset-0 z-50 flex flex-col items-center justify-center px-8 text-center">
        <div className="animate-rise">
          <p className="font-display text-3xl font-bold tracking-[0.3em] text-primary">LIFE</p>
          <p className="gold-text font-display text-4xl font-bold tracking-[0.2em]">UPGRADE</p>
        </div>
        <p className="animate-rise mt-6 max-w-xs text-balance text-lg text-muted-foreground">
          Your next version starts today.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="animate-rise mx-auto w-full max-w-md px-4 pb-12 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="font-display text-sm font-semibold tracking-[0.3em] text-primary">LIFE</p>
            <p className="gold-text font-display text-2xl font-bold tracking-[0.15em]">UPGRADE</p>
          </div>
          <ThemeToggle />
        </div>

        <h1 className="font-display text-3xl font-semibold leading-tight">
          Your next version <span className="gold-text">starts today.</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          A calm, respectful coach for your routine, health, discipline, mindset and money habits.
          No shame, no pressure — just steady progress.
        </p>

        <Card className="hero-gradient mt-6 space-y-3">
          {HIGHLIGHTS.map(({ icon: Icon, text }) => (
            <p key={text} className="flex gap-2 text-sm">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              {text}
            </p>
          ))}
        </Card>

        <Link
          to="/auth"
          className="press mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground"
        >
          Get started <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <Link
          to="/auth"
          className="press mt-3 flex w-full items-center justify-center rounded-xl border border-border py-3 text-sm font-semibold"
        >
          I already have an account
        </Link>

        <div className="mt-6">
          <Disclaimer text={DISCLAIMER} />
        </div>
      </div>
    </div>
  );
}
