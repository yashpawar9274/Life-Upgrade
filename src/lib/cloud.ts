import { supabase } from "@/integrations/supabase/client";
import type { AppState, Habit, Limit, Mood, Profile, RoutineItem } from "@/lib/store";

export type CloudSnapshot = Partial<
  Pick<
    AppState,
    | "profile"
    | "routines"
    | "habits"
    | "limits"
    | "roadmap"
    | "routineLog"
    | "habitLog"
    | "limitLog"
    | "moodLog"
    | "focusLog"
  >
>;

/** Load everything the signed-in user has stored in the backend. */
export async function loadCloudState(userId: string): Promise<CloudSnapshot | null> {
  const [{ data: config }, { data: logs }] = await Promise.all([
    supabase
      .from("user_config")
      .select("profile, routines, habits, limits, roadmap")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("daily_logs")
      .select("day, routine_done, habit_done, limit_counts, mood, focus_minutes")
      .eq("user_id", userId)
      .order("day", { ascending: false })
      .limit(180),
  ]);

  if (!config && (!logs || logs.length === 0)) return null;

  const snapshot: CloudSnapshot = {};

  if (config) {
    const profile = config.profile as Partial<Profile> | null;
    if (profile && Object.keys(profile).length) snapshot.profile = profile as Profile;
    const routines = config.routines as RoutineItem[] | null;
    if (routines?.length) snapshot.routines = routines;
    const habits = config.habits as Habit[] | null;
    if (habits?.length) snapshot.habits = habits;
    const limits = config.limits as Limit[] | null;
    if (limits?.length) snapshot.limits = limits;
    const roadmap = config.roadmap as Record<string, boolean> | null;
    if (roadmap) snapshot.roadmap = roadmap;
  }

  if (logs?.length) {
    const routineLog: Record<string, string[]> = {};
    const habitLog: Record<string, string[]> = {};
    const limitLog: Record<string, Record<string, number>> = {};
    const moodLog: Record<string, Mood> = {};
    const focusLog: Record<string, number> = {};
    for (const row of logs) {
      const day = String(row.day);
      routineLog[day] = row.routine_done ?? [];
      habitLog[day] = row.habit_done ?? [];
      limitLog[day] = (row.limit_counts as Record<string, number>) ?? {};
      if (row.mood) moodLog[day] = row.mood as Mood;
      focusLog[day] = row.focus_minutes ?? 0;
    }
    snapshot.routineLog = routineLog;
    snapshot.habitLog = habitLog;
    snapshot.limitLog = limitLog;
    snapshot.moodLog = moodLog;
    snapshot.focusLog = focusLog;
  }

  return snapshot;
}

/** Autosave: profile, routines, habits, limits and roadmap. */
export async function saveCloudConfig(userId: string, state: AppState): Promise<void> {
  await supabase.from("user_config").upsert({
    user_id: userId,
    profile: state.profile,
    routines: state.routines,
    habits: state.habits,
    limits: state.limits,
    roadmap: state.roadmap,
    updated_at: new Date().toISOString(),
  });
}

/** Autosave: one day of check-in data (used for weekly analytics). */
export async function saveCloudDay(userId: string, state: AppState, day: string): Promise<void> {
  await supabase.from("daily_logs").upsert({
    user_id: userId,
    day,
    routine_done: state.routineLog[day] ?? [],
    habit_done: state.habitLog[day] ?? [],
    limit_counts: state.limitLog[day] ?? {},
    mood: state.moodLog[day] ?? null,
    focus_minutes: state.focusLog[day] ?? 0,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteCloudData(userId: string): Promise<void> {
  await Promise.all([
    supabase.from("daily_logs").delete().eq("user_id", userId),
    supabase.from("user_config").delete().eq("user_id", userId),
  ]);
}
