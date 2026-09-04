import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Plus, Trash2, Pencil, Sunrise, Sun, Sunset, Moon } from "lucide-react";
import { toast } from "sonner";

import { AppShell, Card, EmptyState } from "@/components/AppShell";
import { todayKey, useStore, type Block, type RoutineItem } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/routine")({
  head: () => ({
    meta: [
      { title: "Today's Routine — LIFE UPGRADE" },
      {
        name: "description",
        content: "Plan and check off your morning, afternoon, evening and night routine blocks.",
      },
      { property: "og:title", content: "Today's Routine — LIFE UPGRADE" },
      { property: "og:description", content: "A calm, structured day: four routine blocks you actually finish." },
    ],
  }),
  component: RoutinePage,
});

const BLOCKS: { key: Block; label: string; icon: typeof Sunrise }[] = [
  { key: "morning", label: "Morning", icon: Sunrise },
  { key: "afternoon", label: "Afternoon", icon: Sun },
  { key: "evening", label: "Evening", icon: Sunset },
  { key: "night", label: "Night", icon: Moon },
];

function RoutinePage() {
  const { state, toggleRoutine, addRoutine, updateRoutine, removeRoutine } = useStore();
  const today = todayKey();
  const done = state.routineLog[today] ?? [];
  const [editing, setEditing] = useState<RoutineItem | null>(null);
  const [form, setForm] = useState<{ title: string; time: string; block: Block }>({
    title: "",
    time: "07:00",
    block: "morning",
  });

  const startEdit = (item: RoutineItem) => {
    setEditing(item);
    setForm({ title: item.title, time: item.time, block: item.block });
  };

  const submit = () => {
    if (!form.title.trim()) {
      toast.error("Add a short title for this routine step.");
      return;
    }
    if (editing) {
      updateRoutine(editing.id, form);
      toast.success("Routine updated.");
    } else {
      addRoutine(form);
      toast.success("Added to your routine.");
    }
    setEditing(null);
    setForm({ title: "", time: "07:00", block: form.block });
  };

  const total = state.routines.length;

  return (
    <AppShell
      title="Today's routine"
      subtitle={`${done.length}/${total} steps done — progress over perfection`}
    >
      {total === 0 ? (
        <EmptyState
          title="No routine steps yet"
          hint="Add your first small step below — one 10-minute win is enough to start."
        />
      ) : (
        BLOCKS.map(({ key, label, icon: Icon }) => {
          const items = state.routines
            .filter((r) => r.block === key)
            .sort((a, b) => a.time.localeCompare(b.time));
          if (items.length === 0) return null;
          return (
            <Card key={key} className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" aria-hidden />
                <h2 className="font-display text-sm font-semibold uppercase tracking-widest">
                  {label}
                </h2>
                <span className="ml-auto text-xs text-muted-foreground">
                  {items.filter((i) => done.includes(i.id)).length}/{items.length}
                </span>
              </div>
              <ul className="space-y-2">
                {items.map((item) => {
                  const checked = done.includes(item.id);
                  return (
                    <li key={item.id} className="flex items-center gap-2">
                      <button
                        onClick={() => toggleRoutine(item.id)}
                        aria-pressed={checked}
                        className={`press flex min-w-0 flex-1 items-center gap-3 rounded-xl border px-3 py-3 text-left ${
                          checked ? "border-primary/50 bg-primary/10" : "border-border bg-elevated"
                        }`}
                      >
                        <span
                          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
                            checked ? "border-primary bg-primary text-primary-foreground" : "border-border"
                          }`}
                        >
                          {checked ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
                        </span>
                        <span className="min-w-0">
                          <span className={`block truncate text-sm ${checked ? "line-through opacity-70" : ""}`}>
                            {item.title}
                          </span>
                          <span className="text-xs text-muted-foreground">{item.time}</span>
                        </span>
                      </button>
                      <button
                        onClick={() => startEdit(item)}
                        aria-label={`Edit ${item.title}`}
                        className="press rounded-lg border border-border p-2 text-muted-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                      </button>
                      <button
                        onClick={() => {
                          removeRoutine(item.id);
                          toast.success("Removed from routine.");
                        }}
                        aria-label={`Delete ${item.title}`}
                        className="press rounded-lg border border-border p-2 text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })
      )}

      <Card className="space-y-3">
        <h2 className="font-display text-sm font-semibold">
          {editing ? "Edit routine step" : "Add routine step"}
        </h2>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="e.g. 15 min evening walk"
          className="w-full rounded-xl border border-input bg-elevated px-3 py-3 text-base outline-none focus:border-primary"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            className="rounded-xl border border-input bg-elevated px-3 py-3 text-base outline-none focus:border-primary"
          />
          <select
            value={form.block}
            onChange={(e) => setForm({ ...form, block: e.target.value as Block })}
            className="rounded-xl border border-input bg-elevated px-3 py-3 text-base outline-none focus:border-primary"
          >
            {BLOCKS.map((b) => (
              <option key={b.key} value={b.key}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={submit}
            className="press flex flex-1 items-center justify-center gap-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" aria-hidden /> {editing ? "Save changes" : "Add step"}
          </button>
          {editing ? (
            <button
              onClick={() => {
                setEditing(null);
                setForm({ title: "", time: "07:00", block: form.block });
              }}
              className="press rounded-xl border border-border px-4 text-sm font-semibold"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </Card>
    </AppShell>
  );
}
