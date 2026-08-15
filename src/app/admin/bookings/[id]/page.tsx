import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAdminBooking } from "@/server/admin/queries";
import { formatMoney } from "@/lib/money";
import { formatDateRange } from "@/lib/dates";
import { Card, CardSection, Divider } from "@/components/ui/card";
import { StatusChip, type ChipStatus } from "@/components/ui/status-chip";
import { TransitionButtons } from "./transition-buttons";

export const metadata: Metadata = { title: "Admin — Booking" };

export default async function AdminBookingDetailPage({
  params,
}: PageProps<"/admin/bookings/[id]">) {
  const { id } = await params;
  const b = await getAdminBooking(id);
  if (!b) notFound();

  return (
    <main className="max-w-3xl">
      <Link
        href="/admin/bookings"
        className="type-label flex items-center gap-2 text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Bookings
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="type-display-md">{b.code}</h1>
          <p className="type-body-md text-muted mt-2">
            {b.property.title} · {b.property.location}
          </p>
        </div>
        <StatusChip status={b.status as ChipStatus} />
      </div>

      {b.cancellationRequestedAt &&
        !["cancelled", "declined"].includes(b.status) && (
          <p className="type-body-md mt-6 rounded border border-error/30 bg-error-container/40 px-4 py-3 text-on-error-container">
            The guest requested cancellation on{" "}
            {b.cancellationRequestedAt.toLocaleDateString("en-CA")} — use
            “Cancel booking” below to execute it.
          </p>
        )}

      <Card className="mt-8">
        <CardSection>
          <h2 className="type-headline-md mb-5">Stay</h2>
          <div className="grid gap-x-10 gap-y-2 sm:grid-cols-2">
            <Row label="Dates" value={formatDateRange(b.checkIn, b.checkOut)} />
            <Row label="Guests" value={String(b.guestCount)} />
            <Row
              label="Nightly rate"
              value={formatMoney(b.nightlyPriceCents, b.currency)}
            />
            <Row label="Total" value={formatMoney(b.totalCents, b.currency)} />
            <Row
              label="Created"
              value={b.createdAt.toLocaleString("en-CA", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            />
            <Row
              label="Updated"
              value={b.updatedAt.toLocaleString("en-CA", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            />
          </div>

          <Divider className="my-6" />

          <h2 className="type-headline-md mb-5">Guest</h2>
          <div className="grid gap-x-10 gap-y-2 sm:grid-cols-2">
            <Row label="Name" value={b.guestName} />
            <Row
              label="Account"
              value={b.user ? b.user.accountStatus : "no profile"}
            />
            <Row label="Email" value={b.guestEmail} />
            <Row label="Phone" value={b.guestPhone} />
          </div>
          {b.guestMessage && (
            <p className="type-body-md text-muted mt-4 rounded bg-surface-low px-4 py-3">
              “{b.guestMessage}”
            </p>
          )}
          {b.statusNote && (
            <p className="type-body-md mt-4">
              <span className="type-label text-muted">Status note: </span>
              {b.statusNote}
            </p>
          )}
        </CardSection>
      </Card>

      <div className="mt-8">
        <TransitionButtons bookingId={b.id} status={b.status} />
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 sm:justify-start sm:gap-3">
      <p className="type-label text-muted w-28 flex-none pt-0.5">{label}</p>
      <p className="type-body-md">{value}</p>
    </div>
  );
}
