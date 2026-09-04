import { createFileRoute, Link } from "@tanstack/react-router";
import { Crown, Download, Flame, Lock, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { AppShell, Card, Disclaimer, SectionTitle } from "@/components/AppShell";
import {
  DISCLAIMER,
  MOODS,
  dayKeysBack,
  dayScore,
  levelFor,
  streak,
  useStore,
  weeklyStats,
} from "@/lib/store";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress & Weekly Report — LIFE UPGRADE" },
      {
        name: "description",
        content: "See your habit heatmap, streaks, mood trend, focus minutes and next-week improvement suggestions.",
      },
      { property: "og:title", content: "Progress & Weekly Report — LIFE UPGRADE" },
      { property: "og:description", content: "Honest weekly numbers plus one small improvement for next week." },
    ],
  }),
  component: ProgressPage,
});

const LEVELS = ["Reset", "Discipline", "Growth", "Elite Routine"];

function ProgressPage() {
  const { state } = useStore();
  const w = weeklyStats(state);
  const days = streak(state);
  const level = levelFor(days);
  const heat = dayKeysBack(21);
  const premium = state.profile.plan === "premium";

  const exportReport = () => {
    const lines = [
      "LIFE UPGRADE — weekly report",
      `Name: ${state.profile.name || "You"}`,
      `Average daily score: ${w.avg}%`,
      `Completed check-ins: ${w.completed}`,
      `Missed check-ins: ${w.missed}`,
      `Current streak: ${days} days (${level.name})`,
      `Focus minutes: ${w.focus}`,
      `Strongest habit: ${w.best?.habit.title ?? "—"}`,
      `Needs attention: ${w.worst?.habit.title ?? "—"}`,
    ].join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "life-upgrade-weekly-report.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Weekly report downloaded.");
  };

  return (
    <AppShell title="Progress" subtitle="Last 7 days, based only on what you entered">
      <Card className="hero-gradient space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Improvement score</p>
            <p className="font-display text-3xl font-bold">{w.avg}%</p>
          </div>
          <p className="flex items-center gap-1 rounded-full bg-gold/15 px-3 py-1.5 text-xs font-semibold text-gold">
            <Flame className="h-3.5 w-3.5" aria-hidden /> {days} days
          </p>
        </div>
        <div className="flex items-end gap-1.5">
          {w.scores.map((s, i) => (
            <div key={w.keys[i]} className="flex-1">
              <div className="h-24 rounded-md bg-muted">
                <div
                  className="w-full rounded-md bg-primary"
                  style={{ height: `${Math.max(6, s)}%`, marginTop: `${100 - Math.max(6, s)}%` }}
                />
              </div>
              <p className="mt-1 text-center text-[10px] text-muted-foreground">
                {new Date(w.keys[i]).toLocaleDateString(undefined, { weekday: "narrow" })}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <SectionTitle>Level path</SectionTitle>
      <Card className="space-y-2">
        <div className="flex items-center gap-1">
          {LEVELS.map((name, i) => (
            <div key={name} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= level.index ? "bg-primary" : "bg-muted"}`} />
              <p className={`mt-1 text-[10px] ${i === level.index ? "text-primary" : "text-muted-foreground"}`}>
                {name}
              </p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {level.next
            ? `${Math.max(0, level.max - days)} more consistent days to reach ${level.next}.`
            : "Elite Routine — now protect it, don't chase more."}
        </p>
      </Card>

      <SectionTitle>Weekly report</SectionTitle>
      <Card className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ["Completed", w.completed],
            ["Missed", w.missed],
            ["Focus min", w.focus],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-xl bg-elevated py-3">
              <p className="font-display text-lg font-bold">{value}</p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Strongest: <span className="text-primary">{w.best?.habit.title ?? "—"}</span> · Needs care:{" "}
          <span className="text-gold">{w.worst?.habit.title ?? "—"}</span>
        </p>
        <p className="text-sm">
          Next week: keep everything the same and add just one improvement —{" "}
          {w.worst ? `hit "${w.worst.habit.title}" 3 times` : "one extra evening walk"}.
        </p>
        <button
          onClick={exportReport}
          className="press flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold"
        >
          <Download className="h-4 w-4" aria-hidden /> Export report
        </button>
      </Card>

      <SectionTitle
        right={
          premium ? null : (
            <Link to="/upgrade" className="flex items-center gap-1 text-xs font-semibold text-gold">
              <Crown className="h-3.5 w-3.5" aria-hidden /> Premium
            </Link>
          )
        }
      >
        Premium analytics
      </SectionTitle>
      <Card className={premium ? "space-y-4" : "relative space-y-4 overflow-hidden"}>
        <div className={premium ? "" : "pointer-events-none blur-[3px]"}>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Habit heatmap (21 days)</p>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {heat.map((k) => {
              const s = dayScore(state, k);
              return (
                <span
                  key={k}
                  title={`${k}: ${s}%`}
                  className="aspect-square rounded-[5px]"
                  style={{
                    backgroundColor: `color-mix(in oklab, var(--primary) ${Math.max(8, s)}%, var(--muted))`,
                  }}
                />
              );
            })}
          </div>

          <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">Mood trend</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {dayKeysBack(7).map((k) => {
              const m = state.moodLog[k];
              return (
                <span key={k} className="rounded-lg bg-elevated px-2 py-1 text-xs">
                  {MOODS.find((x) => x.key === m)?.emoji ?? "·"}{" "}
                  {new Date(k).toLocaleDateString(undefined, { weekday: "short" })}
                </span>
              );
            })}
          </div>

          <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">Sleep consistency</p>
          <p className="mt-1 flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
            Sleep-on-time hit {w.habitRows.find((r) => r.habit.title.includes("Sleep"))?.hits ?? 0}/7 nights
          </p>
        </div>
        {!premium && (
          <Link
            to="/upgrade"
            className="press absolute inset-0 grid place-items-center bg-background/60 text-center"
          >
            <span className="flex flex-col items-center gap-1">
              <Lock className="h-5 w-5 text-gold" aria-hidden />
              <span className="font-display text-sm font-semibold">Unlock premium analytics</span>
              <span className="text-xs text-muted-foreground">Heatmap, mood trends, sleep consistency</span>
            </span>
          </Link>
        )}
      </Card>

      <Disclaimer text={DISCLAIMER} />
    </AppShell>
  );
}
