import { Link } from "@tanstack/react-router";
import { Home, CalendarCheck, TrendingUp, Sparkles, User } from "lucide-react";

const items = [
<<<<<<< HEAD
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/routine", label: "Routine", icon: CalendarCheck },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/coach", label: "AI Coach", icon: Sparkles },
=======
  { to: "/dashboard", label: "Today", icon: Home },
  { to: "/routine", label: "Journey", icon: CalendarCheck },
  { to: "/progress", label: "Insights", icon: TrendingUp },
  { to: "/coach", label: "Coach", icon: Sparkles },
>>>>>>> 1150359 (Life Upgrade V2 UI UX redesign)
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  return (
    <nav
      aria-label="Main navigation"
<<<<<<< HEAD
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-xl"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
=======
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <ul className="mx-auto flex max-w-lg items-end justify-between rounded-[1.7rem] border border-border/80 bg-card/95 px-2 py-2 shadow-[0_16px_45px_rgba(0,0,0,0.28)] backdrop-blur-xl">
>>>>>>> 1150359 (Life Upgrade V2 UI UX redesign)
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: true }}
<<<<<<< HEAD
              className="press flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium text-muted-foreground"
=======
              className="press flex flex-col items-center gap-1 rounded-xl py-1 text-[10px] font-semibold text-muted-foreground"
>>>>>>> 1150359 (Life Upgrade V2 UI UX redesign)
              activeProps={{ className: "text-primary" }}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={
                      isActive
<<<<<<< HEAD
                        ? "rounded-xl bg-primary/15 px-3 py-1 shadow-[var(--shadow-glow)]"
                        : "px-3 py-1"
=======
                        ? "rounded-2xl bg-primary px-3 py-2 text-primary-foreground shadow-[var(--shadow-glow)]"
                        : "px-3 py-2"
>>>>>>> 1150359 (Life Upgrade V2 UI UX redesign)
                    }
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  {label}
                </>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
