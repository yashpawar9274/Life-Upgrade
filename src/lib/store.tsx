import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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
  chat: ChatMessage[];
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

const STORAGE_KEY = "life-upgrade-state-v1";

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

function seedState(): AppState {
  const routines: RoutineItem[] = [
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

  const habits: Habit[] = [
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

  const limits: Limit[] = [
    {
      id: "l1",
      name: "Cigarettes",
      unit: "cigarettes",
      dailyLimit: 4,
      goal: "Step down by 1 every 10 days",
    },
    { id: "l2", name: "Alcohol", unit: "drinks", dailyLimit: 1, goal: "Only weekends, max 2" },
    { id: "l3", name: "Junk food", unit: "meals", dailyLimit: 1, goal: "Max 3 per week" },
    { id: "l4", name: "Doom scrolling", unit: "minutes", dailyLimit: 45, goal: "Under 30 min/day" },
  ];

  const routineLog: Record<string, string[]> = {};
  const habitLog: Record<string, string[]> = {};
  const limitLog: Record<string, Record<string, number>> = {};
  const moodLog: Record<string, Mood> = {};
  const focusLog: Record<string, number> = {};
  const moods: Mood[] = ["motivated", "focused", "stressed", "happy", "low-energy", "focused"];

  dayKeysBack(21).forEach((key, i) => {
    const strength = 0.45 + ((i % 7) / 7) * 0.4 + (i > 13 ? 0.12 : 0);
    routineLog[key] = routines.filter(() => Math.random() < strength).map((r) => r.id);
    habitLog[key] = habits.filter(() => Math.random() < strength).map((h) => h.id);
    limitLog[key] = {
      l1: Math.max(0, Math.round(6 - i * 0.15 - Math.random())),
      l2: Math.random() < 0.25 ? 2 : 0,
      l3: Math.random() < 0.3 ? 1 : 0,
      l4: 20 + Math.round(Math.random() * 50),
    };
    moodLog[key] = moods[i % moods.length];
    focusLog[key] = [0, 25, 50, 75, 90, 50, 25][i % 7];
  });

  const today = todayKey();
  routineLog[today] = ["r1", "r2", "r3"];
  habitLog[today] = ["h1", "h2", "h4"];
  limitLog[today] = { l1: 1, l2: 0, l3: 0, l4: 12 };
  focusLog[today] = 25;

  return {
    profile: {
      name: "Aarav",
      plan: "free",
      onboarded: false,
      goals: ["Wake up early", "Exercise daily", "Deep focus", "Reduce smoking", "Better sleep"],
      wakeTime: "06:00",
      sleepTime: "22:45",
      workStart: "10:00",
      workEnd: "19:00",
      fitnessLevel: "beginner",
      language: "hinglish",
      remindersEnabled: true,
      locationReminders: false,
    },
    routines,
    habits,
    limits,
    routineLog,
    habitLog,
    limitLog,
    moodLog,
    focusLog,
    chat: [],
    seenSplash: false,
  };
}

type Store = {
  state: AppState;
  hydrated: boolean;
  update: (fn: (s: AppState) => AppState) => void;
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
  pushChat: (m: Omit<ChatMessage, "id" | "at">) => void;
  clearChat: () => void;
  resetAll: () => void;
  wipeData: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => seedState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...seedState(), ...(JSON.parse(raw) as AppState) });
    } catch {
      /* corrupted storage — keep sample data */
    }
    setHydrated(true);
  }, []);

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
      pushChat: (m) =>
        update((s) => ({ ...s, chat: [...s.chat, { ...m, id: uid(), at: Date.now() }] })),
      clearChat: () => update((s) => ({ ...s, chat: [] })),
      resetAll: () => setState(seedState()),
      wipeData: () =>
        setState({
          ...seedState(),
          routines: [],
          habits: [],
          limits: [],
          routineLog: {},
          habitLog: {},
          limitLog: {},
          moodLog: {},
          focusLog: {},
          chat: [],
          seenSplash: true,
          profile: { ...seedState().profile, name: "", goals: [], onboarded: true, plan: "free" },
        }),
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

export function streak(s: AppState): number {
  let count = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = todayKey(d);
    if (dayScore(s, key) >= 50) count++;
    else if (i === 0) continue;
    else break;
  }
  return count;
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

export function motivationOfDay(): string {
  const day = Math.floor(Date.now() / 86400000);
  return MOTIVATIONS[day % MOTIVATIONS.length];
}
