import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Crown, KeyRound, LogOut, MapPin, RefreshCw, Shield, UserCog, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { AppShell, Card, Disclaimer, SectionTitle } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { DISCLAIMER, GOAL_OPTIONS, useStore, type Profile as ProfileType } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile & Settings — LIFE UPGRADE" },
      {
        name: "description",
        content: "Update your goals, timings, coaching language, reminders and privacy controls.",
      },
      { property: "og:title", content: "Profile & Settings — LIFE UPGRADE" },
      { property: "og:description", content: "You control your goals, reminders and your data." },
    ],
  }),
  component: ProfilePage,
});

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`press h-7 w-12 shrink-0 rounded-full border p-0.5 ${
        checked ? "border-primary bg-primary/30" : "border-border bg-muted"
      }`}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-foreground transition-transform ${checked ? "translate-x-5" : ""}`}
      />
    </button>
  );
}

function ProfilePage() {
  const { state, setProfile, resetAll } = useStore();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const p = state.profile;
  const [confirmReset, setConfirmReset] = useState(false);

  const toggleGoal = (goal: string) =>
    setProfile({
      goals: p.goals.includes(goal) ? p.goals.filter((g) => g !== goal) : [...p.goals, goal],
    });

  const handleResetPassword = async () => {
    const email = user?.email;
    if (!email) {
      toast.error("No account email found.");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/profile`,
      });
      if (error) throw error;
      toast.success("Password reset email sent.");
    } catch (error) {
      console.error(error);
      toast.error("Could not send reset email right now.");
    }
  };

  return (
    <AppShell title="Profile" subtitle="Your plan, your settings, your data">
      <Card className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/20 font-display text-lg font-bold text-primary">
          {(p.name || "U").slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <input
            value={p.name}
            onChange={(e) => setProfile({ name: e.target.value })}
            placeholder="Your name"
            className="w-full bg-transparent font-display text-lg font-semibold outline-none"
          />
          <p className="text-xs text-muted-foreground">
            {p.plan === "premium" ? "Premium member" : "Free plan"}
          </p>
        </div>
        <Link
          to="/upgrade"
          className="press flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold"
        >
          <Crown className="h-3.5 w-3.5" aria-hidden /> {p.plan === "premium" ? "Manage" : "Upgrade"}
        </Link>
      </Card>

      <Card className="space-y-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/onboarding" })}
          className="press flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-elevated px-4 py-3 text-left text-sm font-medium"
        >
          <span className="flex items-center gap-3">
            <UserCog className="h-4 w-4 text-primary" aria-hidden />
            Manage Profile
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
        </button>

        <button
          type="button"
          onClick={() => void handleResetPassword()}
          className="press flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-elevated px-4 py-3 text-left text-sm font-medium"
        >
          <span className="flex items-center gap-3">
            <KeyRound className="h-4 w-4 text-gold" aria-hidden />
            Reset Password
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
        </button>

        <button
          type="button"
          onClick={() => void signOut().then(() => navigate({ to: "/auth" }))}
          className="press flex w-full items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-left text-sm font-semibold text-destructive"
        >
          <span className="flex items-center gap-3">
            <LogOut className="h-4 w-4" aria-hidden />
            Log Out
          </span>
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </Card>

      <SectionTitle>Your goals</SectionTitle>
      <Card className="flex flex-wrap gap-2">
        {GOAL_OPTIONS.map((goal) => {
          const active = p.goals.includes(goal);
          return (
            <button
              key={goal}
              onClick={() => toggleGoal(goal)}
              aria-pressed={active}
              className={`press rounded-full border px-3 py-2 text-xs font-medium ${
                active ? "border-primary bg-primary/15 text-primary" : "border-border bg-elevated text-muted-foreground"
              }`}
            >
              {goal}
            </button>
          );
        })}
      </Card>

      <SectionTitle>Schedule</SectionTitle>
      <Card className="grid grid-cols-2 gap-3">
        {(
          [
            ["wakeTime", "Wake up"],
            ["sleepTime", "Sleep"],
            ["workStart", "Work start"],
            ["workEnd", "Work end"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-xs font-medium text-muted-foreground">
            {label}
            <input
              type="time"
              value={p[key]}
              onChange={(e) => setProfile({ [key]: e.target.value } as Partial<ProfileType>)}
              className="mt-1 w-full rounded-xl border border-input bg-elevated px-3 py-2.5 text-base text-foreground outline-none focus:border-primary"
            />
          </label>
        ))}
        <label className="col-span-2 block text-xs font-medium text-muted-foreground">
          Coaching language
          <select
            value={p.language}
            onChange={(e) => setProfile({ language: e.target.value as ProfileType["language"] })}
            className="mt-1 w-full rounded-xl border border-input bg-elevated px-3 py-2.5 text-base text-foreground outline-none focus:border-primary"
          >
            <option value="hinglish">Hinglish</option>
            <option value="hindi">Hindi</option>
            <option value="english">English</option>
          </select>
        </label>
        <label className="col-span-2 block text-xs font-medium text-muted-foreground">
          Fitness level
          <select
            value={p.fitnessLevel}
            onChange={(e) => setProfile({ fitnessLevel: e.target.value as ProfileType["fitnessLevel"] })}
            className="mt-1 w-full rounded-xl border border-input bg-elevated px-3 py-2.5 text-base text-foreground outline-none focus:border-primary"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>
      </Card>

      <SectionTitle>Reminders</SectionTitle>
      <Card className="space-y-3">
        <div className="flex items-center gap-3">
          <Bell className="h-4 w-4 text-gold" aria-hidden />
          <p className="min-w-0 flex-1 text-sm">Daily routine & check-in reminders</p>
          <Toggle
            label="Daily reminders"
            checked={p.remindersEnabled}
            onChange={() => setProfile({ remindersEnabled: !p.remindersEnabled })}
          />
        </div>
        <div className="flex items-center gap-3">
          <MapPin className="h-4 w-4 text-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm">Location-based walk reminders</p>
            <p className="text-xs text-muted-foreground">
              Optional. Used only to suggest a walk nearby — never stored or shared.
            </p>
          </div>
          <Toggle
            label="Location reminders"
            checked={p.locationReminders}
            onChange={() => {
              setProfile({ locationReminders: !p.locationReminders });
              toast.success(p.locationReminders ? "Location reminders off." : "We'll ask permission when needed.");
            }}
          />
        </div>
      </Card>

      <Link to="/privacy" className="press surface flex items-center gap-3 p-4">
        <Shield className="h-5 w-5 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold">Privacy & data controls</p>
          <p className="text-xs text-muted-foreground">View, export or delete everything you entered</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
      </Link>

      {confirmReset ? (
        <Card className="space-y-3 border-destructive/40">
          <p className="text-sm">
            Reset the app back to sample data? Your current entries will be replaced.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                resetAll();
                setConfirmReset(false);
                toast.success("App reset to sample data.");
              }}
              className="press flex-1 rounded-xl bg-destructive py-3 text-sm font-semibold text-destructive-foreground"
            >
              Yes, reset
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="press flex-1 rounded-xl border border-border py-3 text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setConfirmReset(true)}
          className="press flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold text-muted-foreground"
        >
          <RefreshCw className="h-4 w-4" aria-hidden /> Reset to sample data
        </button>
      )}

      <Disclaimer text={DISCLAIMER} />
    </AppShell>
  );
}
