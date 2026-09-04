import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Crown, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AppShell, Card, Disclaimer, SectionTitle } from "@/components/AppShell";
import { DISCLAIMER, useStore } from "@/lib/store";

export const Route = createFileRoute("/upgrade")({
  head: () => ({
    meta: [
      { title: "Upgrade to Premium — LIFE UPGRADE" },
      {
        name: "description",
        content: "Unlock LIFE AI COACH, premium analytics, smart planner, voice input and the Luxury Life Roadmap.",
      },
      { property: "og:title", content: "Upgrade to Premium — LIFE UPGRADE" },
      { property: "og:description", content: "Everything free, plus a personal AI coach that plans your week." },
    ],
  }),
  component: UpgradePage,
});

const FREE = [
  "Daily routine planner (4 blocks)",
  "Habit tracker with streaks & weekly progress",
  "Bad habit limits & gentle reduction tracking",
  "Mood check-ins and daily motivation",
  "Focus timer and simple weekly report",
];

const PREMIUM = [
  "LIFE AI COACH chat (Hindi / Hinglish / English)",
  "Personalised routines from your goals & timings",
  "Smart daily planner around your work hours",
  "Habit heatmap, mood trends, sleep consistency",
  "Voice input for tasks and coach conversation",
  "Luxury Life Roadmap + weekly AI improvement plan",
  "Exportable weekly progress report",
];

function UpgradePage() {
  const { state, setProfile } = useStore();
  const navigate = useNavigate();
  const premium = state.profile.plan === "premium";

  return (
    <AppShell title="Upgrade" subtitle="Go from tracking to coaching" backTo="/">
      <Card className="hero-gradient space-y-2 text-center">
        <Crown className="mx-auto h-8 w-8 text-gold" aria-hidden />
        <h2 className="font-display text-2xl font-semibold">
          LIFE UPGRADE <span className="gold-text">Premium</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          ₹399 / month · cancel anytime · 7-day trial
        </p>
      </Card>

      <SectionTitle>Free plan</SectionTitle>
      <Card>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {FREE.map((f) => (
            <li key={f} className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              {f}
            </li>
          ))}
        </ul>
      </Card>

      <SectionTitle>Premium plan</SectionTitle>
      <Card className="border-gold/40">
        <ul className="space-y-2 text-sm">
          {PREMIUM.map((f) => (
            <li key={f} className="flex gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
              {f}
            </li>
          ))}
        </ul>
      </Card>

      {premium ? (
        <button
          onClick={() => {
            setProfile({ plan: "free" });
            toast.success("Switched back to the free plan. Your data stays.");
          }}
          className="press w-full rounded-xl border border-border py-3 text-sm font-semibold"
        >
          Switch to free plan
        </button>
      ) : (
        <button
          onClick={() => {
            setProfile({ plan: "premium" });
            toast.success("Premium unlocked. Your AI coach is ready.");
            navigate({ to: "/coach" });
          }}
          className="press w-full rounded-xl bg-gold py-3.5 text-sm font-semibold text-gold-foreground shadow-[var(--shadow-gold)]"
        >
          Start 7-day trial
        </button>
      )}
      <p className="text-center text-[11px] text-muted-foreground">
        Demo billing — no payment is taken in this build.
      </p>

      <Disclaimer text={DISCLAIMER} />
    </AppShell>
  );
}
