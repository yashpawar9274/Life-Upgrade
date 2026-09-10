import { createHash } from "crypto";

/** PayU hosted-checkout helpers (server only). */

export type PayuCreds = { key: string; salt: string; mode: "live" | "test" };

export function payuCreds(): PayuCreds {
  const key = process.env["PAYU_MERCHANT_KEY"];
  const salt = process.env["PAYU_MERCHANT_SALT"];
  const mode = (process.env["PAYU_MODE"] ?? "live").toLowerCase() === "test" ? "test" : "live";
  if (!key || !salt) throw new Error("PayU payments are not configured yet.");
  return { key, salt, mode };
}

export function payuPaymentUrl(mode: "live" | "test"): string {
  return mode === "test" ? "https://test.payu.in/_payment" : "https://secure.payu.in/_payment";
}

function sha512(value: string): string {
  return createHash("sha512").update(value).digest("hex");
}

export type PayuFields = {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  udf1: string;
  hash: string;
};

/** Builds the signed field set for the PayU checkout form POST. */
export function buildPaymentRequest(input: {
  txnid: string;
  amount: number;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  udf1?: string;
}): { action: string; fields: PayuFields } {
  const { key, salt, mode } = payuCreds();
  const amount = input.amount.toFixed(2);
  const udf1 = input.udf1 ?? "";
  const hash = sha512(
    [
      key,
      input.txnid,
      amount,
      input.productinfo,
      input.firstname,
      input.email,
      udf1,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      salt,
    ].join("|"),
  );
  return {
    action: payuPaymentUrl(mode),
    fields: {
      key,
      txnid: input.txnid,
      amount,
      productinfo: input.productinfo,
      firstname: input.firstname,
      email: input.email,
      phone: input.phone,
      surl: input.surl,
      furl: input.furl,
      udf1,
      hash,
    },
  };
}

/** Validates the reverse hash PayU sends back on surl/furl and webhooks. */
export function isValidResponseHash(p: Record<string, string>): boolean {
  const { key, salt } = payuCreds();
  const additional = p["additionalCharges"];
  const base = [
    salt,
    p["status"] ?? "",
    "",
    "",
    "",
    "",
    "",
    p["udf5"] ?? "",
    p["udf4"] ?? "",
    p["udf3"] ?? "",
    p["udf2"] ?? "",
    p["udf1"] ?? "",
    p["email"] ?? "",
    p["firstname"] ?? "",
    p["productinfo"] ?? "",
    p["amount"] ?? "",
    p["txnid"] ?? "",
    key,
  ].join("|");
  const expected = sha512(additional ? `${additional}|${base}` : base);
  return expected.toLowerCase() === String(p["hash"] ?? "").toLowerCase();
}

type VerifyResponse = {
  status?: number;
  transaction_details?: Record<
    string,
    { status?: string; mihpayid?: string; amt?: string; error_Message?: string }
  >;
};

/** Server-to-server confirmation of a transaction status. */
export async function verifyPayment(txnid: string): Promise<{
  status: "success" | "failure" | "pending";
  paymentId: string | null;
}> {
  const { key, salt, mode } = payuCreds();
  const command = "verify_payment";
  const hash = sha512([key, command, txnid, salt].join("|"));
  const endpoint =
    mode === "test"
      ? "https://test.payu.in/merchant/postservice.php?form=2"
      : "https://info.payu.in/merchant/postservice.php?form=2";

  const body = new URLSearchParams({ key, command, var1: txnid, hash });
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();
  let parsed: VerifyResponse | null = null;
  try {
    parsed = JSON.parse(text) as VerifyResponse;
  } catch {
    parsed = null;
  }
  const detail = parsed?.transaction_details?.[txnid];
  const raw = (detail?.status ?? "").toLowerCase();
  const status = raw === "success" ? "success" : raw === "failure" ? "failure" : "pending";
  return { status, paymentId: detail?.mihpayid ?? null };
}
