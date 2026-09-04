import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { Card, Disclaimer } from "@/components/AppShell";
import { DISCLAIMER, GOAL_OPTIONS, useStore, type Profile } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Get started — LIFE UPGRADE" },
      {
        name: "description",
        content: "Pick your goals and daily timings so LIFE UPGRADE can build a routine that fits your real life.",
      },
      { property: "og:title", content: "Get started — LIFE UPGRADE" },
      { property: "og:description", content: "Choose your goals, sleep and work timings in under a minute." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { state, setProfile } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Profile>(state.profile);

  const toggleGoal = (goal: string) =>
    setDraft((d) => ({
      ...d,
      goals: d.goals.includes(goal) ? d.goals.filter((g) => g !== goal) : [...d.goals, goal],
    }));

  const finish = () => {
    if (!draft.name.trim()) {
      toast.error("Please add your name first.");
      setStep(0);
      return;
    }
    if (draft.goals.length === 0) {
      toast.error("Pick at least one goal.");
      setStep(1);
      return;
    }
    setProfile({ ...draft, onboarded: true });
    toast.success("Your plan is ready. Let's begin gently.");
    navigate({ to: "/" });
  };

  return (
    <div className="hero-gradient min-h-screen">
      <div className="mx-auto w-full max-w-md space-y-4 px-4 pb-12 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        {step === 0 && (
          <Card className="animate-rise space-y-4">
            <div>
              <h1 className="font-display text-2xl font-semibold">Welcome to LIFE UPGRADE</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                No shame, no pressure. We build your routine step by step.
              </p>
            </div>
            <label className="block text-sm font-medium">
              Your name
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Aarav"
                className="mt-1 w-full rounded-xl border border-input bg-elevated px-3 py-3 text-base outline-none focus:border-primary"
              />
            </label>
            <label className="block text-sm font-medium">
              Coaching language
              <select
                value={draft.language}
                onChange={(e) => setDraft({ ...draft, language: e.target.value as Profile["language"] })}
                className="mt-1 w-full rounded-xl border border-input bg-elevated px-3 py-3 text-base outline-none focus:border-primary"
              >
                <option value="hinglish">Hinglish</option>
                <option value="hindi">Hindi</option>
                <option value="english">English</option>
              </select>
            </label>
          </Card>
        )}

        {step === 1 && (
          <Card className="animate-rise space-y-3">
            <div>
              <h1 className="font-display text-2xl font-semibold">What do you want to improve?</h1>
              <p className="mt-1 text-sm text-muted-foreground">Choose as many as you like.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map((goal) => {
                const active = draft.goals.includes(goal);
                return (
                  <button
                    key={goal}
                    onClick={() => toggleGoal(goal)}
                    aria-pressed={active}
                    className={`press rounded-full border px-3 py-2 text-xs font-medium ${
                      active
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border bg-elevated text-muted-foreground"
                    }`}
                  >
                    {active ? <Check className="mr-1 inline h-3 w-3" aria-hidden /> : null}
                    {goal}
                  </button>
                );
              })}
            </div>
            <Disclaimer text={DISCLAIMER} />
          </Card>
        )}

        {step === 2 && (
          <Card className="animate-rise space-y-4">
            <div>
              <h1 className="font-display text-2xl font-semibold">Your daily timing</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                We plan around your real schedule, not an ideal one.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["wakeTime", "Wake up"],
                  ["sleepTime", "Sleep"],
                  ["workStart", "Work start"],
                  ["workEnd", "Work end"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block text-sm font-medium">
                  {label}
                  <input
                    type="time"
                    value={draft[key]}
                    onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-input bg-elevated px-3 py-3 text-base outline-none focus:border-primary"
                  />
                </label>
              ))}
            </div>
            <label className="block text-sm font-medium">
              Fitness level
              <select
                value={draft.fitnessLevel}
                onChange={(e) =>
                  setDraft({ ...draft, fitnessLevel: e.target.value as Profile["fitnessLevel"] })
                }
                className="mt-1 w-full rounded-xl border border-input bg-elevated px-3 py-3 text-base outline-none focus:border-primary"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
          </Card>
        )}

        <div className="flex gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="press flex-1 rounded-xl border border-border bg-card py-3 text-sm font-semibold"
            >
              Back
            </button>
          )}
          <button
            onClick={() => (step === 2 ? finish() : setStep(step + 1))}
            className="press flex flex-[2] items-center justify-center gap-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
          >
            {step === 2 ? "Start my upgrade" : "Continue"}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
