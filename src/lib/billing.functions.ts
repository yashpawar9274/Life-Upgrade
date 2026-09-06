import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const startSchema = z.object({
  planCode: z.enum(["monthly", "yearly", "lifetime"]),
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().regex(/^[0-9]{10}$/, "Enter a 10-digit mobile number"),
  origin: z.string().url(),
});

const PRICES: Record<"monthly" | "yearly" | "lifetime", number> = {
  monthly: 399,
  yearly: 3499,
  lifetime: 7999,
};

/** Creates a Cashfree checkout session (recurring mandate or one-time) for the signed-in user. */
export const startCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => startSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { userId, claims } = context;
    const email = (claims["email"] as string | undefined) ?? "";
    if (!email) throw new Error("Your account needs an email address to pay.");

    const amount = PRICES[data.planCode];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cf = await import("@/lib/cashfree.server");
    const ref = `${data.planCode}_${userId.replace(/-/g, "").slice(0, 12)}_${Date.now()}`;
    const customer = { id: userId, name: data.name, email, phone: data.phone };
    const returnUrl = `${data.origin}/upgrade?ref=${ref}`;

    if (data.planCode === "lifetime") {
      const sessionId = await cf.createOrder({ orderId: ref, amount, customer, returnUrl });
      await supabaseAdmin.from("subscriptions").insert({
        user_id: userId,
        email,
        plan_code: "lifetime",
        interval: "lifetime",
        amount,
        status: "pending",
        cashfree_order_id: ref,
      });
      return { mode: "order" as const, sessionId, ref };
    }

    const planId = `life_upgrade_${data.planCode}`;
    await cf.ensurePlan({
      planId,
      name: `LIFE UPGRADE Premium ${data.planCode}`,
      amount,
      intervalType: data.planCode === "monthly" ? "month" : "year",
    });

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10)
      .toISOString()
      .replace(/\.\d{3}Z$/, "Z");

    const sessionId = await cf.createSubscription({
      subscriptionId: ref,
      planId,
      amount,
      customer,
      returnUrl,
      expiresAt,
    });

    await supabaseAdmin.from("subscriptions").insert({
      user_id: userId,
      email,
      plan_code: data.planCode,
      interval: data.planCode === "monthly" ? "month" : "year",
      amount,
      status: "pending",
      cashfree_subscription_id: ref,
    });

    return { mode: "subscription" as const, sessionId, ref };
  });

/** Reads the live status back from Cashfree after checkout and stores it. */
export const verifyCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ ref: z.string().min(4).max(80) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cf = await import("@/lib/cashfree.server");

    const { data: row } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", context.userId)
      .or(`cashfree_order_id.eq.${data.ref},cashfree_subscription_id.eq.${data.ref}`)
      .maybeSingle();
    if (!row) return { status: "unknown" as const, premium: false };

    if (row.plan_code === "lifetime") {
      const res = await cf.fetchOrder(data.ref);
      const paid = res.data?.order_status === "PAID";
      await supabaseAdmin
        .from("subscriptions")
        .update({ status: paid ? "paid" : "failed" })
        .eq("id", row.id);
      return { status: paid ? ("paid" as const) : ("failed" as const), premium: paid };
    }

    const res = await cf.fetchSubscription(data.ref);
    const raw = (res.data?.subscription_status ?? "").toUpperCase();
    const active = raw === "ACTIVE" || raw === "AUTHORIZED" || raw === "ON_HOLD";
    const periodEnd =
      res.data?.next_payment_time ??
      new Date(
        Date.now() + (row.interval === "year" ? 366 : 32) * 24 * 60 * 60 * 1000,
      ).toISOString();
    await supabaseAdmin
      .from("subscriptions")
      .update({
        status: active ? (raw === "ACTIVE" ? "active" : "authorized") : raw.toLowerCase() || "failed",
        current_period_end: active ? periodEnd : null,
      })
      .eq("id", row.id);
    return { status: active ? ("active" as const) : ("failed" as const), premium: active };
  });

/** Current subscription for the signed-in user. */
export const getMySubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("subscriptions")
      .select(
        "id, plan_code, interval, amount, status, current_period_end, cashfree_subscription_id, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ?? null;
  });

/** Cancels the auto-debit mandate; Premium stays until the paid period ends. */
export const cancelMySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cf = await import("@/lib/cashfree.server");
    const { data: row } = await supabaseAdmin
      .from("subscriptions")
      .select("id, cashfree_subscription_id, status")
      .eq("user_id", context.userId)
      .not("cashfree_subscription_id", "is", null)
      .in("status", ["active", "authorized"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!row?.cashfree_subscription_id) throw new Error("No active auto-renewing plan found.");

    const res = await cf.cancelSubscription(row.cashfree_subscription_id);
    if (!res.ok) throw new Error(res.data?.message ?? "Cashfree could not cancel this plan.");
    await supabaseAdmin
      .from("subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", row.id);
    return { ok: true };
  });
