import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getUserBooking } from "@/server/account/queries";
import { brand } from "@/lib/brand";
import { imageUrl } from "@/lib/images";
import { formatMoney } from "@/lib/money";
import { formatDateRange, todayUTC } from "@/lib/dates";
import { Card, CardSection, Divider } from "@/components/ui/card";
import { StatusChip, type ChipStatus } from "@/components/ui/status-chip";
import { CancelRequestButton } from "./cancel-button";
import { MarkSeen } from "../../mark-seen";

export const metadata: Metadata = { title: "Booking details" };

export default async function BookingDetailPage({
  params,
}: PageProps<"/account/bookings/[id]">) {
  const session = await requireUser();
  const { id } = await params;
  const b = await getUserBooking(id, session.user.id, session.user.email ?? "");
  if (!b) notFound();

  const cancellable =
    ["pending", "confirmed"].includes(b.status) &&
    b.checkIn >= todayUTC() &&
    !b.cancellationRequestedAt;

  return (
    <main>
      {b.guestUpdateAt && <MarkSeen ids={[b.id]} />}
      <Link
        href="/account/bookings"
        className="type-label flex items-center gap-2 text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> My stays
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="type-display-md">{b.property.title}</h1>
          <p className="type-body-md text-muted mt-2 flex items-center gap-1.5">
            <MapPin className="h-4 w-4" /> {b.property.location}
          </p>
        </div>
        <StatusChip status={b.status as ChipStatus} />
      </div>

      {b.cancellationRequestedAt && b.status !== "cancelled" && (
        <p className="type-body-md mt-6 max-w-xl rounded border border-amber-container bg-amber-container/40 px-4 py-3 text-bronze-deep">
          You requested cancellation — we&apos;ll confirm by email once it&apos;s
          processed.
        </p>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          {b.property.images[0] && (
            <div className="relative aspect-[16/9] overflow-hidden rounded">
              <Image
                src={imageUrl(b.property.images[0].src)}
                alt={b.property.images[0].alt}
                fill
                sizes="(max-width: 1024px) 100vw, 640px"
                className="object-cover"
              />
            </div>
          )}

          <section className="mt-8">
            <h2 className="type-headline-md mb-4">Your stay</h2>
            <div className="space-y-2">
              <Row label="Dates" value={formatDateRange(b.checkIn, b.checkOut)} />
              <Row
                label="Guests"
                value={`${b.guestCount} guest${b.guestCount === 1 ? "" : "s"}`}
              />
              <Row label="Booking ID" value={b.code} />
              <Row
                label="Total"
                value={formatMoney(b.totalCents, b.currency)}
              />
            </div>
          </section>

          <Divider className="my-8" />

          <section>
            <h2 className="type-headline-md mb-4">Guest information</h2>
            <div className="space-y-2">
              <Row label="Name" value={b.guestName} />
              <Row label="Email" value={b.guestEmail} />
              <Row label="Phone" value={b.guestPhone} />
              {b.guestMessage && <Row label="Message" value={b.guestMessage} />}
            </div>
          </section>

          {cancellable && (
            <>
              <Divider className="my-8" />
              <CancelRequestButton bookingId={b.id} />
            </>
          )}
        </div>

        <aside>
          <Card tonal>
            <CardSection>
              <h2 className="type-headline-md">Need anything?</h2>
              <p className="type-body-md text-muted mt-3">
                Questions about this stay, arrival times, or special requests —
                write to us and mention {b.code}.
              </p>
              <a
                href={`mailto:${brand.email}?subject=${encodeURIComponent(`Booking ${b.code}`)}`}
                className="type-label mt-5 inline-block underline underline-offset-4 hover:text-bronze"
              >
                Contact host
              </a>
            </CardSection>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-4">
      <p className="type-label text-muted pt-0.5">{label}</p>
      <p className="type-body-md text-right">{value}</p>
    </div>
  );
}
