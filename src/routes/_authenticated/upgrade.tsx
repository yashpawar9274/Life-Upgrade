import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Check, Crown, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AppShell, Card, Disclaimer, SectionTitle } from "@/components/AppShell";
import { DISCLAIMER, useStore } from "@/lib/store";
import { PLAN_OPTIONS, type PlanCode } from "@/lib/plans";
import { loadCashfree } from "@/lib/cashfree-sdk";
import {
  cancelMySubscription,
  getMySubscription,
  getTrialStatus,
  startCheckout,
  startFreeTrial,
  verifyCheckout,
} from "@/lib/billing.functions";


export const Route = createFileRoute("/_authenticated/upgrade")({
  head: () => ({
    meta: [
      { title: "Upgrade to Premium — LIFE UPGRADE" },
      {
        name: "description",
        content:
          "Unlock LIFE AI COACH, premium analytics, smart planner, voice coaching and the Luxury Life Roadmap. Monthly, yearly or lifetime.",
      },
      { property: "og:title", content: "Upgrade to Premium — LIFE UPGRADE" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content: "Everything free, plus a personal AI coach that plans your week.",
      },
    ],
  }),
  component: UpgradePage,
});

const FREE = [
  "Daily routine planner (4 blocks)",
  "Habit tracker with streaks & weekly progress",
  "Bad habit limits & gentle reduction tracking",
  "Mood check-ins and daily motivation",
  "Focus timer and simple weekly report",
];

const PREMIUM = [
  "LIFE AI COACH chat (Hindi / Hinglish / English)",
  "Voice-to-voice coaching with background mode",
  "Personalised routines from your goals & timings",
  "Smart daily planner around your work hours",
  "Habit heatmap, mood trends, sleep consistency",
  "Luxury Life Roadmap + weekly AI improvement plan",
  "Exportable weekly progress report",
];

type SubRow = {
  plan_code: string;
  interval: string;
  amount: number | string;
  status: string;
  current_period_end: string | null;
  cashfree_subscription_id: string | null;
};
type TrialInfo = {
  eligible: boolean;
  trialActive: boolean;
  trialEndsAt: string | null;
  trialUsed: boolean;
};


function UpgradePage() {
  const { state, setProfile } = useStore();
  const navigate = useNavigate();
  const premium = state.profile.plan === "premium";

  const start = useServerFn(startCheckout);
  const verify = useServerFn(verifyCheckout);
  const loadSub = useServerFn(getMySubscription);
  const cancel = useServerFn(cancelMySubscription);
  const loadTrial = useServerFn(getTrialStatus);
  const beginTrial = useServerFn(startFreeTrial);

  const [selected, setSelected] = useState<PlanCode>("yearly");
  const [name, setName] = useState(state.profile.name ?? "");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sub, setSub] = useState<SubRow | null>(null);
  const [trial, setTrial] = useState<TrialInfo | null>(null);

  useEffect(() => {
    void loadSub({}).then((row) => setSub((row as SubRow | null) ?? null));
    void loadTrial({}).then((info) => setTrial(info as TrialInfo));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activateTrial = async () => {
    setBusy(true);
    try {
      const res = await beginTrial({});
      setProfile({ plan: "premium" });
      setTrial({ eligible: false, trialActive: true, trialEndsAt: res.trialEndsAt, trialUsed: true });
      toast.success("7-day free trial started. Enjoy full Premium!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start the trial.");
    } finally {
      setBusy(false);
    }
  };


  // Coming back from Cashfree: confirm the payment and unlock Premium.
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (!ref) return;
    setChecking(true);
    void verify({ data: { ref } })
      .then((res) => {
        if (res.premium) {
          setProfile({ plan: "premium" });
          toast.success("Payment confirmed. Premium unlocked!");
          void loadSub({}).then((row) => setSub((row as SubRow | null) ?? null));
        } else {
          toast.error("Payment was not completed. Nothing was charged twice.");
        }
      })
      .catch(() => toast.error("We couldn't confirm the payment yet. Try refreshing in a minute."))
      .finally(() => {
        setChecking(false);
        window.history.replaceState({}, "", "/upgrade");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pay = async () => {
    if (!name.trim()) {
      toast.error("Add your name first.");
      return;
    }
    if (!/^[0-9]{10}$/.test(phone.trim())) {
      toast.error("Enter a 10-digit mobile number.");
      return;
    }
    setBusy(true);
    try {
      const res = await start({
        data: {
          planCode: selected,
          name: name.trim(),
          phone: phone.trim(),
          origin: window.location.origin,
        },
      });
      const cashfree = await loadCashfree();
      if (res.mode === "order") {
        await cashfree.checkout({ paymentSessionId: res.sessionId, redirectTarget: "_self" });
      } else {
        await cashfree.subscriptionsCheckout({
          subsSessionId: res.sessionId,
          redirectTarget: "_self",
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment could not be started.");
    } finally {
      setBusy(false);
    }
  };

  const renews = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <AppShell title="Upgrade" subtitle="Go from tracking to coaching" backTo="/">
      <Card className="hero-gradient space-y-2 text-center">
        <Crown className="mx-auto h-8 w-8 text-gold" aria-hidden />
        <h2 className="font-display text-2xl font-semibold">
          LIFE UPGRADE <span className="gold-text">Premium</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Start free for 7 days · monthly, yearly or lifetime after that
        </p>
      </Card>

      {trial?.eligible && (
        <Card className="space-y-3 border-primary/50">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            <h3 className="font-display text-lg font-semibold">7 days free, no card needed</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Try everything in Premium — AI coach, voice coaching, smart planner, analytics and the
            Luxury Life Roadmap. Nothing is charged, and it ends on its own after 7 days.
          </p>
          <button
            onClick={() => void activateTrial()}
            disabled={busy}
            className="press flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Start my 7-day free trial
          </button>
        </Card>
      )}

      {trial?.trialActive && trial.trialEndsAt && (
        <Card className="space-y-1 border-primary/50">
          <p className="font-display text-base font-semibold">Free trial active</p>
          <p className="text-xs text-muted-foreground">
            Full Premium until{" "}
            {new Date(trial.trialEndsAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            . Pick a plan below anytime to keep it going.
          </p>
        </Card>
      )}


      {checking && (
        <Card className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden /> Confirming your
          payment…
        </Card>
      )}

      {premium && sub ? (
        <>
          <SectionTitle>Your subscription</SectionTitle>
          <Card className="space-y-2 border-gold/40">
            <p className="font-display text-lg font-semibold capitalize">
              {sub.plan_code} plan · ₹{Number(sub.amount).toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-muted-foreground">
              Status: <span className="capitalize">{sub.status}</span>
              {renews ? ` · renews ${renews}` : ""}
            </p>
            {sub.cashfree_subscription_id && sub.status !== "cancelled" && (
              <button
                onClick={async () => {
                  setBusy(true);
                  try {
                    await cancel({});
                    toast.success("Auto-renewal cancelled. Premium stays till the period ends.");
                    const row = await loadSub({});
                    setSub((row as SubRow | null) ?? null);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not cancel.");
                  } finally {
                    setBusy(false);
                  }
                }}
                disabled={busy}
                className="press w-full rounded-xl border border-border py-3 text-sm font-semibold disabled:opacity-60"
              >
                Cancel auto-renewal
              </button>
            )}
          </Card>
        </>
      ) : null}

      <SectionTitle>Choose your plan</SectionTitle>
      <div className="space-y-2">
        {PLAN_OPTIONS.map((plan) => {
          const active = selected === plan.code;
          return (
            <button
              key={plan.code}
              onClick={() => setSelected(plan.code)}
              aria-pressed={active}
              className={`press surface flex w-full items-center gap-3 p-4 text-left ${
                active ? "border-gold/60 ring-1 ring-gold/40" : ""
              }`}
            >
              <span
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                  active ? "border-gold bg-gold/20" : "border-border"
                }`}
              >
                {active && <span className="h-2 w-2 rounded-full bg-gold" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className="font-display text-base font-semibold">{plan.title}</span>
                  {plan.badge && (
                    <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold">
                      {plan.badge}
                    </span>
                  )}
                </span>
                <span className="block text-xs text-muted-foreground">{plan.note}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-display text-base font-semibold">
                  {plan.priceLabel}
                </span>
                <span className="block text-[11px] text-muted-foreground">{plan.cadence}</span>
              </span>
            </button>
          );
        })}
      </div>

      <Card className="space-y-3">
        <label className="block text-xs font-medium text-muted-foreground">
          Name on the payment
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="mt-1 w-full rounded-xl border border-input bg-elevated px-3 py-2.5 text-base outline-none focus:border-primary"
          />
        </label>
        <label className="block text-xs font-medium text-muted-foreground">
          Mobile number
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
            inputMode="numeric"
            placeholder="10-digit mobile number"
            className="mt-1 w-full rounded-xl border border-input bg-elevated px-3 py-2.5 text-base outline-none focus:border-primary"
          />
        </label>
        <button
          onClick={() => void pay()}
          disabled={busy}
          className="press flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3.5 text-sm font-semibold text-gold-foreground shadow-[var(--shadow-gold)] disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {selected === "lifetime" ? "Pay once & unlock forever" : "Subscribe & unlock Premium"}
        </button>
        <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
          UPI, cards, netbanking & wallets · handled by Cashfree, we never see your card details.
        </p>
      </Card>

      <SectionTitle>Free plan</SectionTitle>
      <Card>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {FREE.map((f) => (
            <li key={f} className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              {f}
            </li>
          ))}
        </ul>
      </Card>

      <SectionTitle>Premium plan</SectionTitle>
      <Card className="border-gold/40">
        <ul className="space-y-2 text-sm">
          {PREMIUM.map((f) => (
            <li key={f} className="flex gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
              {f}
            </li>
          ))}
        </ul>
      </Card>

      {premium && (
        <button
          onClick={() => navigate({ to: "/coach" })}
          className="press w-full rounded-xl border border-gold/40 bg-gold/10 py-3 text-sm font-semibold text-gold"
        >
          Open your AI coach
        </button>
      )}

      <Disclaimer text={DISCLAIMER} />
    </AppShell>
  );
}
