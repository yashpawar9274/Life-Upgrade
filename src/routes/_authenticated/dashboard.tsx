import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Flame,
  Crown,
  Droplet,
  Dumbbell,
  Brain,
  Timer,
  ShieldAlert,
  ListChecks,
  TrendingUp,
  Sparkles,
  ChevronRight,
} from "lucide-react";

import { AppShell, Card, Disclaimer, SectionTitle } from "@/components/AppShell";
import {
  DISCLAIMER,
  MOODS,
  dayScore,
  levelFor,
  motivationOfDay,
  streak,
  todayKey,
  useStore,
} from "@/lib/store";

export const Route = createFileRoute("/_authenticated/dashboard")({
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
  component: Home,
});

function Ring({ value }: { value: number }) {
  return (
    <div
      className="relative grid h-24 w-24 place-items-center rounded-full"
      style={{
        background: `conic-gradient(var(--primary) ${value * 3.6}deg, color-mix(in oklab, var(--muted) 90%, transparent) 0deg)`,
      }}
      role="img"
      aria-label={`Today's score ${value} out of 100`}
    >
      <div className="grid h-[76px] w-[76px] place-items-center rounded-full bg-card">
        <span className="font-display text-xl font-bold">{value}</span>
      </div>
    </div>
  );
}

const quickLinks = [
  { to: "/routine", key: "link.routine", icon: ListChecks },
  { to: "/habits", key: "link.habits", icon: Flame },
  { to: "/limits", key: "link.limits", icon: ShieldAlert },
  { to: "/plans", key: "link.plans", icon: Dumbbell },
  { to: "/focus", key: "link.focus", icon: Timer },
  { to: "/progress", key: "link.report", icon: TrendingUp },
  { to: "/roadmap", key: "roadmap.title", icon: Map },
] as const;

function Home() {
  const { state, setMood, toggleHabit, hydrated } = useStore();
  const navigate = useNavigate();
  const today = todayKey();
  const score = dayScore(state);
  const days = streak(state);
  const level = levelFor(days);
  const mood = state.moodLog[today];
  const doneHabits = state.habitLog[today] ?? [];
  const nextRoutine = state.routines
    .slice()
    .sort((a, b) => a.time.localeCompare(b.time))
    .find((r) => !(state.routineLog[today] ?? []).includes(r.id));

  useEffect(() => {
    if (hydrated && !state.profile.onboarded) navigate({ to: "/onboarding" });
  }, [hydrated, state.profile.onboarded, navigate]);

  return (
    <AppShell
      title={`Hey ${state.profile.name || "there"} 👋`}
      subtitle={new Date().toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
      })}
      action={
        <Link
          to="/upgrade"
          className="press mt-1 flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold"
        >
          <Crown className="h-3.5 w-3.5" aria-hidden /> {state.profile.plan === "premium" ? "Premium" : "Upgrade"}
        </Link>
      }
    >
      <Card className="hero-gradient flex items-center gap-4">
        <Ring value={score} />
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Today's score</p>
          <p className="mt-1 flex items-center gap-1.5 font-display text-lg font-semibold">
            <Flame className="h-4 w-4 text-gold" aria-hidden /> {days} day streak
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Level: <span className="font-semibold text-primary">{level.name}</span>
          </p>
        </div>
      </Card>

      <Card>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Key focus now</p>
        <p className="mt-2 font-display text-lg font-semibold">
          {nextRoutine ? `${nextRoutine.time} · ${nextRoutine.title}` : "All routine blocks done 🎉"}
        </p>
        <Link
          to="/routine"
          className="press mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary"
        >
          Open routine <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </Card>

      <Card>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Mood check-in</p>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {MOODS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMood(m.key)}
              aria-pressed={mood === m.key}
              className={`press shrink-0 rounded-full border px-3 py-2 text-xs font-medium ${
                mood === m.key
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-elevated text-muted-foreground"
              }`}
            >
              <span aria-hidden>{m.emoji}</span> {m.label}
            </button>
          ))}
        </div>
        {mood ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Logged. Thanks for being honest — we plan around how you actually feel.
          </p>
        ) : null}
      </Card>

      <Card className="border-gold/30">
        <p className="text-xs uppercase tracking-widest text-gold">Daily motivation</p>
        <p className="mt-2 text-[15px] leading-relaxed">{motivationOfDay()}</p>
      </Card>

      <SectionTitle right={<Link to="/habits" className="text-xs font-semibold text-primary">All</Link>}>
        Quick check-ins
      </SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        {[
          { id: "h1", label: "Water", icon: Droplet },
          { id: "h3", label: "Workout", icon: Dumbbell },
          { id: "h4", label: "Meditate", icon: Brain },
        ].map(({ id, label, icon: Icon }) => {
          const habit = state.habits.find((h) => h.id === id);
          if (!habit) return null;
          const done = doneHabits.includes(id);
          return (
            <button
              key={id}
              onClick={() => toggleHabit(id)}
              className={`press surface flex flex-col items-center gap-1 py-3 text-xs font-medium ${
                done ? "border-primary/60 bg-primary/10 text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>

      <SectionTitle>Your toolkit</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {quickLinks.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="press surface flex items-center gap-2 p-3 text-sm font-medium">
            <Icon className="h-4 w-4 text-primary" aria-hidden />
            <span className="min-w-0 truncate">{label}</span>
          </Link>
        ))}
      </div>

      <Link
        to="/coach"
        className="press surface flex items-center gap-3 border-gold/30 bg-gold/5 p-4"
      >
        <Sparkles className="h-5 w-5 text-gold" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold">LIFE AI COACH</p>
          <p className="text-xs text-muted-foreground">
            {state.profile.plan === "premium"
              ? "Talk in Hindi, Hinglish or English"
              : "Premium — personalised routines & accountability"}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
      </Link>

      <Disclaimer text={DISCLAIMER} />
    </AppShell>
  );
}
