import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Crown, Lock, Mic, Send, Sparkles, Trash2, Map } from "lucide-react";
import { toast } from "sonner";

import { AppShell, Card, Disclaimer, SectionTitle } from "@/components/AppShell";
import { askCoach } from "@/lib/coach.functions";
import { DISCLAIMER, dayScore, streak, todayKey, useStore, weeklyStats } from "@/lib/store";

export const Route = createFileRoute("/coach")({
  head: () => ({
    meta: [
      { title: "LIFE AI COACH — LIFE UPGRADE Premium" },
      {
        name: "description",
        content: "Chat with your personal AI life coach in Hindi, Hinglish or English for routines, accountability and a luxury life roadmap.",
      },
      { property: "og:title", content: "LIFE AI COACH — Premium" },
      { property: "og:description", content: "Personalised routines, urge alternatives and weekly improvement plans." },
    ],
  }),
  component: CoachPage,
});

const PROMPTS = [
  "Make me a realistic routine for tomorrow",
  "I feel low energy today, what should I do?",
  "Help me cut cigarettes slowly",
  "Build my Luxury Life Roadmap",
  "Plan my week from my data",
];

function CoachPage() {
  const { state, pushChat, clearChat } = useStore();
  const call = useServerFn(askCoach);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const premium = state.profile.plan === "premium";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.chat.length, loading]);

  const contextString = () => {
    const w = weeklyStats(state);
    const today = todayKey();
    return JSON.stringify({
      name: state.profile.name,
      goals: state.profile.goals,
      wake: state.profile.wakeTime,
      sleep: state.profile.sleepTime,
      work: `${state.profile.workStart}-${state.profile.workEnd}`,
      fitnessLevel: state.profile.fitnessLevel,
      todayScore: dayScore(state),
      streakDays: streak(state),
      weekAvg: w.avg,
      focusMinutesWeek: w.focus,
      mood: state.moodLog[today] ?? "not logged",
      habits: state.habits.map((h) => h.title),
      strongestHabit: w.best?.habit.title,
      weakestHabit: w.worst?.habit.title,
      limits: state.limits.map((l) => ({
        name: l.name,
        dailyLimit: l.dailyLimit,
        unit: l.unit,
        today: state.limitLog[today]?.[l.id] ?? 0,
      })),
    });
  };

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || loading) return;
    pushChat({ role: "user", content: message });
    setInput("");
    setLoading(true);
    try {
      const history = [...state.chat, { role: "user" as const, content: message }]
        .slice(-12)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await call({
        data: { messages: history, context: contextString(), language: state.profile.language },
      });
      pushChat({ role: "assistant", content: res.reply });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Coach is unavailable right now.");
      pushChat({
        role: "assistant",
        content:
          "I couldn't reach my brain just now. Meanwhile: 10 slow breaths, 300ml water, and a 10 minute walk. Try again in a moment.",
      });
    } finally {
      setLoading(false);
    }
  };

  const startVoice = () => {
    const SR =
      (window as unknown as { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice input isn't supported in this browser.");
      return;
    }
    const rec = new SR() as any;
    rec.lang = state.profile.language === "english" ? "en-IN" : "hi-IN";
    rec.interimResults = false;
    setListening(true);
    rec.onresult = (e: any) => setInput(String(e.results[0][0].transcript));
    rec.onerror = () => toast.error("Didn't catch that. Try again.");
    rec.onend = () => setListening(false);
    rec.start();
  };

  if (!premium) {
    return (
      <AppShell title="LIFE AI COACH" subtitle="Premium feature">
        <Card className="hero-gradient space-y-3 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-gold" aria-hidden />
          <h2 className="font-display text-xl font-semibold">Your personal AI life coach</h2>
          <p className="text-sm text-muted-foreground">
            Personalised routines from your goals, sleep, work timing and mood — in Hindi, Hinglish or
            English.
          </p>
          <Link
            to="/upgrade"
            className="press flex items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-semibold text-gold-foreground shadow-[var(--shadow-gold)]"
          >
            <Crown className="h-4 w-4" aria-hidden /> Unlock Premium
          </Link>
        </Card>
        <SectionTitle>What you'd get</SectionTitle>
        {[
          "Daily conversation and honest accountability",
          "Healthy alternatives for urges, never shaming",
          "Smart planner around your real work hours",
          "Luxury Life Roadmap: health, skills, savings, circle",
          "Voice input and weekly AI improvement plans",
        ].map((line) => (
          <Card key={line} className="flex items-center gap-3">
            <Lock className="h-4 w-4 shrink-0 text-gold" aria-hidden />
            <p className="text-sm">{line}</p>
          </Card>
        ))}
        <Disclaimer text={DISCLAIMER} />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="LIFE AI COACH"
      subtitle={`Language: ${state.profile.language}`}
      action={
        state.chat.length ? (
          <button
            onClick={() => {
              clearChat();
              toast.success("Chat cleared.");
            }}
            aria-label="Clear chat"
            className="press mt-1 rounded-full border border-border p-2 text-muted-foreground"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        ) : null
      }
    >
      {state.chat.length === 0 && (
        <Card className="space-y-3">
          <p className="flex items-center gap-2 font-display text-sm font-semibold">
            <Map className="h-4 w-4 text-gold" aria-hidden /> Start here
          </p>
          <div className="flex flex-wrap gap-2">
            {PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="press rounded-full border border-border bg-elevated px-3 py-2 text-xs text-muted-foreground"
              >
                {p}
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {state.chat.map((m) => (
          <div
            key={m.id}
            className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-3 text-sm leading-relaxed ${
              m.role === "user"
                ? "ml-auto bg-primary/20 text-foreground"
                : "surface mr-auto bg-card"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="surface mr-auto flex max-w-[60%] gap-1 px-4 py-3">
            {[0, 150, 300].map((d) => (
              <span
                key={d}
                className="h-2 w-2 animate-bounce rounded-full bg-primary"
                style={{ animationDelay: `${d}ms` }}
              />
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="fixed inset-x-0 bottom-[72px] z-30 mx-auto max-w-md px-4">
        <div className="surface flex items-center gap-2 p-2">
          <button
            onClick={startVoice}
            aria-label="Voice input"
            className={`press grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${
              listening ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            <Mic className="h-4 w-4" aria-hidden />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void send(input);
            }}
            placeholder="Talk to your coach…"
            className="min-w-0 flex-1 bg-transparent px-1 py-2 text-base outline-none"
          />
          <button
            onClick={() => void send(input)}
            disabled={loading}
            aria-label="Send message"
            className="press grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
          >
            <Send className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="h-16" />
      <Disclaimer text={DISCLAIMER} />
    </AppShell>
  );
}
