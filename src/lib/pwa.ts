const SW_PATH = "/sw.js";

function isBlockedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  if (typeof window === "undefined") return true;
  if (window.top !== window.self) return true;
  const { hostname, search } = window.location;
  if (new URLSearchParams(search).has("sw") && new URLSearchParams(search).get("sw") === "off")
    return true;
  if (hostname.startsWith("id-preview--") || hostname.startsWith("preview--")) return true;
  const blocked = [
    "lovableproject.com",
    "lovableproject-dev.com",
    "beta.lovable.dev",
  ];
  return blocked.some((h) => hostname === h || hostname.endsWith(`.${h}`));
}

async function unregisterAppWorkers() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    regs
      .filter((r) => (r.active?.scriptURL ?? r.installing?.scriptURL ?? "").endsWith(SW_PATH))
      .map((r) => r.unregister()),
  );
}

export function registerServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (isBlockedContext()) {
    void unregisterAppWorkers();
    return;
  }
  void navigator.serviceWorker.register(SW_PATH, { scope: "/" }).catch(() => {
    /* offline support is optional */
  });
}

/* ---------------------------------------------------------------------------
 * Install prompt plumbing
 * `beforeinstallprompt` can fire before React mounts, so capture it here (this
 * module is imported from the root route) and let the UI subscribe afterwards.
 * ------------------------------------------------------------------------- */

export type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

let deferredPrompt: InstallEvent | null = null;
const listeners = new Set<(e: InstallEvent | null) => void>();

function emit() {
  listeners.forEach((fn) => fn(deferredPrompt));
}

export function initInstallCapture() {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as InstallEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    emit();
  });
}

export function getInstallPrompt(): InstallEvent | null {
  return deferredPrompt;
}

export function onInstallPromptChange(fn: (e: InstallEvent | null) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function clearInstallPrompt() {
  deferredPrompt = null;
  emit();
}

/** True when the app is already running as an installed app. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

/** iOS/iPadOS Safari never fires `beforeinstallprompt`; it needs manual steps. */
export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}
