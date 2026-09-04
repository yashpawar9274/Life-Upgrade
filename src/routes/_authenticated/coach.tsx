import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { Crown, Lock, Mic, Send, Sparkles, Trash2, Map, Volume2, VolumeX, Square } from "lucide-react";
import { toast } from "sonner";

import { AppShell, Card, Disclaimer, SectionTitle } from "@/components/AppShell";
import { t } from "@/lib/i18n";
import { askCoach } from "@/lib/coach.functions";
import { DISCLAIMER, dayScore, streak, todayKey, useStore, weeklyStats } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/coach")({
  head: () => ({
    meta: [
      { title: "LIFE AI COACH — LIFE UPGRADE Premium" },
      {
        name: "description",
        content:
          "Talk out loud with your personal AI life coach in Hindi, Hinglish or English — voice in, voice out, with routines and accountability.",
      },
      { property: "og:title", content: "LIFE AI COACH — Premium" },
      {
        property: "og:description",
        content: "Voice conversations, personalised routines, urge alternatives and weekly plans.",
      },
    ],
  }),
  component: CoachPage,
});

const PROMPTS_EN = [
  "Make me a realistic routine for tomorrow",
  "I feel low energy today, what should I do?",
  "Help me cut cigarettes slowly",
  "Build my Luxury Life Roadmap",
  "Plan my week from my data",
];

const PROMPTS_HI = [
  "कल के लिए एक असली रूटीन बनाओ",
  "आज ऊर्जा कम है, क्या करूँ?",
  "सिगरेट धीरे-धीरे कम करने में मदद करो",
  "मेरा लक्ज़री लाइफ रोडमैप बनाओ",
  "मेरे डेटा से हफ़्ते का प्लान बनाओ",
];

function CoachPage() {
  const { state, pushChat, clearChat } = useStore();
  const call = useServerFn(askCoach);
  const lang = state.profile.language;
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recRef = useRef<{ stop: () => void; abort: () => void } | null>(null);
  const voiceModeRef = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);
  const premium = state.profile.plan === "premium";

  useEffect(() => {
    voiceModeRef.current = voiceMode;
  }, [voiceMode]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.chat.length, loading]);

  const stopAudio = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setSpeaking(false);
  }, []);

  useEffect(
    () => () => {
      audioRef.current?.pause();
      recRef.current?.abort();
    },
    [],
  );

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
      roadmapDone: Object.entries(state.roadmap)
        .filter(([, v]) => v)
        .map(([k]) => k),
      limits: state.limits.map((l) => ({
        name: l.name,
        dailyLimit: l.dailyLimit,
        unit: l.unit,
        today: state.limitLog[today]?.[l.id] ?? 0,
      })),
    });
  };

  /** Speak the coach reply out loud, then listen again for a true voice conversation. */
  const speak = useCallback(
    async (text: string) => {
      try {
        setSpeaking(true);
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, language: lang }),
        });
        if (!res.ok) throw new Error(await res.text());
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          URL.revokeObjectURL(url);
          setSpeaking(false);
          audioRef.current = null;
          if (voiceModeRef.current) startVoice();
        };
        await audio.play();
      } catch {
        setSpeaking(false);
        toast.error(lang === "hindi" ? "आवाज़ अभी उपलब्ध नहीं है।" : "Voice is unavailable right now.");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang],
  );

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || loading) return;
    stopAudio();
    pushChat({ role: "user", content: message });
    setInput("");
    setLoading(true);
    try {
      const history = [...state.chat, { role: "user" as const, content: message }]
        .slice(-12)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await call({
        data: { messages: history, context: contextString(), language: lang },
      });
      pushChat({ role: "assistant", content: res.reply });
      if (voiceModeRef.current) void speak(res.reply);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Coach is unavailable right now.");
      pushChat({
        role: "assistant",
        content:
          lang === "hindi"
            ? "अभी मैं जवाब नहीं ला पाया। तब तक: 10 गहरी सांसें, 300ml पानी और 10 मिनट की वॉक। थोड़ी देर में फिर कोशिश करें।"
            : "I couldn't reach my brain just now. Meanwhile: 10 slow breaths, 300ml water, and a 10 minute walk. Try again in a moment.",
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
      toast.error(
        lang === "hindi" ? "इस ब्राउज़र में वॉइस इनपुट नहीं है।" : "Voice input isn't supported in this browser.",
      );
      return;
    }
    const rec = new SR() as any;
    recRef.current = rec;
    rec.lang = lang === "english" ? "en-IN" : "hi-IN";
    rec.interimResults = false;
    setListening(true);
    rec.onresult = (e: any) => {
      const said = String(e.results[0][0].transcript);
      if (voiceModeRef.current) void send(said);
      else setInput(said);
    };
    rec.onerror = () => setListening(false);
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
            Talk out loud — voice in, voice out — in Hindi, Hinglish or English, with routines built from
            your goals, sleep, work timing and mood.
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
          "Voice-to-voice conversations with your coach",
          "Daily accountability, never shaming",
          "Healthy alternatives for urges",
          "Smart planner around your real work hours",
          "Luxury Life Roadmap: health, skills, savings, circle",
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

  const prompts = lang === "hindi" ? PROMPTS_HI : PROMPTS_EN;

  return (
    <AppShell
      title="LIFE AI COACH"
      subtitle={
        speaking
          ? t(lang, "coach.speaking")
          : listening
            ? t(lang, "coach.listening")
            : `${t(lang, "coach.voice")}: ${voiceMode ? "on" : "off"}`
      }
      action={
        <div className="mt-1 flex gap-1.5">
          <button
            onClick={() => {
              const next = !voiceMode;
              setVoiceMode(next);
              voiceModeRef.current = next;
              if (next) startVoice();
              else {
                stopAudio();
                recRef.current?.abort();
                setListening(false);
              }
            }}
            aria-pressed={voiceMode}
            aria-label={t(lang, "coach.voice")}
            className={`press rounded-full border p-2 ${
              voiceMode ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            {voiceMode ? <Volume2 className="h-4 w-4" aria-hidden /> : <VolumeX className="h-4 w-4" aria-hidden />}
          </button>
          {state.chat.length ? (
            <button
              onClick={() => {
                clearChat();
                toast.success(lang === "hindi" ? "चैट साफ़ हो गई।" : "Chat cleared.");
              }}
              aria-label="Clear chat"
              className="press rounded-full border border-border p-2 text-muted-foreground"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
      }
    >
      {state.chat.length === 0 && (
        <Card className="space-y-3">
          <p className="flex items-center gap-2 font-display text-sm font-semibold">
            <Map className="h-4 w-4 text-gold" aria-hidden />{" "}
            {lang === "hindi" ? "यहाँ से शुरू करें" : "Start here"}
          </p>
          <div className="flex flex-wrap gap-2">
            {prompts.map((p) => (
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
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-3 text-sm leading-relaxed ${
                m.role === "user" ? "bg-primary/20 text-foreground" : "surface bg-card"
              }`}
            >
              {m.content}
              {m.role === "assistant" ? (
                <button
                  onClick={() => void speak(m.content)}
                  aria-label="Play reply"
                  className="press mt-2 flex items-center gap-1 text-xs font-semibold text-primary"
                >
                  <Volume2 className="h-3.5 w-3.5" aria-hidden /> {lang === "hindi" ? "सुनें" : "Listen"}
                </button>
              ) : null}
            </div>
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
            onClick={() => (listening ? recRef.current?.stop() : startVoice())}
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
            placeholder={t(lang, "coach.placeholder")}
            className="min-w-0 flex-1 bg-transparent px-1 py-2 text-base outline-none"
          />
          {speaking ? (
            <button
              onClick={stopAudio}
              aria-label="Stop speaking"
              className="press grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground"
            >
              <Square className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
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
      <Disclaimer text={lang === "hindi" ? t(lang, "disclaimer") : DISCLAIMER} />
    </AppShell>
  );
}
