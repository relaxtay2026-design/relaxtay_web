import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Field labels per Designs.md: small, uppercase, generously tracked,
 * placed above the input. ("CHECK-IN", "FIRST NAME", …)
 */
function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("type-label block text-muted mb-2", className)}
      {...props}
    />
  );
}

/** Grouping wrapper: label + control with consistent rhythm. */
function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

export { Label, Field };
