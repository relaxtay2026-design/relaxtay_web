"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUserRound, LayoutDashboard, LogOut, Luggage, User } from "lucide-react";
import { signOutAction } from "@/app/(public)/account/actions";
import { cn } from "@/lib/utils";
import { countLabel, useGuestUpdates } from "@/components/public/use-guest-updates";

type SessionUser = { name: string; email: string; isManager: boolean };

/** undefined = not known yet, null = signed out. */
type SessionState = SessionUser | null | undefined;

async function fetchSessionUser(): Promise<SessionUser | null> {
  try {
    const res = await fetch("/api/auth/session", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      user?: { id?: string; name?: string; email?: string; role?: string };
    } | null;
    if (!data?.user?.id) return null;
    return {
      name: data.user.name ?? "",
      email: data.user.email ?? "",
      isManager: data.user.role === "manager",
    };
  } catch {
    return null;
  }
}

/**
 * Signed-in clarity (impr. #4): an avatar with your initial that opens a
 * small menu — you always know whether (and as whom) you're signed in.
 *
 * The session is read here in the browser, not on the server, so the pages
 * around this header stay cacheable. Signed-out visitors cost one small
 * request per visit; for signed-in guests it is re-checked on navigation
 * so a changed name or an ended session shows up.
 */
export function ProfileMenu() {
  const [session, setSession] = React.useState<SessionState>(undefined);
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const signedInRef = React.useRef(false);
  const loadedRef = React.useRef(false);
  // This header outlives the navigation that follows sign-out (and there is
  // no navigation at all when signing out on the home page), so the end of
  // the sign-out transition is what triggers the re-check below.
  const [signingOut, startSignOut] = React.useTransition();

  React.useEffect(() => {
    // First load always; afterwards only signed-in sessions are re-checked.
    if (signingOut) return;
    if (loadedRef.current && !signedInRef.current) return;
    let cancelled = false;
    fetchSessionUser().then((user) => {
      if (cancelled) return;
      loadedRef.current = true;
      signedInRef.current = user !== null;
      setSession(user);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname, signingOut]);

  const updates = useGuestUpdates(Boolean(session));

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

  if (session === undefined) {
    // Same footprint as the avatar, so nothing shifts when the answer lands.
    return <span aria-hidden className="block h-9 w-9" />;
  }

  if (session === null) {
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

  const { name, email, isManager } = session;
  const initial = (name || email || "?").trim().charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`Account menu — signed in as ${name}${updates > 0 ? ` — ${countLabel(updates)}` : ""}`}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-full bg-ink font-display text-lg text-ivory transition-opacity hover:opacity-85",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze"
        )}
      >
        {initial}
        {updates > 0 && (
          <span
            aria-hidden
            className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-ivory bg-error px-1 font-sans text-[11px] font-semibold leading-none text-white"
          >
            {updates}
          </span>
        )}
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
              {updates > 0 && <RedCount n={updates} />}
            </MenuLink>
            <MenuLink
              href="/account/profile"
              icon={<User className="h-4 w-4" strokeWidth={1.5} />}
              onNavigate={() => setOpen(false)}
            >
              Profile
            </MenuLink>
          </nav>
          <form
            action={() => startSignOut(() => signOutAction())}
            className="border-t border-divider py-1.5"
          >
            <button
              type="submit"
              disabled={signingOut}
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

function RedCount({ n }: { n: number }) {
  return (
    <span
      className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1.5 text-[11px] font-semibold leading-none text-white"
      title={countLabel(n)}
    >
      {n}
    </span>
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
