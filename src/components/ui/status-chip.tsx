import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Booking/status chips per the admin mockups:
 * sage = confirmed/success · amber/bronze = pending · muted red = cancelled.
 * Muted, organic tones — never saturated.
 */
const chipVariants = cva(
  "type-label inline-flex items-center gap-1.5 rounded-full px-3 py-1",
  {
    variants: {
      status: {
        pending: "bg-amber-container text-bronze-deep",
        confirmed: "bg-sage-container text-[#3d4a3e]",
        completed: "bg-surface-high text-muted",
        declined: "bg-error-container text-on-error-container",
        cancelled: "bg-error-container text-on-error-container",
        blocked: "bg-surface-high text-muted",
      },
    },
    defaultVariants: { status: "pending" },
  }
);

export type ChipStatus = NonNullable<
  VariantProps<typeof chipVariants>["status"]
>;

function StatusChip({
  status,
  className,
  children,
}: {
  status: ChipStatus;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span className={cn(chipVariants({ status }), className)}>
      {children ?? status}
    </span>
  );
}

export { StatusChip };
