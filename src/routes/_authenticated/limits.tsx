import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, Trash2, HeartHandshake, Phone } from "lucide-react";
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
  const { state, logLimit, addLimit, updateLimit, removeLimit } = useStore();
  const today = todayKey();
  const dayLog = state.limitLog[today] ?? {};
  const week = dayKeysBack(7);
  const [form, setForm] = useState({ name: "", unit: "times", dailyLimit: 3, goal: "" });

  return (
    <AppShell
      title="Bad habit control"
      subtitle="No judgement. Just honest numbers, going down slowly."
      backTo="/"
    >
      <Card className="border-primary/30 bg-primary/5">
        <p className="text-sm leading-relaxed">
          Reducing gradually is safer and lasts longer than forcing a sudden stop. A higher day is
          information, not failure — log it and continue.
        </p>
      </Card>

      {state.limits.length === 0 ? (
        <EmptyState title="No limits set" hint="Pick one habit you'd like to reduce and set a realistic daily cap." />
      ) : (
        state.limits.map((limit) => {
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
                    toast.success("Limit removed.");
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
                    <span className="text-muted-foreground">
                      {" "}
                      / {limit.dailyLimit} {limit.unit} today
                    </span>
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
        })
      )}

      <SectionTitle>Add a limit</SectionTitle>
      <Card className="space-y-2">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Habit name (e.g. Gaming)"
          className="w-full rounded-xl border border-input bg-elevated px-3 py-3 text-base outline-none focus:border-primary"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            value={form.dailyLimit}
            onChange={(e) => setForm({ ...form, dailyLimit: Number(e.target.value) })}
            className="rounded-xl border border-input bg-elevated px-3 py-3 text-base outline-none focus:border-primary"
          />
          <input
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            placeholder="unit (minutes, times)"
            className="rounded-xl border border-input bg-elevated px-3 py-3 text-base outline-none focus:border-primary"
          />
        </div>
        <input
          value={form.goal}
          onChange={(e) => setForm({ ...form, goal: e.target.value })}
          placeholder="Reduction goal (optional)"
          className="w-full rounded-xl border border-input bg-elevated px-3 py-3 text-base outline-none focus:border-primary"
        />
        <button
          onClick={() => {
            if (!form.name.trim()) {
              toast.error("Name the habit you want to reduce.");
              return;
            }
            addLimit({ ...form, name: form.name.trim() });
            setForm({ name: "", unit: "times", dailyLimit: 3, goal: "" });
            toast.success("Limit added. One step down at a time.");
          }}
          className="press w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
        >
          Add limit
        </button>
      </Card>

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
