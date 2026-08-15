import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Management tables per Designs.md: high-density but clear,
 * horizontal 1px dividers ONLY (no vertical rules, no zebra),
 * header row in uppercase micro-labels, muted.
 */
function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full text-left", className)} {...props} />
    </div>
  );
}

function THead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-divider">{children}</thead>;
}

function TH({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("type-label text-muted px-4 py-3 font-medium", className)}
      {...props}
    />
  );
}

function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-divider">{children}</tbody>;
}

function TD({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("type-body-md px-4 py-4 align-middle", className)}
      {...props}
    />
  );
}

export { Table, THead, TH, TBody, TD };
