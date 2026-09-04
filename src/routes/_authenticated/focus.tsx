import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { AppShell, Card, SectionTitle } from "@/components/AppShell";
import { todayKey, useStore } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/focus")({
  head: () => ({
    meta: [
      { title: "Focus Mode Timer — LIFE UPGRADE" },
      {
        name: "description",
        content: "Run deep-work sessions with a distraction-free timer and log your daily focus minutes.",
      },
      { property: "og:title", content: "Focus Mode Timer — LIFE UPGRADE" },
      { property: "og:description", content: "25, 50 or 90 minute deep work blocks with gentle accountability." },
    ],
  }),
  component: FocusPage,
});

const PRESETS = [25, 50, 90];

function FocusPage() {
  const { state, addFocusMinutes } = useStore();
  const [minutes, setMinutes] = useState(25);
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (left === 0 && running && !doneRef.current) {
      doneRef.current = true;
      setRunning(false);
      addFocusMinutes(minutes);
      toast.success(`${minutes} focused minutes logged. Stand up, water, breathe.`);
    }
  }, [left, running, minutes, addFocusMinutes]);

  const pick = (m: number) => {
    setMinutes(m);
    setLeft(m * 60);
    setRunning(false);
    doneRef.current = false;
  };

  const pct = 100 - Math.round((left / (minutes * 60)) * 100);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const todayFocus = state.focusLog[todayKey()] ?? 0;

  return (
    <AppShell title="Focus mode" subtitle={`${todayFocus} focused minutes today`} backTo="/">
      <Card className="hero-gradient flex flex-col items-center gap-4 py-8">
        <div
          className="grid h-52 w-52 place-items-center rounded-full"
          style={{
            background: `conic-gradient(var(--primary) ${pct * 3.6}deg, color-mix(in oklab, var(--muted) 90%, transparent) 0deg)`,
          }}
          role="timer"
          aria-live="off"
        >
          <div className="grid h-44 w-44 place-items-center rounded-full bg-card">
            <span className="font-display text-4xl font-bold tabular-nums">
              {mm}:{ss}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setRunning((r) => !r)}
            className="press flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
          >
            {running ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
            {running ? "Pause" : "Start"}
          </button>
          <button
            onClick={() => pick(minutes)}
            className="press flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold"
          >
            <RotateCcw className="h-4 w-4" aria-hidden /> Reset
          </button>
        </div>
      </Card>

      <SectionTitle>Session length</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((m) => (
          <button
            key={m}
            onClick={() => pick(m)}
            aria-pressed={minutes === m}
            className={`press surface py-3 text-sm font-semibold ${
              minutes === m ? "border-primary/60 bg-primary/10 text-primary" : "text-muted-foreground"
            }`}
          >
            {m} min
          </button>
        ))}
      </div>

      <Card>
        <p className="font-display text-sm font-semibold">Before you start</p>
        <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
          <li>• Phone face down, notifications silenced by you.</li>
          <li>• One tab, one task, water on the table.</li>
          <li>• Write the single outcome for this block.</li>
        </ul>
      </Card>
    </AppShell>
  );
}
