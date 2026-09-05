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
      { title: "LIFE AI COACH — Voice Life Coach | LIFE UPGRADE" },
      {
        name: "description",
        content:
          "Talk out loud with your personal AI life coach in Hindi, Hinglish or English — voice in, voice out, background-friendly, with saved transcripts.",
      },
      { property: "og:title", content: "LIFE AI COACH — Premium voice coaching" },
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
          ? "माइक की अनुमति नहीं मिली। ब्राउज़र सेटिंग में माइक्रोफ़ोन चालू करें।"
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
        const threshold = (11 - voice.sensitivity) / 100; // higher sensitivity → lower threshold
        const tick = () => {
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (const v of buf) sum += (v - 128) * (v - 128);
          const rms = Math.sqrt(sum / buf.length) / 128;
          setLevel(Math.min(1, rms * 6));
          if (rms > threshold) armAutoStop(); // still talking → push the auto-stop timer out
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
      /* not supported — audio still continues */
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
            title: hi ? "LIFE AI कोच" : "LIFE AI COACH",
            artist: hi ? "आपका लाइफ कोच" : "Your life coach",
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
        toast.error(hi ? "आवाज़ अभी उपलब्ध नहीं है।" : "Voice is unavailable right now.");
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
      pushChat({ role: "assistant", content: res.reply });
      recordTurn({ role: "assistant", content: res.reply, at: Date.now() });
      if (voiceModeRef.current) void speak(res.reply);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Coach is unavailable right now.");
      pushChat({
        role: "assistant",
        content: hi
          ? "अभी मैं जवाब नहीं ला पाया। तब तक: 10 गहरी सांसें, 300ml पानी और 10 मिनट की वॉक। थोड़ी देर में फिर कोशिश करें।"
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
        toast.error(hi ? "इस ब्राउज़र में वॉइस इनपुट नहीं है।" : "Voice input isn't supported in this browser.");
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
          "Keeps talking when you switch apps, with lock-screen controls",
          "Voice mode controls: sensitivity, speed, auto-stop",
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
    idle: hi ? "तैयार" : "Ready",
    listening: hi ? "सुन रहा हूँ…" : "Listening…",
    thinking: hi ? "सोच रहा हूँ…" : "Thinking…",
    speaking: hi ? "बोल रहा हूँ…" : "Speaking…",
    background: hi ? "बैकग्राउंड में रुका — वापस आते ही चालू" : "Paused in background — resumes on return",
  };

  return (
    <AppShell
      title="LIFE AI COACH"
      subtitle={`${t(lang, "coach.voice")}: ${voiceMode ? (hi ? "चालू" : "on") : hi ? "बंद" : "off"}`}
      action={
        <div className="mt-1 flex gap-1.5">
          <button
            onClick={() => setShowSettings((v) => !v)}
            aria-pressed={showSettings}
            aria-label={hi ? "वॉइस सेटिंग" : "Voice settings"}
            className={`press rounded-full border p-2 ${
              showSettings ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            <Settings2 className="h-4 w-4" aria-hidden />
          </button>
          <Link
            to="/voice-log"
            aria-label={hi ? "वॉइस इतिहास" : "Voice history"}
            className="press rounded-full border border-border p-2 text-muted-foreground"
          >
            <History className="h-4 w-4" aria-hidden />
          </Link>
          <button
            onClick={() => void toggleVoiceMode()}
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
                toast.success(hi ? "चैट साफ़ हो गई।" : "Chat cleared.");
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
      {/* live status indicator */}
      <div
        role="status"
        aria-live="polite"
        className="surface flex items-center gap-3 px-3 py-2.5"
      >
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
            status === "listening"
              ? "bg-primary/20 text-primary"
              : status === "speaking"
                ? "bg-gold/20 text-gold"
                : status === "background"
                  ? "bg-muted text-muted-foreground"
                  : "bg-elevated text-muted-foreground"
          }`}
        >
          {status === "background" ? (
            <MicOff className="h-4 w-4" aria-hidden />
          ) : status === "speaking" ? (
            <Volume2 className="h-4 w-4" aria-hidden />
          ) : (
            <Mic className="h-4 w-4" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{statusLabel[status]}</p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-100"
              style={{ width: `${status === "listening" ? Math.max(4, level * 100) : status === "speaking" ? 100 : 4}%` }}
            />
          </div>
        </div>
        {status === "speaking" ? (
          <button
            onClick={stopAudio}
            aria-label={hi ? "रोकें" : "Stop"}
            className="press rounded-full border border-border p-2 text-muted-foreground"
          >
            <Square className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : null}
      </div>

      {micPermission === "denied" ? (
        <Card className="space-y-1">
          <p className="text-sm font-semibold">{hi ? "माइक्रोफ़ोन बंद है" : "Microphone is blocked"}</p>
          <p className="text-xs text-muted-foreground">
            {hi
              ? "वॉइस बातचीत के लिए माइक की अनुमति ज़रूरी है। हम कभी बैकग्राउंड में चुपचाप रिकॉर्ड नहीं करते — माइक सिर्फ़ तब चलता है जब आप वॉइस मोड चालू करते हैं।"
              : "Voice chat needs microphone access. We never record silently in the background — the mic only runs while you have voice mode on."}
          </p>
        </Card>
      ) : null}

      {showSettings ? (
        <Card className="space-y-4">
          <p className="flex items-center gap-2 font-display text-sm font-semibold">
            <Settings2 className="h-4 w-4 text-primary" aria-hidden />{" "}
            {hi ? "वॉइस मोड सेटिंग" : "Voice mode settings"}
          </p>

          <label className="block space-y-1.5">
            <span className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {hi ? "सुनने की संवेदनशीलता" : "Listening sensitivity"}
              </span>
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
            <span className="block text-[11px] text-muted-foreground">
              {hi
                ? "ऊँचा = धीमी आवाज़ भी पकड़ेगा (शोर वाली जगह पर कम रखें)।"
                : "Higher picks up quieter speech; lower it in noisy places."}
            </span>
          </label>

          <label className="block space-y-1.5">
            <span className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{hi ? "कोच की बोलने की गति" : "Coach speaking speed"}</span>
              <span className="font-semibold text-primary">{voice.speed.toFixed(2)}×</span>
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
              <span className="text-muted-foreground">{hi ? "चुप्पी के बाद रुकना" : "Auto-stop after silence"}</span>
              <span className="font-semibold text-primary">
                {voice.autoStopSeconds ? `${voice.autoStopSeconds}s` : hi ? "कभी नहीं" : "Never"}
              </span>
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

          {[
            {
              key: "backgroundMode" as const,
              label: hi ? "बैकग्राउंड में चालू रखें" : "Keep going in the background",
              hint: hi
                ? "दूसरी ऐप खोलने पर जवाब बजता रहेगा और लॉक स्क्रीन से कंट्रोल मिलेगा; वापस आते ही सुनना फिर शुरू।"
                : "Replies keep playing with lock-screen controls when you switch apps, and listening resumes when you come back.",
              value: voice.backgroundMode,
            },
            {
              key: "autoSaveSessions" as const,
              label: hi ? "बातचीत इतिहास में सेव करें" : "Save conversations to history",
              hint: hi ? "ट्रांसक्रिप्ट बाद में पढ़, बदल और दोबारा भेज सकते हैं।" : "Transcripts you can read, edit and reuse later.",
              value: voice.autoSaveSessions,
            },
          ].map((row) => (
            <button
              key={row.key}
              onClick={() => setVoiceSettings({ [row.key]: !row.value })}
              aria-pressed={row.value}
              className="press flex w-full items-start gap-3 rounded-xl bg-elevated p-3 text-left"
            >
              <span
                className={`mt-0.5 h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors ${
                  row.value ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`block h-4 w-4 rounded-full bg-card transition-transform ${row.value ? "translate-x-4" : ""}`}
                />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{row.label}</span>
                <span className="block text-[11px] text-muted-foreground">{row.hint}</span>
              </span>
            </button>
          ))}
        </Card>
      ) : null}

      {state.chat.length === 0 && (
        <Card className="space-y-3">
          <p className="flex items-center gap-2 font-display text-sm font-semibold">
            <Map className="h-4 w-4 text-gold" aria-hidden /> {hi ? "यहाँ से शुरू करें" : "Start here"}
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
                  <Volume2 className="h-3.5 w-3.5" aria-hidden /> {hi ? "सुनें" : "Listen"}
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

      <div className="fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-30 mx-auto max-w-md px-4">
        <div className="surface flex items-center gap-2 p-2">
          <button
            onClick={() => (status === "listening" ? recRef.current?.stop?.() : void startVoice())}
            aria-label="Voice input"
            className={`press grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${
              status === "listening"
                ? "border-primary bg-primary/20 text-primary"
                : "border-border text-muted-foreground"
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
      <Disclaimer text={hi ? t(lang, "disclaimer") : DISCLAIMER} />
    </AppShell>
  );
}
