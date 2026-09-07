import { createFileRoute } from "@tanstack/react-router";
import { Minus, Plus, Trash2, HeartHandshake, Phone, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AppShell, Card, Disclaimer, EmptyState, SectionTitle } from "@/components/AppShell";
import { DISCLAIMER, dayKeysBack, todayKey, useStore } from "@/lib/store";

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
  const { state, logLimit, updateLimit, removeLimit } = useStore();
  const today = todayKey();
  const dayLog = state.limitLog[today] ?? {};
  const week = dayKeysBack(7);
  const aiLimits = state.limits.length
    ? state.limits
    : [
        { id: "ai-1", name: "Cigarettes", unit: "cigarettes", dailyLimit: 4, goal: "Reduce by 1 every 10 days" },
        { id: "ai-2", name: "Alcohol", unit: "drinks", dailyLimit: 1, goal: "Keep weekends lighter" },
        { id: "ai-3", name: "Junk food", unit: "meals", dailyLimit: 1, goal: "Stay under 3 meals/week" },
        { id: "ai-4", name: "Doom scrolling", unit: "minutes", dailyLimit: 45, goal: "Keep it below 30 min" },
      ];

  return (
    <AppShell
      title="Bad habit control"
      subtitle="AI sets a gentle cap. You just keep showing up."
      backTo="/"
    >
      <Card className="border-primary/30 bg-primary/5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
          <p className="text-sm leading-relaxed">
            Your coach keeps the plan realistic and non-judgemental. It sets a safe daily cap, monitors your trend,
            and gently nudges the next step instead of demanding perfection.
          </p>
        </div>
      </Card>

      {aiLimits.length === 0 ? (
        <EmptyState title="No limits set" hint="AI will suggest a safer daily cap based on your profile." />
      ) : (
        <>
          <SectionTitle>AI generated limits</SectionTitle>
          {aiLimits.map((limit) => {
            const used = dayLog[limit.id] ?? 0;
            const pct = limit.dailyLimit ? Math.min(100, Math.round((used / limit.dailyLimit) * 100)) : 0;
            const weekAvg = Math.round(
              week.reduce((n, k) => n + (state.limitLog[k]?.[limit.id] ?? 0), 0) / week.length,
            );
            return (
              <Card key={limit.id} className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base font-semibold">{limit.name}</p>
                    <p className="text-xs text-muted-foreground">{limit.goal || "Reduce step by step"}</p>
                  </div>
                  <button
                    onClick={() => {
                      removeLimit(limit.id);
                      toast.success("Limit removed from your plan.");
                    }}
                    aria-label={`Delete ${limit.name} limit`}
                    className="press rounded-lg border border-border p-2 text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
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
                      <span className="text-muted-foreground"> / {limit.dailyLimit} {limit.unit} today</span>
                    </p>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${used > limit.dailyLimit ? "bg-destructive" : "bg-primary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">7-day average: {weekAvg} {limit.unit}</p>
                  </div>
                  <button
                    onClick={() => logLimit(limit.id, 1)}
                    aria-label={`Increase ${limit.name}`}
                    className="press grid h-10 w-10 place-items-center rounded-xl border border-border bg-elevated"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                  </button>
                </div>

                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  Daily limit
                  <input
                    type="number"
                    min={0}
                    value={limit.dailyLimit}
                    onChange={(e) => updateLimit(limit.id, { dailyLimit: Number(e.target.value) })}
                    className="w-20 rounded-lg border border-input bg-elevated px-2 py-1 text-sm text-foreground outline-none focus:border-primary"
                  />
                  <span className="ml-auto">{used > limit.dailyLimit ? "Over today — tomorrow is a fresh page." : "On track"}</span>
                </label>
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
