import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Cards per Designs.md: NO shadows, NO background fill by default.
 * Depth comes from a 1px ghost border (ink @ 10%) or a tonal surface shift.
 */
function Card({
  className,
  tonal = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  /** true → subtle tonal fill instead of transparent */
  tonal?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded border border-border-ghost",
        tonal ? "bg-surface-low" : "bg-surface-lowest",
        className
      )}
      {...props}
    />
  );
}

function CardSection({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...props} />;
}

/** 1px divider matching the table divider tone. */
function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-0 border-t border-divider", className)} />;
}

export { Card, CardSection, Divider };
