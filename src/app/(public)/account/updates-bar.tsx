import Link from "next/link";
import { BellRing } from "lucide-react";
import { formatDateRange } from "@/lib/dates";

type Update = {
  id: string;
  status: string;
  checkIn: Date;
  checkOut: Date;
  property: { title: string };
};

const OUTCOME: Record<string, string> = {
  confirmed: "is confirmed",
  declined: "was declined",
  cancelled: "was cancelled",
  completed: "is complete",
  pending: "is waiting for our reply",
};

/**
 * The guest's "something changed" bar: one line per booking whose status
 * the host changed since the guest last looked. A line goes away once the
 * guest opens that booking or My stays.
 */
export function UpdatesBar({ updates }: { updates: Update[] }) {
  if (updates.length === 0) return null;
  return (
    <div
      role="status"
      className="mb-10 flex flex-wrap items-start gap-x-5 gap-y-3 rounded border border-error/30 bg-error-container/40 px-5 py-4"
    >
      <BellRing className="mt-0.5 h-5 w-5 flex-none text-error" strokeWidth={1.5} />
      <div className="min-w-0 flex-1">
        <p className="type-body-md font-medium text-on-error-container">
          {updates.length === 1
            ? "Update on your booking"
            : `${updates.length} updates on your bookings`}
        </p>
        <ul className="type-body-md mt-1 space-y-1 text-on-error-container">
          {updates.map((u) => (
            <li key={u.id}>
              Your stay at {u.property.title},{" "}
              {formatDateRange(u.checkIn, u.checkOut)},{" "}
              {OUTCOME[u.status] ?? `is now ${u.status}`}.{" "}
              <Link
                href={`/account/bookings/${u.id}`}
                className="underline underline-offset-4"
              >
                View
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
