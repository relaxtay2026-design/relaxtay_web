"use client";

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

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/properties", label: "Properties", icon: Home },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/admin/availability", label: "Availability", icon: CalendarRange },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({ signOutSlot }: { signOutSlot: React.ReactNode }) {
  const pathname = usePathname();
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
