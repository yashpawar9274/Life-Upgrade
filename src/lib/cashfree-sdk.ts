type CashfreeInstance = {
  checkout: (opts: { paymentSessionId: string; redirectTarget?: string }) => Promise<unknown>;
  subscriptionsCheckout: (opts: {
    subsSessionId: string;
    redirectTarget?: string;
  }) => Promise<unknown>;
};

declare global {
  interface Window {
    Cashfree?: (opts: { mode: "production" | "sandbox" }) => CashfreeInstance;
  }
}

const SRC = "https://sdk.cashfree.com/js/v3/cashfree.js";

/** Loads the Cashfree checkout SDK once and returns a live-mode instance. */
export async function loadCashfree(): Promise<CashfreeInstance> {
  if (typeof window === "undefined") throw new Error("Checkout runs in the browser only.");
  if (!window.Cashfree) {
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Checkout failed to load.")));
        return;
      }
      const script = document.createElement("script");
      script.src = SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Checkout failed to load."));
      document.head.appendChild(script);
    });
  }
  if (!window.Cashfree) throw new Error("Checkout failed to load.");
  return window.Cashfree({ mode: "production" });
}
