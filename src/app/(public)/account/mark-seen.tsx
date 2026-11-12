"use client";

import * as React from "react";
import { markUpdatesSeenAction } from "./actions";

/**
 * Marks the given bookings' updates as seen once they are actually on the
 * guest's screen (not on a prefetch), then tells the header and sidebar to
 * refresh their counts.
 */
export function MarkSeen({ ids }: { ids: string[] }) {
  const key = ids.join(",");
  React.useEffect(() => {
    if (!key) return;
    let cancelled = false;
    markUpdatesSeenAction(key.split(",")).then(() => {
      if (!cancelled) window.dispatchEvent(new Event("guest-updates-changed"));
    });
    return () => {
      cancelled = true;
    };
  }, [key]);
  return null;
}
