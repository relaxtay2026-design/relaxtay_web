"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * Number of the signed-in guest's bookings with an unseen update. Re-read
 * on navigation, when the tab regains focus, and right after the guest has
 * seen an update (the "guest-updates-changed" event from MarkSeen).
 * Pass enabled=false while the visitor is not known to be signed in.
 */
export function useGuestUpdates(enabled: boolean, initial = 0): number {
  const [count, setCount] = React.useState(initial);
  const pathname = usePathname();

  React.useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/account/updates", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { count?: number };
        if (!cancelled) setCount(data.count ?? 0);
      } catch {
        // Keep the last known count.
      }
    };
    load();
    window.addEventListener("focus", load);
    window.addEventListener("guest-updates-changed", load);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", load);
      window.removeEventListener("guest-updates-changed", load);
    };
  }, [enabled, pathname]);

  return enabled ? count : 0;
}

/** Small red count, as on the manager's sidebar. */
export function countLabel(n: number): string {
  return `${n} booking update${n === 1 ? "" : "s"}`;
}
