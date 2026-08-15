import type { Metadata } from "next";
import Link from "next/link";
import {
  listAdminBookings,
  listAdminProperties,
  type AdminBookingTab,
} from "@/server/admin/queries";
import { formatMoney } from "@/lib/money";
import { formatDateRange } from "@/lib/dates";
import { Card, CardSection } from "@/components/ui/card";
import { StatusChip, type ChipStatus } from "@/components/ui/status-chip";
import { Table, THead, TH, TBody, TD } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin — Bookings" };

const TABS: AdminBookingTab[] = [
  "all",
  "pending",
  "confirmed",
  "upcoming",
  "completed",
  "cancelled",
];

export default async function AdminBookingsPage({
  searchParams,
}: PageProps<"/admin/bookings">) {
  const sp = await searchParams;
  const tab = (
    TABS.includes(sp.tab as AdminBookingTab) ? sp.tab : "all"
  ) as AdminBookingTab;
  const propertyId =
    typeof sp.property === "string" && sp.property !== ""
      ? sp.property
      : undefined;

  const [bookings, properties] = await Promise.all([
    listAdminBookings(tab, propertyId),
    listAdminProperties(),
  ]);

  const href = (t: AdminBookingTab, p?: string) =>
    `/admin/bookings?tab=${t}${p ? `&property=${p}` : ""}`;

  return (
    <main>
      <h1 className="type-display-md">Bookings</h1>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-divider">
        <div className="flex gap-6 overflow-x-auto">
          {TABS.map((t) => (
            <Link
              key={t}
              href={href(t, propertyId)}
              className={cn(
                "type-label -mb-px whitespace-nowrap border-b-2 pb-3 capitalize transition-colors",
                tab === t
                  ? "border-ink text-ink"
                  : "border-transparent text-muted hover:text-ink"
              )}
            >
              {t}
            </Link>
          ))}
        </div>
        <form className="pb-2">
          <input type="hidden" name="tab" value={tab} />
          <select
            name="property"
            defaultValue={propertyId ?? ""}
            className="type-label h-9 rounded border border-border-input bg-surface-lowest px-2"
          >
            <option value="">All properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="type-label ml-2 underline underline-offset-4"
          >
            Filter
          </button>
        </form>
      </div>

      <Card className="mt-8">
        {bookings.length === 0 ? (
          <CardSection>
            <p className="type-body-md text-muted">
              No bookings in this view.
            </p>
          </CardSection>
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Ref</TH>
                <TH>Guest</TH>
                <TH>Property</TH>
                <TH>Dates</TH>
                <TH>Guests</TH>
                <TH>Status</TH>
                <TH className="text-right">Total</TH>
              </tr>
            </THead>
            <TBody>
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-surface-low">
                  <TD>
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="font-medium hover:underline"
                    >
                      {b.code}
                    </Link>
                  </TD>
                  <TD>{b.guestName}</TD>
                  <TD>{b.property.title}</TD>
                  <TD className="text-muted">
                    {formatDateRange(b.checkIn, b.checkOut)}
                  </TD>
                  <TD>{b.guestCount}</TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <StatusChip status={b.status as ChipStatus} />
                      {b.cancellationRequestedAt &&
                        !["cancelled", "declined"].includes(b.status) && (
                          <span className="type-label text-error">
                            cancel req.
                          </span>
                        )}
                    </div>
                  </TD>
                  <TD className="text-right">
                    {formatMoney(b.totalCents, b.currency)}
                  </TD>
                </tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </main>
  );
}
