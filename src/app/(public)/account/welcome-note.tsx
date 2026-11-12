"use client";

import * as React from "react";
import { PartyPopper, X } from "lucide-react";
import { brand } from "@/lib/brand";

/**
 * Shown once, right after an account is created. Removes ?welcome from the
 * address so a reload or a shared link doesn't show it again.
 */
export function WelcomeNote() {
  const [open, setOpen] = React.useState(true);

  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("welcome")) return;
    url.searchParams.delete("welcome");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, []);

  if (!open) return null;
  return (
    <div
      role="status"
      className="mb-8 flex items-start gap-3 rounded border border-sage/40 bg-surface-low px-4 py-3"
    >
      <PartyPopper className="mt-0.5 h-5 w-5 flex-none text-sage" strokeWidth={1.5} />
      <p className="type-body-md flex-1">
        <span className="font-medium">Your account is ready.</span> Welcome to{" "}
        {brand.name} — your stays and requests will appear here.
      </p>
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Dismiss"
        className="text-muted transition-colors hover:text-ink"
      >
        <X className="h-4 w-4" strokeWidth={1.5} />
      </button>
    </div>
  );
}
