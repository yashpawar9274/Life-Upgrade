import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/public/cashfree-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["CASHFREE_SECRET_KEY"];
        if (!secret) return new Response("Not configured", { status: 503 });

        const signature = request.headers.get("x-webhook-signature");
        const timestamp = request.headers.get("x-webhook-timestamp");
        const body = await request.text();
        if (!signature || !timestamp) return new Response("Missing signature", { status: 401 });

        const expected = createHmac("sha256", secret).update(timestamp + body).digest("base64");
        const a = Buffer.from(signature);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: any;
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response("Bad payload", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const type = String(payload?.type ?? "");
        const d = payload?.data ?? {};

        // One-time (lifetime) order events
        const orderId: string | undefined = d?.order?.order_id;
        if (orderId) {
          const paid = /SUCCESS|PAID/i.test(String(d?.payment?.payment_status ?? type));
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: paid ? "paid" : "failed",
              cashfree_payment_id: d?.payment?.cf_payment_id
                ? String(d.payment.cf_payment_id)
                : null,
            })
            .eq("cashfree_order_id", orderId);
          return new Response("ok");
        }

        // Subscription events
        const subId: string | undefined =
          d?.subscription?.subscription_id ?? d?.subscription_id ?? d?.subscription?.subscriptionId;
        if (subId) {
          const raw = String(
            d?.subscription?.subscription_status ?? d?.subscription_status ?? "",
          ).toUpperCase();
          const nextPayment: string | undefined =
            d?.subscription?.next_payment_time ?? d?.next_payment_time;

          const patch: { status?: string; current_period_end?: string } = {};
          if (raw) patch["status"] = raw.toLowerCase();
          if (/NEW_PAYMENT|PAYMENT_SUCCESS/i.test(type)) patch["status"] = "active";
          if (nextPayment) patch["current_period_end"] = nextPayment;
          else if (/NEW_PAYMENT|PAYMENT_SUCCESS/i.test(type)) {
            const { data: row } = await supabaseAdmin
              .from("subscriptions")
              .select("interval")
              .eq("cashfree_subscription_id", subId)
              .maybeSingle();
            const days = row?.interval === "year" ? 366 : 32;
            patch["current_period_end"] = new Date(
              Date.now() + days * 24 * 60 * 60 * 1000,
            ).toISOString();
          }
          if (Object.keys(patch).length) {
            await supabaseAdmin
              .from("subscriptions")
              .update(patch)
              .eq("cashfree_subscription_id", subId);
          }
          return new Response("ok");
        }

        return new Response("ignored");
      },
    },
  },
});
