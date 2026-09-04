import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Flame, Plus, Trash2, Bell } from "lucide-react";
import { toast } from "sonner";

import { AppShell, Card, Disclaimer, EmptyState, SectionTitle } from "@/components/AppShell";
import { DISCLAIMER, dayKeysBack, todayKey, useStore } from "@/lib/store";

export const Route = createFileRoute("/habits")({
  head: () => ({
    meta: [
      { title: "Habit Tracker & Streaks — LIFE UPGRADE" },
      {
        name: "description",
        content: "Check in on water, movement, workouts, reading and sleep, and watch your streaks grow week by week.",
      },
      { property: "og:title", content: "Habit Tracker & Streaks — LIFE UPGRADE" },
      { property: "og:description", content: "Daily check-ins, weekly progress bars and honest streaks." },
    ],
  }),
  component: HabitsPage,
});

function habitStreak(log: Record<string, string[]>, id: string) {
  let n = 0;
  for (let i = 0; i < 200; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (log[todayKey(d)]?.includes(id)) n++;
    else if (i === 0) continue;
    else break;
  }
  return n;
}

function HabitsPage() {
  const { state, toggleHabit, addHabit, removeHabit, setProfile } = useStore();
  const today = todayKey();
  const done = state.habitLog[today] ?? [];
  const week = dayKeysBack(7);
  const [title, setTitle] = useState("");

  return (
    <AppShell
      title="Habits & streaks"
      subtitle={`${done.length}/${state.habits.length} checked in today`}
      backTo="/"
    >
      <Card className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Bell className="h-4 w-4 text-gold" aria-hidden />
          Daily check-in reminders
        </div>
        <button
          role="switch"
          aria-checked={state.profile.remindersEnabled}
          onClick={() => {
            setProfile({ remindersEnabled: !state.profile.remindersEnabled });
            toast.success(
              state.profile.remindersEnabled ? "Reminders paused." : "Reminders switched on.",
            );
          }}
          className={`press h-7 w-12 rounded-full border p-0.5 ${
            state.profile.remindersEnabled ? "border-primary bg-primary/30" : "border-border bg-muted"
          }`}
        >
          <span
            className={`block h-5 w-5 rounded-full bg-foreground transition-transform ${
              state.profile.remindersEnabled ? "translate-x-5" : ""
            }`}
          />
        </button>
      </Card>

      {state.habits.length === 0 ? (
        <EmptyState title="No habits yet" hint="Start with two habits max. Consistency beats volume." />
      ) : (
        state.habits.map((habit) => {
          const checked = done.includes(habit.id);
          const hits = week.filter((k) => state.habitLog[k]?.includes(habit.id)).length;
          return (
            <Card key={habit.id} className="space-y-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleHabit(habit.id)}
                  aria-pressed={checked}
                  className={`press grid h-9 w-9 shrink-0 place-items-center rounded-full border ${
                    checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-elevated text-muted-foreground"
                  }`}
                  aria-label={`Toggle ${habit.title}`}
                >
                  <Check className="h-4 w-4" aria-hidden />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{habit.title}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Flame className="h-3 w-3 text-gold" aria-hidden />
                    {habitStreak(state.habitLog, habit.id)} day streak · {hits}/7 this week
                  </p>
                </div>
                <button
                  onClick={() => {
                    removeHabit(habit.id);
                    toast.success("Habit removed.");
                  }}
                  aria-label={`Delete ${habit.title}`}
                  className="press rounded-lg border border-border p-2 text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
              <div className="flex gap-1">
                {week.map((k) => (
                  <span
                    key={k}
                    title={k}
                    className={`h-2 flex-1 rounded-full ${
                      state.habitLog[k]?.includes(habit.id) ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </Card>
          );
        })
      )}

      <SectionTitle>Add a habit</SectionTitle>
      <Card className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. 20 min sunlight"
          className="min-w-0 flex-1 rounded-xl border border-input bg-elevated px-3 py-3 text-base outline-none focus:border-primary"
        />
        <button
          onClick={() => {
            if (!title.trim()) {
              toast.error("Give your habit a name.");
              return;
            }
            addHabit({ title: title.trim(), icon: "check" });
            setTitle("");
            toast.success("Habit added.");
          }}
          className="press grid w-12 place-items-center rounded-xl bg-primary text-primary-foreground"
          aria-label="Add habit"
        >
          <Plus className="h-5 w-5" aria-hidden />
        </button>
      </Card>

      <Disclaimer text={DISCLAIMER} />
    </AppShell>
  );
}
