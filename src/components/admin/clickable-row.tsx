"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Whole-row navigation for admin tables. Clicks that land on interactive
 * children (buttons, links, forms) or that are text selections do NOT
 * navigate; cmd/ctrl-click opens a new tab. Keyboard/screen-reader users
 * keep the real links inside the row.
 */
export function ClickableRow({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  function onClick(e: React.MouseEvent<HTMLTableRowElement>) {
    const target = e.target as HTMLElement;
    if (target.closest("a, button, input, select, textarea, label, form"))
      return;
    if (window.getSelection()?.toString()) return;
    if (e.metaKey || e.ctrlKey) {
      window.open(href, "_blank");
      return;
    }
    router.push(href);
  }

  return (
    <tr
      onClick={onClick}
      className={cn(
        "cursor-pointer transition-colors hover:bg-surface-low",
        className
      )}
    >
      {children}
    </tr>
  );
}
