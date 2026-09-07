import { Download, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { t } from "@/lib/i18n";
import {
  clearInstallPrompt,
  getInstallPrompt,
  isIos,
  isStandalone,
  onInstallPromptChange,
  type InstallEvent,
} from "@/lib/pwa";
import { useStore } from "@/lib/store";

const DISMISS_KEY = "life-upgrade-install-dismissed";

export function InstallPrompt() {
  const { state } = useStore();
  const lang = state.profile.language;
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const show = (e: InstallEvent | null) => {
      if (!e) return;
      setEvt(e);
      setOpen(true);
    };

    show(getInstallPrompt());
    const off = onInstallPromptChange(show);

    // iOS never fires the native prompt — offer manual steps after a beat.
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isIos()) {
      timer = setTimeout(() => {
        setIos(true);
        setOpen(true);
      }, 2500);
    }

    const onInstalled = () => setOpen(false);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      off();
      if (timer) clearTimeout(timer);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!open || (!evt && !ios)) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  };

  const install = async () => {
    if (!evt) return;
    try {
      await evt.prompt();
      await evt.userChoice;
    } finally {
      clearInstallPrompt();
      setOpen(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="surface animate-rise mx-auto flex max-w-md items-center gap-3 p-3 shadow-[var(--shadow-card)]">
        <img
          src="/icons/icon-192.png"
          alt="LIFE UPGRADE app icon"
          width={192}
          height={192}
          loading="lazy"
          className="h-12 w-12 shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold">{t(lang, "install.title")}</p>
          <p className="text-xs leading-snug text-muted-foreground">
            {ios ? t(lang, "install.ios") : t(lang, "install.body")}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          {ios ? (
            <span className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-semibold">
              <Share2 className="h-3.5 w-3.5" aria-hidden /> {t(lang, "install.share")}
            </span>
          ) : (
            <button
              onClick={install}
              className="press flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
            >
              <Download className="h-3.5 w-3.5" aria-hidden /> {t(lang, "install.cta")}
            </button>
          )}
          <button
            onClick={dismiss}
            aria-label={t(lang, "install.later")}
            className="press flex items-center justify-center gap-1 rounded-xl border border-border px-3 py-1.5 text-[11px] text-muted-foreground"
          >
            <X className="h-3 w-3" aria-hidden /> {t(lang, "install.later")}
          </button>
        </div>
      </div>
    </div>
  );
}
