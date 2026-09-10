import { createFileRoute } from "@tanstack/react-router";

/**
 * PayU posts the shopper back here (surl / furl). We verify the reverse hash,
 * confirm server-to-server, update the subscription and redirect into the app.
 */
export const Route = createFileRoute("/api/public/payu-return")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = await request.formData();
        const payload: Record<string, string> = {};
        form.forEach((value, key) => {
          if (typeof value === "string") payload[key] = value;
        });

        const origin = new URL(request.url).origin;
        const txnid = payload["txnid"] ?? "";
        const redirect = (ok: boolean) =>
          new Response(null, {
            status: 303,
            headers: {
              Location: `${origin}/upgrade?payu=${ok ? "1" : "0"}&ref=${encodeURIComponent(txnid)}`,
            },
          });

        if (!txnid) return redirect(false);

        try {
          const payu = await import("@/lib/payu.server");
          if (!payu.isValidResponseHash(payload)) return redirect(false);

          const verified = await payu.verifyPayment(txnid);
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: row } = await supabaseAdmin
            .from("subscriptions")
            .select("id, interval")
            .eq("payu_txnid", txnid)
            .maybeSingle();

          if (row) {
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
          }

          return redirect(verified.status === "success");
        } catch {
          return redirect(false);
        }
      },
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        return new Response(null, { status: 303, headers: { Location: `${origin}/upgrade` } });
      },
    },
  },
});
