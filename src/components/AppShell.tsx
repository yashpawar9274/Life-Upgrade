import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

import { BottomNav } from "./BottomNav";
import { ThemeToggle } from "./ThemeToggle";

export function AppShell({
  title,
  subtitle,
  children,
  backTo,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  backTo?: string;
  action?: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto w-full max-w-md px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[calc(7.5rem+env(safe-area-inset-bottom))]">

        <header className="mb-5 flex items-start gap-3">
          {backTo ? (
            <Link
              to={backTo}
              aria-label="Go back"
              className="press mt-1 rounded-full border border-border bg-card p-2 text-foreground"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </Link>
          ) : null}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-semibold">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          <ThemeToggle />
          {action}
        </header>
        <main className="animate-rise space-y-4">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}

export function Card({
  children,
  className = "",
  ...rest
}: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`surface p-4 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between pt-1">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {children}
      </h2>
      {right}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface flex flex-col items-center gap-2 px-4 py-8 text-center">
      <p className="font-display text-base font-semibold">{title}</p>
      <p className="max-w-[16rem] text-sm text-muted-foreground">{hint}</p>
      {action}
    </div>
  );
}

export function Disclaimer({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
      {text}
    </p>
  );
}
