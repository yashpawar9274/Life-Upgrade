import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Crown,
  History,
  Lock,
  Map,
  Mic,
  MicOff,
  Send,
  Settings2,
  Sparkles,
  Square,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell, Card, Disclaimer, SectionTitle } from "@/components/AppShell";
import { t } from "@/lib/i18n";
import { askCoach } from "@/lib/coach.functions";
import {
  DISCLAIMER,
  dayScore,
  streak,
  todayKey,
  useStore,
  weeklyStats,
  type VoiceTurn,
} from "@/lib/store";

export const Route = createFileRoute("/_authenticated/coach")({
  head: () => ({
    meta: [
      { title: "Personal AI Coach | LIFE UPGRADE" },
      {
        name: "description",
        content:
          "Plan your day, build discipline and get practical support in Hindi, Hinglish or English.",
      },
      { property: "og:title", content: "Personal AI Coach â€” LIFE UPGRADE" },
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
  "à¤•à¤² à¤•à¥‡ à¤²à¤¿à¤ à¤à¤• à¤…à¤¸à¤²à¥€ à¤°à¥‚à¤Ÿà¥€à¤¨ à¤¬à¤¨à¤¾à¤“",
  "à¤†à¤œ à¤Šà¤°à¥à¤œà¤¾ à¤•à¤® à¤¹à¥ˆ, à¤•à¥à¤¯à¤¾ à¤•à¤°à¥‚à¤?",
  "à¤¸à¤¿à¤—à¤°à¥‡à¤Ÿ à¤§à¥€à¤°à¥‡-à¤§à¥€à¤°à¥‡ à¤•à¤® à¤•à¤°à¤¨à¥‡ à¤®à¥‡à¤‚ à¤®à¤¦à¤¦ à¤•à¤°à¥‹",
  "à¤®à¥‡à¤°à¤¾ à¤²à¤•à¥à¤œà¤¼à¤°à¥€ à¤²à¤¾à¤‡à¤« à¤°à¥‹à¤¡à¤®à¥ˆà¤ª à¤¬à¤¨à¤¾à¤“",
  "à¤®à¥‡à¤°à¥‡ à¤¡à¥‡à¤Ÿà¤¾ à¤¸à¥‡ à¤¹à¤«à¤¼à¥à¤¤à¥‡ à¤•à¤¾ à¤ªà¥à¤²à¤¾à¤¨ à¤¬à¤¨à¤¾à¤“",
];

type Status = "idle" | "listening" | "thinking" | "speaking" | "background";

const uid = () => Math.random().toString(36).slice(2, 10);

function CoachPage() {
  const {
    state,
    pushChat,
    clearChat,
    setVoiceSettings,
    saveVoiceSession,
  } = useStore();
  const call = useServerFn(askCoach);
  const lang = state.profile.language;
  const hi = lang === "hindi";
  const voice = state.voice;

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [micPermission, setMicPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const [level, setLevel] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recRef = useRef<any>(null);
  const voiceModeRef = useRef(false);
  const statusRef = useRef<Status>("idle");
  const autoStopRef = useRef<number | null>(null);
  const meterRef = useRef<{ ctx: AudioContext; stream: MediaStream; raf: number } | null>(null);
  const wakeLockRef = useRef<any>(null);
  const sessionRef = useRef<{ id: string; startedAt: number; turns: VoiceTurn[] } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const premium = state.profile.plan === "premium";

  const setStat = useCallback((s: Status) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [state.chat.length, loading]);

  /* ---------- mic permission ---------- */

  useEffect(() => {
    const perms = (navigator as any).permissions;
    if (!perms?.query) return;
    perms
      .query({ name: "microphone" as PermissionName })
      .then((res: any) => {
        if (res.state === "granted") setMicPermission("granted");
        if (res.state === "denied") setMicPermission("denied");
        res.onchange = () => setMicPermission(res.state === "granted" ? "granted" : res.state === "denied" ? "denied" : "unknown");
      })
      .catch(() => undefined);
  }, []);

  const requestMic = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission("granted");
      return stream;
    } catch {
      setMicPermission("denied");
      toast.error(
        hi
          ? "à¤®à¤¾à¤‡à¤• à¤•à¥€ à¤…à¤¨à¥à¤®à¤¤à¤¿ à¤¨à¤¹à¥€à¤‚ à¤®à¤¿à¤²à¥€à¥¤ à¤¬à¥à¤°à¤¾à¤‰à¤œà¤¼à¤° à¤¸à¥‡à¤Ÿà¤¿à¤‚à¤— à¤®à¥‡à¤‚ à¤®à¤¾à¤‡à¤•à¥à¤°à¥‹à¤«à¤¼à¥‹à¤¨ à¤šà¤¾à¤²à¥‚ à¤•à¤°à¥‡à¤‚à¥¤"
          : "Microphone permission was blocked. Enable it in your browser settings.",
      );
      return null;
    }
  }, [hi]);

  /* ---------- live mic level meter (drives sensitivity + auto-stop) ---------- */

  const stopMeter = useCallback(() => {
    const m = meterRef.current;
    if (!m) return;
    cancelAnimationFrame(m.raf);
    m.stream.getTracks().forEach((tr) => tr.stop());
    void m.ctx.close().catch(() => undefined);
    meterRef.current = null;
    setLevel(0);
  }, []);

  const armAutoStop = useCallback(() => {
    if (autoStopRef.current) window.clearTimeout(autoStopRef.current);
    if (!voice.autoStopSeconds) return;
    autoStopRef.current = window.setTimeout(() => {
      recRef.current?.stop?.();
    }, voice.autoStopSeconds * 1000);
  }, [voice.autoStopSeconds]);

  const startMeter = useCallback(
    async (stream: MediaStream) => {
      try {
        const ctx = new AudioContext();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        src.connect(analyser);
        const buf = new Uint8Array(analyser.frequencyBinCount);
        const threshold = (11 - voice.sensitivity) / 100; // higher sensitivity â†’ lower threshold
        const tick = () => {
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (const v of buf) sum += (v - 128) * (v - 128);
          const rms = Math.sqrt(sum / buf.length) / 128;
          setLevel(Math.min(1, rms * 6));
          if (rms > threshold) armAutoStop(); // still talking â†’ push the auto-stop timer out
          const raf = requestAnimationFrame(tick);
          if (meterRef.current) meterRef.current.raf = raf;
        };
        meterRef.current = { ctx, stream, raf: requestAnimationFrame(tick) };
      } catch {
        /* metering is optional */
      }
    },
    [armAutoStop, voice.sensitivity],
  );

  /* ---------- background support ---------- */

  const requestWakeLock = useCallback(async () => {
    try {
      const wl = (navigator as any).wakeLock;
      if (wl?.request) wakeLockRef.current = await wl.request("screen");
    } catch {
      /* not supported â€” audio still continues */
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    try {
      wakeLockRef.current?.release?.();
    } catch {
      /* ignore */
    }
    wakeLockRef.current = null;
  }, []);

  const stopAudio = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (statusRef.current === "speaking") setStat(voiceModeRef.current ? "idle" : "idle");
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
  }, [setStat]);

  const stopListening = useCallback(() => {
    try {
      recRef.current?.abort?.();
    } catch {
      /* ignore */
    }
    recRef.current = null;
    if (autoStopRef.current) window.clearTimeout(autoStopRef.current);
    stopMeter();
  }, [stopMeter]);

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

  const recordTurn = (turn: VoiceTurn) => {
    if (sessionRef.current) sessionRef.current.turns.push(turn);
  };

  const finishSession = useCallback(() => {
    const s = sessionRef.current;
    sessionRef.current = null;
    if (!s || s.turns.length === 0) return;
    if (!state.voice.autoSaveSessions) return;
    const firstUser = s.turns.find((x) => x.role === "user")?.content ?? "Voice session";
    saveVoiceSession({
      id: s.id,
      title: firstUser.slice(0, 60),
      startedAt: s.startedAt,
      endedAt: Date.now(),
      language: lang,
      turns: s.turns,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, saveVoiceSession, state.voice.autoSaveSessions]);

  /* ---------- speaking ---------- */

  const speak = useCallback(
    async (text: string) => {
      try {
        setStat("speaking");
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, language: lang, speed: state.voice.speed }),
        });
        if (!res.ok) throw new Error(await res.text());
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.playbackRate = state.voice.speed;
        audio.preservesPitch = true;
        audioRef.current = audio;

        if ("mediaSession" in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: hi ? "à¤ªà¤°à¥à¤¸à¤¨à¤² à¤à¤†à¤ˆ à¤•à¥‹à¤š" : "Personal AI Coach",
            artist: hi ? "à¤†à¤ªà¤•à¤¾ à¤²à¤¾à¤‡à¤« à¤•à¥‹à¤š" : "Your life coach",
            album: "LIFE UPGRADE",
            artwork: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
          });
          navigator.mediaSession.playbackState = "playing";
          navigator.mediaSession.setActionHandler("pause", () => stopAudio());
          navigator.mediaSession.setActionHandler("play", () => void audio.play().catch(() => undefined));
          navigator.mediaSession.setActionHandler("stop", () => stopAudio());
        }

        audio.onended = () => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "none";
          if (!voiceModeRef.current) {
            setStat("idle");
            return;
          }
          if (document.hidden && !state.voice.backgroundMode) {
            setStat("background");
            return;
          }
          if (document.hidden) {
            // Browsers suspend speech recognition in the background; wait for return.
            setStat("background");
            return;
          }
          void startVoice();
        };
        await audio.play();
      } catch {
        setStat("idle");
        toast.error(hi ? "à¤†à¤µà¤¾à¤œà¤¼ à¤…à¤­à¥€ à¤‰à¤ªà¤²à¤¬à¥à¤§ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤" : "Voice is unavailable right now.");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang, hi, state.voice.speed, state.voice.backgroundMode],
  );

  /* ---------- sending ---------- */

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || loading) return;
    stopAudio();
    pushChat({ role: "user", content: message });
    recordTurn({ role: "user", content: message, at: Date.now() });
    setInput("");
    setLoading(true);
    if (voiceModeRef.current) setStat("thinking");
    try {
      const history = [...state.chat, { role: "user" as const, content: message }]
        .slice(-12)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await call({
        data: { messages: history, context: contextString(), language: lang },
      });
      if (!res.ok) {
        toast.error(res.message);
        if (voiceModeRef.current) setStat("idle");
        return;
      }
      pushChat({ role: "assistant", content: res.reply });
      recordTurn({ role: "assistant", content: res.reply, at: Date.now() });
      if (voiceModeRef.current) void speak(res.reply);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Coach is unavailable right now.");
      pushChat({
        role: "assistant",
        content: hi
          ? "à¤…à¤­à¥€ à¤®à¥ˆà¤‚ à¤œà¤µà¤¾à¤¬ à¤¨à¤¹à¥€à¤‚ à¤²à¤¾ à¤ªà¤¾à¤¯à¤¾à¥¤ à¤¤à¤¬ à¤¤à¤•: 10 à¤—à¤¹à¤°à¥€ à¤¸à¤¾à¤‚à¤¸à¥‡à¤‚, 300ml à¤ªà¤¾à¤¨à¥€ à¤”à¤° 10 à¤®à¤¿à¤¨à¤Ÿ à¤•à¥€ à¤µà¥‰à¤•à¥¤ à¤¥à¥‹à¤¡à¤¼à¥€ à¤¦à¥‡à¤° à¤®à¥‡à¤‚ à¤«à¤¿à¤° à¤•à¥‹à¤¶à¤¿à¤¶ à¤•à¤°à¥‡à¤‚à¥¤"
          : "I couldn't reach my brain just now. Meanwhile: 10 slow breaths, 300ml water, and a 10 minute walk. Try again in a moment.",
      });
      if (voiceModeRef.current) setStat("idle");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- listening ---------- */

  const startVoice = useCallback(
    async () => {
      const SR =
        (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
      if (!SR) {
        toast.error(hi ? "à¤‡à¤¸ à¤¬à¥à¤°à¤¾à¤‰à¤œà¤¼à¤° à¤®à¥‡à¤‚ à¤µà¥‰à¤‡à¤¸ à¤‡à¤¨à¤ªà¥à¤Ÿ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤" : "Voice input isn't supported in this browser.");
        return;
      }
      const stream = await requestMic();
      if (!stream) return;
      void startMeter(stream);

      const rec = new SR();
      recRef.current = rec;
      rec.lang = lang === "english" ? "en-IN" : "hi-IN";
      rec.interimResults = false;
      rec.continuous = false;
      setStat("listening");
      armAutoStop();

      rec.onresult = (e: any) => {
        const said = String(e.results[0][0].transcript);
        if (voiceModeRef.current) void send(said);
        else setInput(said);
      };
      rec.onerror = () => {
        stopMeter();
        setStat("idle");
      };
      rec.onend = () => {
        stopMeter();
        if (statusRef.current === "listening") setStat("idle");
      };
      try {
        rec.start();
      } catch {
        setStat("idle");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hi, lang, armAutoStop, requestMic, startMeter, stopMeter],
  );

  const toggleVoiceMode = async () => {
    const next = !voiceMode;
    setVoiceMode(next);
    voiceModeRef.current = next;
    if (next) {
      sessionRef.current = { id: uid(), startedAt: Date.now(), turns: [] };
      if (state.voice.backgroundMode) void requestWakeLock();
      await startVoice();
    } else {
      stopAudio();
      stopListening();
      releaseWakeLock();
      finishSession();
      setStat("idle");
    }
  };

  /* ---------- background / foreground handling ---------- */

  useEffect(() => {
    const onVisibility = () => {
      if (!voiceModeRef.current) return;
      if (document.hidden) {
        // Recognition cannot run in the background: pause it, keep audio going.
        stopListening();
        if (statusRef.current !== "speaking") setStat("background");
      } else if (statusRef.current === "background") {
        void startVoice();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [setStat, startVoice, stopListening]);

  useEffect(
    () => () => {
      audioRef.current?.pause();
      try {
        recRef.current?.abort?.();
      } catch {
        /* ignore */
      }
      stopMeter();
      releaseWakeLock();
    },
    [releaseWakeLock, stopMeter],
  );

  if (!premium) {
    return (
      <AppShell title="Personal AI Coach" subtitle="Premium feature">
        <Card className="hero-gradient space-y-3 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-gold" aria-hidden />
          <h2 className="font-display text-xl font-semibold">Your personal AI life coach</h2>
          <p className="text-sm text-muted-foreground">
            Talk out loud â€” voice in, voice out â€” in Hindi, Hinglish or English, with routines built from
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
          "Personal daily plans built around your time and goals",
          "Voice input and voice replies while the app is open",
          "Weekly reviews, recovery plans and habit guidance",
          "Saved transcripts you can edit and reuse",
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

  const prompts = hi ? PROMPTS_HI : PROMPTS_EN;

  const statusLabel: Record<Status, string> = {
    idle: hi ? "à¤¤à¥ˆà¤¯à¤¾à¤°" : "Ready",
    listening: hi ? "à¤¸à¥à¤¨ à¤°à¤¹à¤¾ à¤¹à¥‚à¤â€¦" : "Listeningâ€¦",
    thinking: hi ? "à¤¸à¥‹à¤š à¤°à¤¹à¤¾ à¤¹à¥‚à¤â€¦" : "Thinkingâ€¦",
    speaking: hi ? "à¤¬à¥‹à¤² à¤°à¤¹à¤¾ à¤¹à¥‚à¤â€¦" : "Speakingâ€¦",
    background: hi ? "à¤¬à¥ˆà¤•à¤—à¥à¤°à¤¾à¤‰à¤‚à¤¡ à¤®à¥‡à¤‚ à¤°à¥à¤•à¤¾ â€” à¤µà¤¾à¤ªà¤¸ à¤†à¤¤à¥‡ à¤¹à¥€ à¤šà¤¾à¤²à¥‚" : "Paused in background â€” resumes on return",
  };

  return (
    <AppShell
      title="Personal AI Coach"
      subtitle={voiceMode ? (hi ? "à¤†à¤µà¤¾à¤œà¤¼ à¤šà¤¾à¤²à¥‚ à¤¹à¥ˆ" : "Voice mode active") : hi ? "à¤†à¤µà¤¾à¤œà¤¼ à¤¸à¥‡ à¤¬à¤¾à¤¤ à¤•à¤°à¥‡à¤‚" : "Talk by voice"}
      action={
        <div className="mt-1 flex gap-1.5">
          <button
            onClick={() => setShowSettings((v) => !v)}
            aria-pressed={showSettings}
            aria-label={hi ? "à¤µà¥‰à¤‡à¤¸ à¤¸à¥‡à¤Ÿà¤¿à¤‚à¤—" : "Voice settings"}
            className={`press rounded-full border p-2 ${
              showSettings ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            <Settings2 className="h-4 w-4" aria-hidden />
          </button>
          <Link
            to="/voice-log"
            aria-label={hi ? "à¤µà¥‰à¤‡à¤¸ à¤‡à¤¤à¤¿à¤¹à¤¾à¤¸" : "Voice history"}
            className="press rounded-full border border-border p-2 text-muted-foreground"
          >
            <History className="h-4 w-4" aria-hidden />
          </Link>
          {state.chat.length ? (
            <button
              onClick={() => {
                clearChat();
                toast.success(hi ? "à¤šà¥ˆà¤Ÿ à¤¸à¤¾à¤«à¤¼ à¤¹à¥‹ à¤—à¤ˆà¥¤" : "Chat cleared.");
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
      <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-background to-gold/10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Personal coaching</p>
            <h2 className="mt-1 font-display text-xl font-semibold">Your next step, made personal</h2>
          </div>
          <button
            onClick={() => void toggleVoiceMode()}
            aria-pressed={voiceMode}
            className={`press grid h-12 w-12 place-items-center rounded-full border ${
              voiceMode ? "border-primary bg-primary text-primary-foreground" : "border-border bg-elevated text-foreground"
            }`}
            aria-label={voiceMode ? (hi ? "à¤•à¥‹à¤š à¤¬à¤‚à¤¦ à¤•à¤°à¥‡à¤‚" : "Stop coach") : hi ? "à¤•à¥‹à¤š à¤¶à¥à¤°à¥‚ à¤•à¤°à¥‡à¤‚" : "Start coach"}
          >
            {voiceMode ? <Volume2 className="h-5 w-5" aria-hidden /> : <Mic className="h-5 w-5" aria-hidden />}
          </button>
        </div>

        <div className="mt-5 flex flex-col items-center justify-center text-center">
          <button
            onClick={() => (status === "listening" ? recRef.current?.stop?.() : void startVoice())}
            className={`press grid h-28 w-28 place-items-center rounded-full border shadow-[0_0_30px_rgba(122,92,255,0.25)] transition-all ${
              status === "listening"
                ? "border-primary bg-primary text-primary-foreground scale-105"
                : status === "speaking"
                  ? "border-gold bg-gold/20 text-gold scale-105"
                  : "border-border bg-elevated text-foreground"
            }`}
            aria-label={hi ? "à¤®à¤¾à¤‡à¤• à¤¸à¥‡ à¤¬à¤¾à¤¤ à¤•à¤°à¥‡à¤‚" : "Talk with microphone"}
          >
            {status === "speaking" ? <Volume2 className="h-10 w-10" aria-hidden /> : <Mic className="h-10 w-10" aria-hidden />}
          </button>

          <p className="mt-4 text-sm font-medium text-muted-foreground">
            {voiceMode
              ? statusLabel[status]
              : hi
                ? "à¤®à¤¾à¤‡à¤• à¤¦à¤¬à¤¾à¤•à¤° à¤…à¤ªà¤¨à¥€ à¤¬à¤¾à¤¤ à¤¶à¥à¤°à¥‚ à¤•à¤°à¥‡à¤‚à¥¤ à¤•à¥‹à¤š à¤¤à¥à¤°à¤‚à¤¤ à¤œà¤µà¤¾à¤¬ à¤¦à¥‡à¤—à¤¾à¥¤"
                : "Tap the mic, speak, review your transcript, then get a personal reply."}
          </p>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-200"
              style={{ width: `${status === "listening" ? Math.max(10, level * 100) : status === "speaking" ? 100 : 12}%` }}
            />
          </div>
        </div>
      </Card>

      {micPermission === "denied" ? (
        <Card className="space-y-1">
          <p className="text-sm font-semibold">{hi ? "à¤®à¤¾à¤‡à¤•à¥à¤°à¥‹à¤«à¤¼à¥‹à¤¨ à¤¬à¤‚à¤¦ à¤¹à¥ˆ" : "Microphone is blocked"}</p>
          <p className="text-xs text-muted-foreground">
            {hi
              ? "à¤†à¤µà¤¾à¤œà¤¼ à¤¸à¥‡ à¤¬à¤¾à¤¤ à¤•à¤°à¤¨à¥‡ à¤•à¥‡ à¤²à¤¿à¤ à¤®à¤¾à¤‡à¤• à¤•à¥€ à¤…à¤¨à¥à¤®à¤¤à¤¿ à¤œà¤¼à¤°à¥‚à¤°à¥€ à¤¹à¥ˆà¥¤"
              : "Voice chat needs microphone access to work in audio-to-audio mode."}
          </p>
        </Card>
      ) : null}

      {showSettings ? (
        <Card className="space-y-4">
          <p className="flex items-center gap-2 font-display text-sm font-semibold">
            <Settings2 className="h-4 w-4 text-primary" aria-hidden /> {hi ? "à¤µà¥‰à¤‡à¤¸ à¤®à¥‹à¤¡ à¤¸à¥‡à¤Ÿà¤¿à¤‚à¤—" : "Voice mode settings"}
          </p>

          <label className="block space-y-1.5">
            <span className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{hi ? "à¤¸à¥à¤¨à¤¨à¥‡ à¤•à¥€ à¤¸à¤‚à¤µà¥‡à¤¦à¤¨à¤¶à¥€à¤²à¤¤à¤¾" : "Listening sensitivity"}</span>
              <span className="font-semibold text-primary">{voice.sensitivity}/10</span>
            </span>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={voice.sensitivity}
              onChange={(e) => setVoiceSettings({ sensitivity: Number(e.target.value) })}
              className="w-full accent-[var(--primary)]"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{hi ? "à¤¬à¥‹à¤²à¤¨à¥‡ à¤•à¥€ à¤—à¤¤à¤¿" : "Speaking speed"}</span>
              <span className="font-semibold text-primary">{voice.speed.toFixed(2)}Ã—</span>
            </span>
            <input
              type="range"
              min={0.7}
              max={1.4}
              step={0.05}
              value={voice.speed}
              onChange={(e) => setVoiceSettings({ speed: Number(e.target.value) })}
              className="w-full accent-[var(--primary)]"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{hi ? "à¤¸à¤¾à¤‡à¤²à¥‡à¤‚à¤¸ à¤¬à¤¾à¤¦ à¤°à¥à¤•à¤¨à¤¾" : "Auto-stop after silence"}</span>
              <span className="font-semibold text-primary">{voice.autoStopSeconds ? `${voice.autoStopSeconds}s` : hi ? "à¤•à¤­à¥€ à¤¨à¤¹à¥€à¤‚" : "Never"}</span>
            </span>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={voice.autoStopSeconds}
              onChange={(e) => setVoiceSettings({ autoStopSeconds: Number(e.target.value) })}
              className="w-full accent-[var(--primary)]"
            />
          </label>
        </Card>
      ) : null}

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-display text-sm font-semibold">{hi ? "à¤¹à¤¾à¤² à¤•à¥€ à¤¬à¤¾à¤¤à¤šà¥€à¤¤" : "Recent conversation"}</p>
          {state.chat.length > 0 ? (
            <button
              onClick={() => clearChat()}
              className="text-xs font-medium text-muted-foreground"
            >
              {hi ? "à¤¸à¤¾à¤«à¤¼ à¤•à¤°à¥‡à¤‚" : "Clear"}
            </button>
          ) : null}
        </div>

        {state.chat.length === 0 ? (
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
        ) : (
          <div className="space-y-2">
            {state.chat.slice(-4).map((m) => (
              <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
                <div
                  className={`inline-block max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user" ? "bg-primary/20 text-foreground" : "border border-border bg-elevated"
                  }`}
                >
                  {m.content}
                  {m.role === "assistant" ? (
                    <button
                      onClick={() => void speak(m.content)}
                      className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary"
                    >
                      <Volume2 className="h-3.5 w-3.5" aria-hidden /> {hi ? "à¤¸à¥à¤¨à¥‡à¤‚" : "Listen"}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="mr-auto flex max-w-[60%] gap-1 px-2 py-2">
            {[0, 150, 300].map((d) => (
              <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
        ) : null}
      </Card>

      <div className="fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-30 mx-auto max-w-md px-4">
        <div className="surface flex items-center gap-2 p-2">
          <button
            onClick={() => (status === "listening" ? recRef.current?.stop?.() : void startVoice())}
            aria-label={hi ? "à¤®à¤¾à¤‡à¤• à¤¸à¥‡ à¤¬à¤¾à¤¤ à¤•à¤°à¥‡à¤‚" : "Talk with microphone"}
            className={`press grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${
              status === "listening" ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"
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
            placeholder={hi ? "à¤¯à¤¾ à¤Ÿà¤¾à¤‡à¤ª à¤•à¤°à¤•à¥‡ à¤ªà¥‚à¤›à¥‡à¤‚â€¦" : "Or type if you preferâ€¦"}
            className="min-w-0 flex-1 bg-transparent px-1 py-2 text-base outline-none"
          />
          <button
            onClick={() => void send(input)}
            disabled={loading}
            className="press grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
            aria-label="Send"
          >
            <Send className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="h-16" />
      <Disclaimer text={hi ? t(lang, "disclaimer") : DISCLAIMER} />
    </AppShell>
  );
}
