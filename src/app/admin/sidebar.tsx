"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CalendarRange,
  Home,
  LayoutDashboard,
  Settings,
  Star,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { AttentionCounts } from "@/server/admin/queries";

/** How often the "waiting on you" count is re-checked while a page is open. */
const REFRESH_MS = 60_000;

/**
 * The number of things waiting on the manager. Starts from what the server
 * rendered, then re-checks on every navigation, when the tab regains focus
 * and once a minute, so a request that arrives while the dashboard is open
 * shows up without a reload.
 */
function useAttention(initial: AttentionCounts): AttentionCounts {
  const [counts, setCounts] = React.useState(initial);
  const pathname = usePathname();

  // A fresh server render (after approving, declining, …) is the truth:
  // adopt it as soon as it differs from the one this state started from.
  const [seen, setSeen] = React.useState(initial);
  if (
    seen.requests !== initial.requests ||
    seen.cancellations !== initial.cancellations
  ) {
    setSeen(initial);
    setCounts(initial);
  }

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/admin/attention", { cache: "no-store" });
        if (!res.ok) return;
        const next = (await res.json()) as AttentionCounts;
        if (!cancelled) setCounts(next);
      } catch {
        // Offline or mid-deploy: keep showing the last known count.
      }
    };
    load();
    const timer = setInterval(load, REFRESH_MS);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [pathname]);

  return counts;
}

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/properties", label: "Properties", icon: Home },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/admin/availability", label: "Availability", icon: CalendarRange },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function attentionLabel(a: AttentionCounts): string {
  const parts: string[] = [];
  if (a.requests > 0)
    parts.push(`${a.requests} booking request${a.requests === 1 ? "" : "s"}`);
  if (a.cancellations > 0)
    parts.push(
      `${a.cancellations} cancellation request${a.cancellations === 1 ? "" : "s"}`
    );
  return `${parts.join(" and ")} waiting for you`;
}

export function AdminSidebar({
  signOutSlot,
  attention: initialAttention,
}: {
  signOutSlot: React.ReactNode;
  attention: AttentionCounts;
}) {
  const pathname = usePathname();
  const attention = useAttention(initialAttention);
  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "type-label flex items-center gap-3 border-r-2 px-4 py-3 transition-colors",
                active
                  ? "border-ink bg-surface-high text-ink"
                  : "border-transparent text-muted hover:text-ink"
              )}
            >
              <item.icon className="h-4 w-4" strokeWidth={1.5} />
              {item.label}
              {item.href === "/admin/bookings" && attention.total > 0 && (
                <span
                  className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1.5 text-[11px] font-semibold leading-none tracking-normal text-white"
                  title={attentionLabel(attention)}
                >
                  <span aria-hidden>{attention.total}</span>
                  <span className="sr-only">{attentionLabel(attention)}</span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-3 border-t border-divider p-4">
        <Link
          href="/admin/properties/new"
          className={cn(buttonVariants({ size: "sm" }), "w-full")}
        >
          + Add property
        </Link>
        {signOutSlot}
      </div>
    </div>
  );
}
