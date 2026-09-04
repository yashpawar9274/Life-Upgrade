import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, EyeOff, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell, Card, Disclaimer, SectionTitle } from "@/components/AppShell";
import { DISCLAIMER, useStore } from "@/lib/store";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy & Data Controls — LIFE UPGRADE" },
      {
        name: "description",
        content: "See exactly what LIFE UPGRADE stores, export your data, or delete everything. No monitoring, ever.",
      },
      { property: "og:title", content: "Privacy & Data Controls — LIFE UPGRADE" },
      { property: "og:description", content: "Your data stays on your device and under your control." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { state, wipeData } = useStore();
  const [confirm, setConfirm] = useState(false);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "life-upgrade-my-data.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Your data was exported.");
  };

  const counts = [
    ["Routine steps", state.routines.length],
    ["Habits", state.habits.length],
    ["Limits", state.limits.length],
    ["Days logged", Object.keys(state.habitLog).length],
    ["Mood entries", Object.keys(state.moodLog).length],
    ["Coach messages", state.chat.length],
  ] as const;

  return (
    <AppShell title="Privacy" subtitle="Your data, your device, your choice" backTo="/profile">
      <Card className="space-y-2">
        <p className="flex items-center gap-2 font-display text-sm font-semibold">
          <Shield className="h-4 w-4 text-primary" aria-hidden /> What we store
        </p>
        <div className="grid grid-cols-2 gap-2">
          {counts.map(([label, value]) => (
            <div key={label} className="rounded-xl bg-elevated px-3 py-2">
              <p className="font-display text-base font-bold">{value}</p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Everything above is saved locally on this device so check-ins work offline.
        </p>
      </Card>

      <Card className="space-y-2">
        <p className="flex items-center gap-2 font-display text-sm font-semibold">
          <EyeOff className="h-4 w-4 text-gold" aria-hidden /> What we never do
        </p>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li>• No access to your messages, calls, contacts or browsing history.</li>
          <li>• No background audio, screen or activity recording.</li>
          <li>• No tracking of other people, friends or family.</li>
          <li>• Location is optional, only for walk reminders, and never stored.</li>
          <li>• Microphone is used only while you hold voice input, with your permission.</li>
        </ul>
      </Card>

      <SectionTitle>Data controls</SectionTitle>
      <button
        onClick={exportJson}
        className="press surface flex w-full items-center justify-center gap-2 py-3.5 text-sm font-semibold"
      >
        <Download className="h-4 w-4" aria-hidden /> Export my data (JSON)
      </button>

      {confirm ? (
        <Card className="space-y-3 border-destructive/40">
          <p className="text-sm">
            Delete all routines, habits, limits, check-ins, moods and coach messages? This cannot be
            undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                wipeData();
                setConfirm(false);
                toast.success("All your data was deleted.");
              }}
              className="press flex-1 rounded-xl bg-destructive py-3 text-sm font-semibold text-destructive-foreground"
            >
              Delete everything
            </button>
            <button
              onClick={() => setConfirm(false)}
              className="press flex-1 rounded-xl border border-border py-3 text-sm font-semibold"
            >
              Keep my data
            </button>
          </div>
        </Card>
      ) : (
        <button
          onClick={() => setConfirm(true)}
          className="press flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 py-3.5 text-sm font-semibold text-destructive"
        >
          <Trash2 className="h-4 w-4" aria-hidden /> Delete all my data
        </button>
      )}

      <Disclaimer text={DISCLAIMER} />
    </AppShell>
  );
}
