import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { MOTIVATIONS_HI } from "./i18n";

export type Block = "morning" | "afternoon" | "evening" | "night";
export type Mood = "happy" | "motivated" | "focused" | "stressed" | "low-energy" | "anxious";
export type Plan = "free" | "premium";

export type RoutineItem = {
  id: string;
  block: Block;
  title: string;
  time: string;
  note?: string;
};

export type Habit = {
  id: string;
  title: string;
  icon: string;
  unit?: string;
  target?: number;
};

export type Limit = {
  id: string;
  name: string;
  unit: string;
  dailyLimit: number;
  goal: string;
};

export type ChatMessage = { id: string; role: "user" | "assistant"; content: string; at: number };

/** Premium voice-mode controls. */
export type VoiceSettings = {
  /** 1 (only clear speech) … 10 (picks up quiet speech). */
  sensitivity: number;
  /** Playback rate for the coach's voice, 0.7 – 1.4. */
  speed: number;
  /** Stop listening after this many silent seconds. 0 = never auto-stop. */
  autoStopSeconds: number;
  /** Keep the conversation alive (audio + lock-screen controls) when the app is in the background. */
  backgroundMode: boolean;
  /** Automatically save every voice conversation to history. */
  autoSaveSessions: boolean;
};

export type VoiceTurn = { role: "user" | "assistant"; content: string; at: number };

export type VoiceSession = {
  id: string;
  title: string;
  startedAt: number;
  endedAt: number;
  language: Profile["language"];
  turns: VoiceTurn[];
  notes?: string;
};


export type Profile = {
  name: string;
  plan: Plan;
  onboarded: boolean;
  goals: string[];
  wakeTime: string;
  sleepTime: string;
  workStart: string;
  workEnd: string;
  fitnessLevel: "beginner" | "intermediate" | "advanced";
  language: "english" | "hinglish" | "hindi";
  remindersEnabled: boolean;
  locationReminders: boolean;
};

export type AppState = {
  profile: Profile;
  routines: RoutineItem[];
  habits: Habit[];
  limits: Limit[];
  /** date -> completed routine ids */
  routineLog: Record<string, string[]>;
  /** date -> completed habit ids */
  habitLog: Record<string, string[]>;
  /** date -> { limitId: count } */
  limitLog: Record<string, Record<string, number>>;
  /** date -> mood */
  moodLog: Record<string, Mood>;
  /** date -> focus minutes */
  focusLog: Record<string, number>;
  /** roadmap step key -> done */
  roadmap: Record<string, boolean>;
  chat: ChatMessage[];
  voice: VoiceSettings;
  voiceSessions: VoiceSession[];
  seenSplash: boolean;

};

export const GOAL_OPTIONS = [
  "Wake up early",
  "Exercise daily",
  "Weight loss",
  "Meditation",
  "Deep focus",
  "Better sleep",
  "Productivity",
  "Reduce smoking",
  "Reduce drinking",
  "Stop wasting time",
  "Confidence",
  "Better money habits",
  "Healthier relationships",
  "Healthy boundaries from bad environment",
];

export const MOODS: { key: Mood; label: string; emoji: string }[] = [
  { key: "happy", label: "Happy", emoji: "😊" },
  { key: "motivated", label: "Motivated", emoji: "🔥" },
  { key: "focused", label: "Focused", emoji: "🎯" },
  { key: "stressed", label: "Stressed", emoji: "😮‍💨" },
  { key: "low-energy", label: "Low energy", emoji: "🥱" },
  { key: "anxious", label: "Anxious", emoji: "😟" },
];

export const MOTIVATIONS = [
  "Discipline is choosing what you want most over what you want now.",
  "You don't need a perfect day. You need an honest one.",
  "Small clean choices, repeated, become a luxury life.",
  "Your future self is watching today's decisions with respect.",
  "Relapse is data, not identity. Reset and continue.",
  "Calm body, clear mind, strong routine. In that order.",
  "One walk, one glass of water, one early night. That's progress.",
];

export const DISCLAIMER =
  "This app supports personal wellbeing and is not a substitute for medical or mental-health care.";

/** v2 — every account now starts completely fresh (no sample data). */
const STORAGE_KEY = "life-upgrade-state-v2";

export function todayKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function dayKeysBack(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(todayKey(d));
  }
  return out;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const DEFAULT_ROUTINES: RoutineItem[] = [
  { id: "r1", block: "morning", title: "Wake up + 500ml water", time: "06:00" },
  { id: "r2", block: "morning", title: "10 min meditation", time: "06:20" },
  { id: "r3", block: "morning", title: "Walk / run 25 min", time: "06:40" },
  { id: "r4", block: "morning", title: "Protein breakfast", time: "08:00" },
  { id: "r5", block: "afternoon", title: "Deep work block (90 min)", time: "11:00" },
  { id: "r6", block: "afternoon", title: "Balanced lunch, no sugar drink", time: "13:30" },
  { id: "r7", block: "afternoon", title: "10 min sunlight break", time: "16:00" },
  { id: "r8", block: "evening", title: "Strength workout", time: "18:30" },
  { id: "r9", block: "evening", title: "Read 15 pages", time: "20:30" },
  { id: "r10", block: "night", title: "No spending review + plan tomorrow", time: "21:30" },
  { id: "r11", block: "night", title: "Screens off, lights low", time: "22:15" },
  { id: "r12", block: "night", title: "Sleep by 22:45", time: "22:45" },
];

const DEFAULT_HABITS: Habit[] = [
  { id: "h1", title: "Water 3L", icon: "droplet" },
  { id: "h2", title: "Walk / run", icon: "footprints" },
  { id: "h3", title: "Workout", icon: "dumbbell" },
  { id: "h4", title: "Meditation", icon: "brain" },
  { id: "h5", title: "Reading", icon: "book" },
  { id: "h6", title: "Sleep on time", icon: "moon" },
  { id: "h7", title: "Work focus block", icon: "target" },
  { id: "h8", title: "Healthy food", icon: "salad" },
  { id: "h9", title: "No unnecessary spending", icon: "wallet" },
];

const DEFAULT_LIMITS: Limit[] = [
  { id: "l1", name: "Cigarettes", unit: "cigarettes", dailyLimit: 4, goal: "Step down by 1 every 10 days" },
  { id: "l2", name: "Alcohol", unit: "drinks", dailyLimit: 1, goal: "Only weekends, max 2" },
  { id: "l3", name: "Junk food", unit: "meals", dailyLimit: 1, goal: "Max 3 per week" },
  { id: "l4", name: "Doom scrolling", unit: "minutes", dailyLimit: 45, goal: "Under 30 min/day" },
];

export const DEFAULT_VOICE: VoiceSettings = {
  sensitivity: 6,
  speed: 1,
  autoStopSeconds: 8,
  backgroundMode: true,
  autoSaveSessions: true,
};

/** A brand-new account: starter templates, zero history. */

export function freshState(): AppState {
  return {
    profile: {
      name: "",
      plan: "free",
      onboarded: false,
      goals: [],
      wakeTime: "06:00",
      sleepTime: "22:45",
      workStart: "10:00",
      workEnd: "19:00",
      fitnessLevel: "beginner",
      language: "english",
      remindersEnabled: true,
      locationReminders: false,
    },
    routines: DEFAULT_ROUTINES.map((r) => ({ ...r })),
    habits: DEFAULT_HABITS.map((h) => ({ ...h })),
    limits: DEFAULT_LIMITS.map((l) => ({ ...l })),
    routineLog: {},
    habitLog: {},
    limitLog: {},
    moodLog: {},
    focusLog: {},
    roadmap: {},
    chat: [],
    voice: { ...DEFAULT_VOICE },
    voiceSessions: [],
    seenSplash: false,

  };
}

type Store = {
  state: AppState;
  hydrated: boolean;
  update: (fn: (s: AppState) => AppState) => void;
  merge: (patch: Partial<AppState>) => void;
  setProfile: (patch: Partial<Profile>) => void;
  toggleRoutine: (id: string) => void;
  toggleHabit: (id: string) => void;
  addRoutine: (item: Omit<RoutineItem, "id">) => void;
  updateRoutine: (id: string, patch: Partial<RoutineItem>) => void;
  removeRoutine: (id: string) => void;
  addHabit: (item: Omit<Habit, "id">) => void;
  removeHabit: (id: string) => void;
  addLimit: (item: Omit<Limit, "id">) => void;
  updateLimit: (id: string, patch: Partial<Limit>) => void;
  removeLimit: (id: string) => void;
  logLimit: (id: string, delta: number) => void;
  setMood: (mood: Mood) => void;
  addFocusMinutes: (min: number) => void;
  toggleRoadmapStep: (key: string) => void;
  pushChat: (m: Omit<ChatMessage, "id" | "at">) => void;
  clearChat: () => void;
  setVoiceSettings: (patch: Partial<VoiceSettings>) => void;
  saveVoiceSession: (session: VoiceSession) => void;
  updateVoiceSession: (id: string, patch: Partial<VoiceSession>) => void;
  removeVoiceSession: (id: string) => void;

  resetAll: () => void;
  wipeData: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => freshState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<AppState>;
        setState({
          ...freshState(),
          ...saved,
          voice: { ...DEFAULT_VOICE, ...(saved.voice ?? {}) },
          voiceSessions: saved.voiceSessions ?? [],
        });
      }

      // Drop the old sample-data era store so everybody starts fresh.
      localStorage.removeItem("life-upgrade-state-v1");
    } catch {
      /* corrupted storage — keep the fresh state */
    }
    setHydrated(true);
  }, []);

  // Autosave locally on every change.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable */
    }
  }, [state, hydrated]);

  const update = useCallback((fn: (s: AppState) => AppState) => setState((s) => fn(s)), []);

  const api = useMemo<Store>(() => {
    const today = () => todayKey();
    return {
      state,
      hydrated,
      update,
      merge: (patch) => update((s) => ({ ...s, ...patch })),
      setProfile: (patch) => update((s) => ({ ...s, profile: { ...s.profile, ...patch } })),
      toggleRoutine: (id) =>
        update((s) => {
          const cur = s.routineLog[today()] ?? [];
          const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
          return { ...s, routineLog: { ...s.routineLog, [today()]: next } };
        }),
      toggleHabit: (id) =>
        update((s) => {
          const cur = s.habitLog[today()] ?? [];
          const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
          return { ...s, habitLog: { ...s.habitLog, [today()]: next } };
        }),
      addRoutine: (item) => update((s) => ({ ...s, routines: [...s.routines, { ...item, id: uid() }] })),
      updateRoutine: (id, patch) =>
        update((s) => ({
          ...s,
          routines: s.routines.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),
      removeRoutine: (id) =>
        update((s) => ({ ...s, routines: s.routines.filter((r) => r.id !== id) })),
      addHabit: (item) => update((s) => ({ ...s, habits: [...s.habits, { ...item, id: uid() }] })),
      removeHabit: (id) => update((s) => ({ ...s, habits: s.habits.filter((h) => h.id !== id) })),
      addLimit: (item) => update((s) => ({ ...s, limits: [...s.limits, { ...item, id: uid() }] })),
      updateLimit: (id, patch) =>
        update((s) => ({ ...s, limits: s.limits.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
      removeLimit: (id) => update((s) => ({ ...s, limits: s.limits.filter((l) => l.id !== id) })),
      logLimit: (id, delta) =>
        update((s) => {
          const day = { ...(s.limitLog[today()] ?? {}) };
          day[id] = Math.max(0, (day[id] ?? 0) + delta);
          return { ...s, limitLog: { ...s.limitLog, [today()]: day } };
        }),
      setMood: (mood) => update((s) => ({ ...s, moodLog: { ...s.moodLog, [today()]: mood } })),
      addFocusMinutes: (min) =>
        update((s) => ({
          ...s,
          focusLog: { ...s.focusLog, [today()]: (s.focusLog[today()] ?? 0) + min },
        })),
      toggleRoadmapStep: (key) =>
        update((s) => ({ ...s, roadmap: { ...s.roadmap, [key]: !s.roadmap[key] } })),
      pushChat: (m) =>
        update((s) => ({ ...s, chat: [...s.chat, { ...m, id: uid(), at: Date.now() }] })),
      clearChat: () => update((s) => ({ ...s, chat: [] })),
      setVoiceSettings: (patch) =>
        update((s) => ({ ...s, voice: { ...DEFAULT_VOICE, ...s.voice, ...patch } })),
      saveVoiceSession: (session) =>
        update((s) => ({
          ...s,
          voiceSessions: [session, ...s.voiceSessions.filter((v) => v.id !== session.id)].slice(0, 60),
        })),
      updateVoiceSession: (id, patch) =>
        update((s) => ({
          ...s,
          voiceSessions: s.voiceSessions.map((v) => (v.id === id ? { ...v, ...patch } : v)),
        })),
      removeVoiceSession: (id) =>
        update((s) => ({ ...s, voiceSessions: s.voiceSessions.filter((v) => v.id !== id) })),

      resetAll: () =>
        setState((s) => ({
          ...freshState(),
          profile: { ...freshState().profile, plan: s.profile.plan },
          seenSplash: true,
        })),
      wipeData: () =>
        setState((s) => ({
          ...freshState(),
          routines: [],
          habits: [],
          limits: [],
          seenSplash: true,
          profile: { ...freshState().profile, onboarded: true, plan: s.profile.plan },
        })),
    };
  }, [state, hydrated, update]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

/* ---------- derived helpers ---------- */

export function dayScore(s: AppState, key = todayKey()): number {
  const totals = s.routines.length + s.habits.length;
  if (!totals) return 0;
  const done = (s.routineLog[key]?.length ?? 0) + (s.habitLog[key]?.length ?? 0);
  return Math.min(100, Math.round((done / totals) * 100));
}

/** A day counts towards the streak when the user actually showed up:
 *  any routine/habit step done, a mood check-in, or focus minutes logged. */
export function dayKept(s: AppState, key = todayKey()): boolean {
  const done = (s.routineLog[key]?.length ?? 0) + (s.habitLog[key]?.length ?? 0);
  const totals = s.routines.length + s.habits.length;
  const enough = totals ? done >= Math.min(2, totals) : done > 0;
  return enough || !!s.moodLog?.[key] || (s.focusLog?.[key] ?? 0) > 0;
}

export function streak(s: AppState): number {
  let count = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = todayKey(d);
    if (dayKept(s, key)) count++;
    else if (i === 0) continue;
    else break;
  }
  return count;
}

/** AI-decided daily cap: no manual input. Starts from the user's own 7-day
 *  average and steps down gradually, never below a safe floor. */
export function aiLimitPlan(s: AppState, limit: Limit): { cap: number; reason: string } {
  const keys = dayKeysBack(14);
  const counts = keys.map((k) => s.limitLog[k]?.[limit.id] ?? 0);
  const logged = counts.filter((c) => c > 0);
  const avg = logged.length ? logged.reduce((a, b) => a + b, 0) / logged.length : limit.dailyLimit;
  const recent = counts.slice(-7);
  const recentAvg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : avg;
  const floor = limit.unit === "minutes" ? 15 : 0;
  const base = Math.max(avg, recentAvg);
  let cap = Math.max(floor, Math.round(base * 0.85));
  if (!logged.length) cap = limit.dailyLimit;
  if (recentAvg <= cap * 0.6) cap = Math.max(floor, Math.round(cap * 0.85));
  const reason = !logged.length
    ? "Starting cap set by your coach — log a few days and it adapts."
    : recentAvg <= cap
      ? "You are under your cap, so the coach lowered it one gentle step."
      : "Cap kept close to your current average — small reduction, no pressure.";
  return { cap, reason };
}


export type Level = { name: string; index: number; next?: string; min: number; max: number };

export function levelFor(streakDays: number): Level {
  if (streakDays >= 21) return { name: "Elite Routine", index: 3, min: 21, max: 40 };
  if (streakDays >= 10) return { name: "Growth", index: 2, next: "Elite Routine", min: 10, max: 21 };
  if (streakDays >= 4) return { name: "Discipline", index: 1, next: "Growth", min: 4, max: 10 };
  return { name: "Reset", index: 0, next: "Discipline", min: 0, max: 4 };
}

export function weeklyStats(s: AppState) {
  const keys = dayKeysBack(7);
  const scores = keys.map((k) => dayScore(s, k));
  const completed = keys.reduce(
    (n, k) => n + (s.routineLog[k]?.length ?? 0) + (s.habitLog[k]?.length ?? 0),
    0,
  );
  const possible = keys.length * (s.routines.length + s.habits.length);
  const habitRows = s.habits.map((h) => ({
    habit: h,
    hits: keys.filter((k) => s.habitLog[k]?.includes(h.id)).length,
  }));
  const focus = keys.reduce((n, k) => n + (s.focusLog[k] ?? 0), 0);
  return {
    keys,
    scores,
    completed,
    missed: Math.max(0, possible - completed),
    avg: Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1)),
    best: habitRows.slice().sort((a, b) => b.hits - a.hits)[0],
    worst: habitRows.slice().sort((a, b) => a.hits - b.hits)[0],
    habitRows,
    focus,
  };
}

export function motivationOfDay(lang: Profile["language"] = "english"): string {
  const day = Math.floor(Date.now() / 86400000);
  const list = lang === "hindi" ? MOTIVATIONS_HI : MOTIVATIONS;
  return list[day % list.length] ?? list[0]!;
}
