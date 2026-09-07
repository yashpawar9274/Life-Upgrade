const API_BASE = "https://api.cashfree.com/pg";
const API_VERSION = "2025-01-01";

export function cashfreeCreds() {
  const appId = process.env["CASHFREE_APP_ID"];
  const secretKey = process.env["CASHFREE_SECRET_KEY"];
  if (!appId || !secretKey) throw new Error("Payments are not configured yet.");
  return { appId, secretKey };
}

/** Turns Cashfree account-level errors into something a user can act on. */
export function friendlyCashfreeError(message?: string | null): string {
  const raw = (message ?? "").trim();
  if (/profile is inactive/i.test(raw)) {
    return "Your Cashfree account is not activated for live payments yet. Finish KYC/activation in Cashfree (and enable Subscriptions for auto-renewing plans), then try again.";
  }
  if (/authentication|unauthorized|x-client/i.test(raw)) {
    return "Cashfree rejected the API keys. Check that the live App ID and Secret Key are correct.";
  }
  return raw || "Cashfree could not process this request.";
}

async function call<T>(
  path: string,
  init: { method: "GET" | "POST"; body?: unknown },
): Promise<{ ok: boolean; status: number; data: T }> {
  const { appId, secretKey } = cashfreeCreds();
  const res = await fetch(`${API_BASE}${path}`, {
    method: init.method,
    headers: {
      "Content-Type": "application/json",
      "x-api-version": API_VERSION,
      "x-client-id": appId,
      "x-client-secret": secretKey,
    },
    ...(init.body ? { body: JSON.stringify(init.body) } : {}),
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }
  return { ok: res.ok, status: res.status, data: data as T };
}

/** Create a one-time order; returns the payment_session_id for the checkout SDK. */
export async function createOrder(input: {
  orderId: string;
  amount: number;
  customer: { id: string; name: string; email: string; phone: string };
  returnUrl: string;
}): Promise<string> {
  const res = await call<{ payment_session_id?: string; message?: string }>("/orders", {
    method: "POST",
    body: {
      order_id: input.orderId,
      order_amount: input.amount,
      order_currency: "INR",
      customer_details: {
        customer_id: input.customer.id,
        customer_name: input.customer.name,
        customer_email: input.customer.email,
        customer_phone: input.customer.phone,
      },
      order_meta: { return_url: input.returnUrl },
    },
  });
  if (!res.ok || !res.data?.payment_session_id) {
    throw new Error(friendlyCashfreeError(res.data?.message));
  }
  return res.data.payment_session_id;
}

/** Create (or reuse) a recurring plan in Cashfree. */
export async function ensurePlan(input: {
  planId: string;
  name: string;
  amount: number;
  intervalType: "month" | "year";
}): Promise<void> {
  const existing = await call<{ plan_id?: string }>(`/plans/${input.planId}`, { method: "GET" });
  if (existing.ok && existing.data?.plan_id) return;

  const res = await call<{ plan_id?: string; message?: string; code?: string }>("/plans", {
    method: "POST",
    body: {
      plan_id: input.planId,
      plan_name: input.name,
      plan_type: "PERIODIC",
      plan_currency: "INR",
      plan_recurring_amount: input.amount,
      plan_max_amount: input.amount,
      plan_interval_type: input.intervalType.toUpperCase(),
      plan_intervals: 1,
      plan_note: "LIFE UPGRADE Premium",
    },
  });
  if (!res.ok && !String(res.data?.message ?? "").toLowerCase().includes("already")) {
    throw new Error(friendlyCashfreeError(res.data?.message));
  }
}

/** Create a subscription (auto-debit mandate); returns subscription_session_id. */
export async function createSubscription(input: {
  subscriptionId: string;
  planId: string;
  amount: number;
  customer: { id: string; name: string; email: string; phone: string };
  returnUrl: string;
  expiresAt: string;
}): Promise<string> {
  const res = await call<{ subscription_session_id?: string; message?: string }>("/subscriptions", {
    method: "POST",
    body: {
      subscription_id: input.subscriptionId,
      customer_details: {
        customer_name: input.customer.name,
        customer_email: input.customer.email,
        customer_phone: input.customer.phone,
      },
      plan_details: { plan_id: input.planId },
      authorization_details: { authorization_amount: 1, authorization_amount_refund: true },
      subscription_expiry_time: input.expiresAt,
      subscription_meta: { return_url: input.returnUrl },
    },
  });
  if (!res.ok || !res.data?.subscription_session_id) {
    throw new Error(friendlyCashfreeError(res.data?.message));
  }
  return res.data.subscription_session_id;
}

export async function fetchOrder(orderId: string) {
  return call<{ order_status?: string; cf_order_id?: string | number }>(`/orders/${orderId}`, {
    method: "GET",
  });
}

export async function fetchSubscription(subscriptionId: string) {
  return call<{ subscription_status?: string; next_payment_time?: string }>(
    `/subscriptions/${subscriptionId}`,
    { method: "GET" },
  );
}

export async function cancelSubscription(subscriptionId: string) {
  return call<{ subscription_status?: string; message?: string }>(
    `/subscriptions/${subscriptionId}/manage`,
    { method: "POST", body: { action: "CANCEL" } },
  );
}
