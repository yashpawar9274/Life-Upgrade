import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy, Crown, Pencil, Repeat2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell, Card, Disclaimer, EmptyState, SectionTitle } from "@/components/AppShell";
import { DISCLAIMER, useStore } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/voice-log")({
  head: () => ({
    meta: [
      { title: "Voice Sessions & Transcripts — LIFE UPGRADE" },
      {
        name: "description",
        content:
          "Review, edit and reuse transcripts of your voice conversations with the LIFE AI COACH, saved in your account.",
      },
      { property: "og:title", content: "Voice Sessions & Transcripts — LIFE UPGRADE" },
      {
        property: "og:description",
        content: "Every voice coaching session, saved as an editable transcript you can reuse.",
      },
    ],
  }),
  component: VoiceLogPage,
});

function VoiceLogPage() {
  const { state, updateVoiceSession, removeVoiceSession } = useStore();
  const navigate = useNavigate();
  const hi = state.profile.language === "hindi";
  const premium = state.profile.plan === "premium";
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  if (!premium) {
    return (
      <AppShell title={hi ? "वॉइस इतिहास" : "Voice history"} subtitle="Premium feature" backTo="/coach">
        <Card className="hero-gradient space-y-3 text-center">
          <h2 className="font-display text-lg font-semibold">
            {hi ? "प्रीमियम में उपलब्ध" : "Available on Premium"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {hi
              ? "हर वॉइस बातचीत का ट्रांसक्रिप्ट सेव होता है — पढ़ें, बदलें और दोबारा भेजें।"
              : "Every voice conversation is saved as a transcript you can read, edit and reuse."}
          </p>
          <Link
            to="/upgrade"
            className="press flex items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-semibold text-gold-foreground"
          >
            <Crown className="h-4 w-4" aria-hidden /> {hi ? "प्रीमियम लें" : "Unlock Premium"}
          </Link>
        </Card>
        <Disclaimer text={DISCLAIMER} />
      </AppShell>
    );
  }

  const sessions = state.voiceSessions;

  return (
    <AppShell
      title={hi ? "वॉइस इतिहास" : "Voice history"}
      subtitle={
        hi ? "आपकी बातचीत के ट्रांसक्रिप्ट — पढ़ें, बदलें, दोबारा इस्तेमाल करें" : "Transcripts you can review, edit and reuse"
      }
      backTo="/coach"
    >
      {sessions.length === 0 ? (
        <EmptyState
          title={hi ? "अभी कोई सेशन नहीं" : "No voice sessions yet"}
          hint={
            hi
              ? "कोच पेज पर वॉइस मोड चालू करें — बातचीत यहाँ अपने आप सेव होगी।"
              : "Turn on voice mode on the coach page — conversations save here automatically."
          }
          action={
            <Link to="/coach" className="press mt-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              {hi ? "कोच खोलें" : "Open coach"}
            </Link>
          }
        />
      ) : (
        <>
          <SectionTitle>
            {sessions.length} {hi ? "सेशन" : sessions.length === 1 ? "session" : "sessions"}
          </SectionTitle>
          {sessions.map((s) => {
            const open = openId === s.id;
            return (
              <Card key={s.id} className="space-y-2">
                <button
                  onClick={() => setOpenId(open ? null : s.id)}
                  aria-expanded={open}
                  className="press flex w-full items-start gap-3 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{s.title}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {new Date(s.startedAt).toLocaleString()} ·{" "}
                      {Math.max(1, Math.round((s.endedAt - s.startedAt) / 60000))} min · {s.turns.length}{" "}
                      {hi ? "बातें" : "turns"}
                    </span>
                  </span>
                </button>

                {open ? (
                  <div className="space-y-2">
                    {s.turns.map((turn, i) => (
                      <div
                        key={`${s.id}-${i}`}
                        className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                          turn.role === "user" ? "bg-primary/15" : "bg-elevated"
                        }`}
                      >
                        <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                          {turn.role === "user" ? (hi ? "आप" : "You") : hi ? "कोच" : "Coach"}
                        </p>
                        <p className="whitespace-pre-wrap">{turn.content}</p>
                        {turn.role === "assistant" ? (
                          <div className="mt-2 flex gap-3">
                            <button
                              onClick={() => {
                                void navigator.clipboard?.writeText(turn.content);
                                toast.success(hi ? "कॉपी हो गया।" : "Copied.");
                              }}
                              className="press flex items-center gap-1 text-xs font-semibold text-primary"
                            >
                              <Copy className="h-3.5 w-3.5" aria-hidden /> {hi ? "कॉपी" : "Copy"}
                            </button>
                            <button
                              onClick={() => {
                                void navigator.clipboard?.writeText(turn.content);
                                void navigate({ to: "/coach" });
                                toast.success(
                                  hi ? "कोच में दोबारा पूछने के लिए पेस्ट करें।" : "Paste it in the coach to build on this advice.",
                                );
                              }}
                              className="press flex items-center gap-1 text-xs font-semibold text-gold"
                            >
                              <Repeat2 className="h-3.5 w-3.5" aria-hidden /> {hi ? "दोबारा उपयोग" : "Reuse"}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}

                    {editing === s.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          rows={4}
                          placeholder={hi ? "अपने नोट्स…" : "Your notes…"}
                          className="w-full rounded-xl border border-border bg-elevated p-3 text-sm outline-none"
                        />
                        <button
                          onClick={() => {
                            updateVoiceSession(s.id, { notes: draft, title: draft.split("\n")[0]?.slice(0, 60) || s.title });
                            setEditing(null);
                            toast.success(hi ? "नोट सेव हो गया।" : "Notes saved.");
                          }}
                          className="press flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
                        >
                          <Check className="h-4 w-4" aria-hidden /> {hi ? "सेव करें" : "Save"}
                        </button>
                      </div>
                    ) : (
                      <>
                        {s.notes ? (
                          <p className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs">{s.notes}</p>
                        ) : null}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditing(s.id);
                              setDraft(s.notes ?? "");
                            }}
                            className="press flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-xs font-semibold"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden /> {hi ? "नोट जोड़ें" : "Edit notes"}
                          </button>
                          <button
                            onClick={() => {
                              removeVoiceSession(s.id);
                              toast.success(hi ? "सेशन हटा दिया।" : "Session deleted.");
                            }}
                            className="press flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-semibold text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </>
      )}
      <Disclaimer text={DISCLAIMER} />
    </AppShell>
  );
}
