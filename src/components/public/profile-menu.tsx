"use client";

import * as React from "react";
import Link from "next/link";
import { CircleUserRound, LayoutDashboard, LogOut, Luggage, User } from "lucide-react";
import { signOutAction } from "@/app/(public)/account/actions";
import { cn } from "@/lib/utils";

/**
 * Signed-in clarity (impr. #4): an avatar with your initial that opens a
 * small menu — you always know whether (and as whom) you're signed in.
 */
export function ProfileMenu({
  signedIn,
  name,
  email,
  isManager,
}: {
  signedIn: boolean;
  name: string;
  email: string;
  isManager: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (!signedIn) {
    return (
      <Link
        href="/login"
        className="type-label flex items-center gap-2 text-muted transition-colors hover:text-ink"
        title="Sign in"
      >
        <CircleUserRound className="h-6 w-6" strokeWidth={1.25} />
        <span className="hidden sm:inline">Sign in</span>
      </Link>
    );
  }

  const initial = (name || email || "?").trim().charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`Account menu — signed in as ${name}`}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full bg-ink font-display text-lg text-ivory transition-opacity hover:opacity-85",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze"
        )}
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-64 rounded border border-border-ghost bg-surface-lowest">
          <div className="border-b border-divider px-4 py-3">
            <p className="type-body-md font-medium">{name}</p>
            <p className="type-label text-muted mt-0.5 truncate normal-case">
              {email}
            </p>
          </div>
          <nav className="py-1.5">
            {isManager && (
              <MenuLink
                href="/admin"
                icon={<LayoutDashboard className="h-4 w-4" strokeWidth={1.5} />}
                onNavigate={() => setOpen(false)}
              >
                Manager dashboard
              </MenuLink>
            )}
            <MenuLink
              href="/account/bookings"
              icon={<Luggage className="h-4 w-4" strokeWidth={1.5} />}
              onNavigate={() => setOpen(false)}
            >
              My stays
            </MenuLink>
            <MenuLink
              href="/account/profile"
              icon={<User className="h-4 w-4" strokeWidth={1.5} />}
              onNavigate={() => setOpen(false)}
            >
              Profile
            </MenuLink>
          </nav>
          <form action={signOutAction} className="border-t border-divider py-1.5">
            <button
              type="submit"
              className="type-body-md flex w-full items-center gap-3 px-4 py-2 text-muted transition-colors hover:bg-surface-low hover:text-ink"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  onNavigate,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="type-body-md flex items-center gap-3 px-4 py-2 transition-colors hover:bg-surface-low"
    >
      <span className="text-muted">{icon}</span>
      {children}
    </Link>
  );
}
