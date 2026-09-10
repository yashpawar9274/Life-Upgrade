import { createFileRoute } from "@tanstack/react-router";

/** PayU server-to-server notification (webhook). Hash-verified before any write. */
export const Route = createFileRoute("/api/public/payu-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const contentType = request.headers.get("content-type") ?? "";
        const payload: Record<string, string> = {};
        if (contentType.includes("json")) {
          const json = (await request.json()) as Record<string, unknown>;
          for (const [k, v] of Object.entries(json)) payload[k] = String(v ?? "");
        } else {
          const form = await request.formData();
          form.forEach((value, key) => {
            if (typeof value === "string") payload[key] = value;
          });
        }

        const txnid = payload["txnid"];
        if (!txnid) return new Response("Missing txnid", { status: 400 });

        const payu = await import("@/lib/payu.server");
        if (!payu.isValidResponseHash(payload)) {
          return new Response("Invalid signature", { status: 401 });
        }

        const verified = await payu.verifyPayment(txnid);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: row } = await supabaseAdmin
          .from("subscriptions")
          .select("id, interval")
          .eq("payu_txnid", txnid)
          .maybeSingle();
        if (!row) return new Response("ok");

        const paid = verified.status === "success";
        const days = row.interval === "year" ? 366 : row.interval === "month" ? 32 : null;
        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: paid ? (days ? "active" : "paid") : "failed",
            payu_payment_id: verified.paymentId,
            ...(paid && days
              ? {
                  current_period_end: new Date(
                    Date.now() + days * 24 * 60 * 60 * 1000,
                  ).toISOString(),
                }
              : {}),
          })
          .eq("id", row.id);

        return new Response("ok");
      },
    },
  },
});
