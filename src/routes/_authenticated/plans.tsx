import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Dumbbell, Footprints, Brain, Timer } from "lucide-react";

import { AppShell, Card, Disclaimer, SectionTitle } from "@/components/AppShell";
import { DISCLAIMER, useStore } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/plans")({
  head: () => ({
    meta: [
      { title: "Workout, Walking & Meditation Plans — LIFE UPGRADE" },
      {
        name: "description",
        content: "Simple beginner-to-advanced workout, walking, running and meditation plans matched to your fitness level.",
      },
      { property: "og:title", content: "Workout & Meditation Plans — LIFE UPGRADE" },
      { property: "og:description", content: "Move gently, build strength, breathe better — plans that fit your level." },
    ],
  }),
  component: PlansPage,
});

type Tab = "workout" | "cardio" | "meditation";

const PLANS: Record<Tab, Record<string, { title: string; items: string[] }>> = {
  workout: {
    beginner: {
      title: "Full-body starter · 20 min",
      items: [
        "Warm-up: 3 min arm circles + hip openers",
        "Squats — 3 × 10 (slow, chest up)",
        "Incline push-ups — 3 × 8",
        "Glute bridge — 3 × 12",
        "Plank — 3 × 20 sec",
        "Stretch 3 min, water 300ml",
      ],
    },
    intermediate: {
      title: "Strength push/pull · 35 min",
      items: [
        "Warm-up: 5 min brisk walk + mobility",
        "Push-ups — 4 × 12",
        "Dumbbell rows — 4 × 10 each side",
        "Split squats — 3 × 10 each leg",
        "Hollow hold — 3 × 30 sec",
        "Cool down + 5 min stretch",
      ],
    },
    advanced: {
      title: "Power circuit · 45 min",
      items: [
        "Warm-up: 6 min skipping + mobility",
        "Weighted squats — 5 × 6",
        "Pull-ups — 5 × 6",
        "Overhead press — 4 × 8",
        "Romanian deadlift — 4 × 8",
        "Finisher: 8 × 20 sec sprint / 40 sec walk",
      ],
    },
  },
  cardio: {
    beginner: {
      title: "Walk build-up · 25 min",
      items: [
        "5 min easy walk",
        "15 min brisk walk (able to talk, not sing)",
        "5 min slow walk + calf stretch",
        "Target: 6,000 steps today",
      ],
    },
    intermediate: {
      title: "Walk-run intervals · 30 min",
      items: [
        "5 min warm-up walk",
        "6 × (2 min jog / 1 min walk)",
        "5 min cool down",
        "Target: 8,000 steps today",
      ],
    },
    advanced: {
      title: "Steady run · 40 min",
      items: [
        "8 min easy jog",
        "25 min steady run at conversational pace",
        "7 min cool down + hip stretches",
        "Target: 10,000 steps today",
      ],
    },
  },
  meditation: {
    beginner: {
      title: "Breath basics · 5 min",
      items: [
        "Sit tall, eyes soft, shoulders down",
        "Inhale 4 · exhale 6, for 10 rounds",
        "Notice 3 sounds around you",
        "End with one intention for the day",
      ],
    },
    intermediate: {
      title: "Focus reset · 10 min",
      items: [
        "2 min body scan, head to feet",
        "5 min breath counting (1–10, restart on drift)",
        "3 min gratitude — 3 specific things",
      ],
    },
    advanced: {
      title: "Deep calm · 20 min",
      items: [
        "4 min box breathing (4-4-4-4)",
        "10 min open awareness, no control",
        "4 min loving-kindness for yourself and one difficult person",
        "2 min silent sitting",
      ],
    },
  },
};

function PlansPage() {
  const { state, addFocusMinutes } = useStore();
  const [tab, setTab] = useState<Tab>("workout");
  const level = state.profile.fitnessLevel;
  const plan = PLANS[tab][level] ?? PLANS[tab]['beginner']!;

  return (
    <AppShell title="Plans" subtitle={`Matched to your level: ${level}`} backTo="/">
      <div className="flex gap-2">
        {(
          [
            ["workout", "Workout", Dumbbell],
            ["cardio", "Walk / Run", Footprints],
            ["meditation", "Meditation", Brain],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={`press flex flex-1 flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-semibold ${
              tab === key ? "border-primary bg-primary/15 text-primary" : "border-border bg-card text-muted-foreground"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <Card className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{plan.title}</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {plan.items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
        <button
          onClick={() => addFocusMinutes(15)}
          className="press flex w-full items-center justify-center gap-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
        >
          <Timer className="h-4 w-4" aria-hidden /> Log 15 active minutes
        </button>
      </Card>

      <SectionTitle>Urge alternatives</SectionTitle>
      <Card>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li>• Craving a cigarette → 10 slow breaths + 5 min walk outside.</li>
          <li>• Craving a drink → cold sparkling water with lime, then shower.</li>
          <li>• Craving junk → protein first (eggs, curd, dal), then decide.</li>
          <li>• Craving scroll → 20 push-ups or 2 pages of a book.</li>
        </ul>
      </Card>

      <Disclaimer text={DISCLAIMER} />
    </AppShell>
  );
}
