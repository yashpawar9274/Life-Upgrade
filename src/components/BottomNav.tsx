import { Link } from "@tanstack/react-router";
import { Home, CalendarCheck, TrendingUp, Sparkles, User } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/routine", label: "Routine", icon: CalendarCheck },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/coach", label: "AI Coach", icon: Sparkles },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-xl"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="press flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium text-muted-foreground"
              activeProps={{ className: "text-primary" }}
            >
              {({ isActive }) => (
                <>
                  <span
                    className={
                      isActive
                        ? "rounded-xl bg-primary/15 px-3 py-1 shadow-[var(--shadow-glow)]"
                        : "px-3 py-1"
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
