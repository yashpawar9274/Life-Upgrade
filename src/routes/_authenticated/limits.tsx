import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Minus, Plus, HeartHandshake, Phone, Sparkles, Lock } from "lucide-react";

import { AppShell, Card, Disclaimer, EmptyState, SectionTitle } from "@/components/AppShell";
import { DISCLAIMER, aiLimitPlan, dayKeysBack, todayKey, useStore } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/limits")({
  head: () => ({
    meta: [
      { title: "Bad Habit Control — LIFE UPGRADE" },
      {
        name: "description",
        content: "Set gentle daily limits for smoking, alcohol, junk food, scrolling or gaming and track reduction without judgement.",
      },
      { property: "og:title", content: "Bad Habit Control — LIFE UPGRADE" },
      { property: "og:description", content: "Reduce harmful habits step by step, at a safe pace." },
    ],
  }),
  component: LimitsPage,
});

function LimitsPage() {
  const { state, logLimit, updateLimit } = useStore();
  const today = todayKey();
  const dayLog = state.limitLog[today] ?? {};
  const week = dayKeysBack(7);
  const limits = state.limits;

  // The coach decides every cap automatically from the user's own trend.
  useEffect(() => {
    for (const limit of limits) {
      const { cap } = aiLimitPlan(state, limit);
      if (cap !== limit.dailyLimit) updateLimit(limit.id, { dailyLimit: cap });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, limits.length]);

  return (
    <AppShell
      title="Bad habit control"
      subtitle="AI sets every limit. You just log and keep showing up."
      backTo="/"
    >
      <Card className="border-primary/30 bg-primary/5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
          <p className="text-sm leading-relaxed">
            Nothing here is manual. Your coach reads your last 14 days, sets a safe daily cap, and lowers it
            one gentle step at a time — never a jump, never any blame.
          </p>
        </div>
      </Card>

      {limits.length === 0 ? (
        <EmptyState title="No habits tracked" hint="Your coach will add a safe daily cap after onboarding." />
      ) : (
        <>
          <SectionTitle>AI decided limits</SectionTitle>
          {limits.map((limit) => {
            const { cap, reason } = aiLimitPlan(state, limit);
            const used = dayLog[limit.id] ?? 0;
            const pct = cap ? Math.min(100, Math.round((used / cap) * 100)) : 0;
            const weekAvg = Math.round(
              week.reduce((n, k) => n + (state.limitLog[k]?.[limit.id] ?? 0), 0) / week.length,
            );
            return (
              <Card key={limit.id} className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base font-semibold">{limit.name}</p>
                    <p className="text-xs text-muted-foreground">{reason}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-elevated px-2 py-1 text-[11px] text-muted-foreground">
                    <Lock className="h-3 w-3" aria-hidden /> AI set
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => logLimit(limit.id, -1)}
                    aria-label={`Decrease ${limit.name}`}
                    className="press grid h-10 w-10 place-items-center rounded-xl border border-border bg-elevated"
                  >
                    <Minus className="h-4 w-4" aria-hidden />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-display text-xl font-bold">{used}</span>
                      <span className="text-muted-foreground"> / {cap} {limit.unit} today</span>
                    </p>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${used > cap ? "bg-destructive" : "bg-primary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      7-day average: {weekAvg} {limit.unit} ·{" "}
                      {used > cap ? "Over today — tomorrow is a fresh page." : "On track"}
                    </p>
                  </div>
                  <button
                    onClick={() => logLimit(limit.id, 1)}
                    aria-label={`Increase ${limit.name}`}
                    className="press grid h-10 w-10 place-items-center rounded-xl border border-border bg-elevated"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </Card>
            );
          })}
        </>
      )}

      <SectionTitle>Healthy boundaries</SectionTitle>
      <Card className="space-y-2">
        <p className="flex items-center gap-2 font-display text-sm font-semibold">
          <HeartHandshake className="h-4 w-4 text-primary" aria-hidden /> Distance from bad environment
        </p>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li>• Decide in advance which places you skip this week.</li>
          <li>• Keep one ready sentence: "Not today, I'm on a plan."</li>
          <li>• Replace the slot — walk, gym, call a supportive friend.</li>
          <li>• Build one new circle: class, sport, study group.</li>
        </ul>
        <p className="text-xs text-muted-foreground">
          This app never reads your messages, calls or contacts. Boundaries are planned by you, for you.
        </p>
      </Card>

      <Card className="border-gold/30">
        <p className="flex items-center gap-2 text-sm font-semibold text-gold">
          <Phone className="h-4 w-4" aria-hidden /> Need more support?
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          If you feel strong dependence, withdrawal symptoms, or thoughts of harming yourself, please
          contact a doctor, counsellor or a local helpline. You deserve real support.
        </p>
      </Card>

      <Disclaimer text={DISCLAIMER} />
    </AppShell>
  );
}
