"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Heart,
  LayoutDashboard,
  Luggage,
  Settings,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/account/bookings", label: "My stays", icon: Luggage },
  { href: null, label: "Saved stays", icon: Heart }, // future (PRD §29)
  { href: "/account/profile", label: "Profile", icon: User },
  { href: "/account/settings", label: "Settings", icon: Settings },
] as const;

export function AccountSidebar({ signOutSlot }: { signOutSlot: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const exact = "exact" in item && item.exact;
        const active =
          item.href &&
          (exact ? pathname === item.href : pathname.startsWith(item.href));
        if (!item.href) {
          return (
            <span
              key={item.label}
              className="type-body-md flex cursor-not-allowed items-center gap-3 px-3 py-2.5 text-muted/50"
              title="Coming soon"
            >
              <item.icon className="h-4 w-4" strokeWidth={1.5} />
              {item.label}
              <span className="type-label ml-auto text-muted/50">Soon</span>
            </span>
          );
        }
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "type-body-md flex items-center gap-3 border-l-2 px-3 py-2.5 transition-colors",
              active
                ? "border-ink font-medium text-ink"
                : "border-transparent text-muted hover:text-ink"
            )}
          >
            <item.icon className="h-4 w-4" strokeWidth={1.5} />
            {item.label}
          </Link>
        );
      })}
      <div className="mt-4 border-t border-divider pt-4">{signOutSlot}</div>
    </nav>
  );
}
