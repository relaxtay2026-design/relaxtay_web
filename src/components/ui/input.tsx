import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Inputs per Designs.md: understated 1px border (#D1D1D1), 4px radius,
 * bronze border on focus. No shadows, no heavy chrome.
 */
function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "type-body-md h-11 w-full rounded border border-border-input bg-surface-lowest px-4 text-ink placeholder:text-muted/70",
        "focus:border-bronze focus:outline-none focus:ring-1 focus:ring-bronze",
        "disabled:cursor-not-allowed disabled:bg-surface-low disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}

function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "type-body-md min-h-28 w-full rounded border border-border-input bg-surface-lowest px-4 py-3 text-ink placeholder:text-muted/70",
        "focus:border-bronze focus:outline-none focus:ring-1 focus:ring-bronze",
        "disabled:cursor-not-allowed disabled:bg-surface-low disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}

export { Input, Textarea };
