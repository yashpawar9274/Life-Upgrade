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
  Map,
} from "lucide-react";

import { AppShell, Card, Disclaimer, SectionTitle } from "@/components/AppShell";
import { t } from "@/lib/i18n";
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
      { title: "LIFE UPGRADE â€” Daily Discipline & Lifestyle Coach" },
      {
        name: "description",
        content:
          "Build strong daily routines, track habits and streaks, reduce harmful habits gently, and move toward a confident, healthy, productive life.",
      },
      { property: "og:title", content: "LIFE UPGRADE â€” Your next version starts today" },
      {
        property: "og:description",
        content:
          "Premium mobile coach for routines, habits, focus, mood and progress â€” with an optional AI Life Coach.",
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
  const lang = state.profile.language;
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
      title={`Hey ${state.profile.name || "there"} ðŸ‘‹`}
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
      <Card className="hero-gradient relative overflow-hidden border-primary/25 p-5">
        <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <Ring value={score} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Your discipline score</p>
            <p className="mt-1 font-display text-3xl font-semibold">{score}<span className="text-base text-muted-foreground">/100</span></p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
              <Flame className="h-4 w-4 text-gold" aria-hidden /> {days} day streak Â· {level.name}
            </p>
          </div>
        </div>
        <div className="relative mt-5 grid grid-cols-2 gap-2 border-t border-border/70 pt-4 text-xs">
          <div><p className="text-muted-foreground">Todayâ€™s mission</p><p className="mt-1 font-semibold">Show up once</p></div>
          <div className="border-l border-border/70 pl-3"><p className="text-muted-foreground">Level</p><p className="mt-1 font-semibold text-primary">{level.name}</p></div>
        </div>
      </Card>

      <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Your next step</p><span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">DO THIS NOW</span></div>
        <p className="mt-3 font-display text-xl font-semibold">
          {nextRoutine ? `${nextRoutine.time} Â· ${nextRoutine.title}` : "All routine blocks done ðŸŽ‰"}
        </p>
        <Link
          to="/routine"
          className="press mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Start next step <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </Card>

      <Card>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{t(lang, "dash.mood")}</p>
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
            Logged. Thanks for being honest â€” we plan around how you actually feel.
          </p>
        ) : null}
      </Card>

      <Card className="border-gold/30">
        <p className="text-xs uppercase tracking-widest text-gold">{t(lang, "dash.motivation")}</p>
        <p className="mt-2 text-[15px] leading-relaxed">{motivationOfDay(lang)}</p>
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
        {quickLinks.map(({ to, key, icon: Icon }) => (
          <Link key={to} to={to} className="press surface flex items-center gap-2 p-3 text-sm font-medium">
            <Icon className="h-4 w-4 text-primary" aria-hidden />
            <span className="min-w-0 truncate">{t(lang, key)}</span>
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
              : "Premium â€” personalised routines & accountability"}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
      </Link>

      <Disclaimer text={DISCLAIMER} />
    </AppShell>
  );
}
