import { createFileRoute, Link } from "@tanstack/react-router";
import { Crown, Download, Flame, Lock, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
  type AppState,
  type Mood,
} from "@/lib/store";

const MOOD_SCORE: Record<Mood, number> = {
  motivated: 5,
  happy: 4,
  focused: 3,
  "low-energy": 2,
  stressed: 1,
  anxious: 1,
};

/** Streak length as it stood at the end of each day, plus adherence and mood. */
function buildTrend(state: AppState, keys: string[]) {
  let running = 0;
  return keys.map((key) => {
    const score = dayScore(state, key);
    running = score >= 50 ? running + 1 : 0;
    const mood = state.moodLog[key];
    return {
      key,
      label: new Date(key).toLocaleDateString(undefined, { day: "numeric", month: "short" }),
      score,
      streak: running,
      mood: mood ? MOOD_SCORE[mood] : null,
      moodLabel: mood ? (MOODS.find((m) => m.key === mood)?.label ?? mood) : "Not logged",
    };
  });
}


export const Route = createFileRoute("/_authenticated/progress")({
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
                {new Date(w.keys[i] ?? "").toLocaleDateString(undefined, { weekday: "narrow" })}
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
      <Card className={premium ? "space-y-5" : "relative space-y-5 overflow-hidden"}>
        <div className={premium ? "space-y-5" : "pointer-events-none space-y-5 blur-[3px]"}>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Routine adherence (21 days)
            </p>
            <div className="mt-2 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                  <defs>
                    <linearGradient id="adherence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    interval={4}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                      color: "var(--card-foreground)",
                    }}
                    formatter={(v: number) => [`${v}%`, "Adherence"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fill="url(#adherence)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Streak changes</p>
            <div className="mt-2 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    interval={4}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                      color: "var(--card-foreground)",
                    }}
                    formatter={(v: number) => [`${v} days`, "Streak"]}
                  />
                  <Line
                    type="stepAfter"
                    dataKey="streak"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Mood over time</p>
            <div className="mt-2 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    interval={4}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                      color: "var(--card-foreground)",
                    }}
                    formatter={(_v: number, _n, item: any) => [item?.payload?.moodLabel ?? "Not logged", "Mood"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="mood"
                    stroke="var(--chart-3)"
                    strokeWidth={2}
                    connectNulls
                    dot={{ r: 2.5, fill: "var(--chart-3)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              5 = motivated · 4 = happy · 3 = focused · 2 = low energy · 1 = stressed or anxious
            </p>
          </div>

          <div>
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
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Mood trend</p>
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
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Sleep consistency</p>
            <p className="mt-1 flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
              Sleep-on-time hit {w.habitRows.find((r) => r.habit.title.includes("Sleep"))?.hits ?? 0}/7 nights
            </p>
          </div>
        </div>
        {!premium && (
          <Link
            to="/upgrade"
            className="press absolute inset-0 grid place-items-center bg-background/60 text-center"
          >
            <span className="flex flex-col items-center gap-1">
              <Lock className="h-5 w-5 text-gold" aria-hidden />
              <span className="font-display text-sm font-semibold">Unlock premium analytics</span>
              <span className="text-xs text-muted-foreground">
                Adherence, streak and mood charts from your saved data
              </span>
            </span>
          </Link>
        )}
      </Card>


      <Disclaimer text={DISCLAIMER} />
    </AppShell>
  );
}
