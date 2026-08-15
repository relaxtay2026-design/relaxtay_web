import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, Clock } from "lucide-react";
import { db } from "@/lib/db";
import { imageUrl } from "@/lib/images";
import { formatMoney } from "@/lib/money";
import { formatDateRange } from "@/lib/dates";
import { Card, CardSection, Divider } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Reservation request received" };

/**
 * Post-booking page (PRD D2): "request received", NOT "confirmed" —
 * confirmation arrives by email after the manager accepts.
 * Booking ids are unguessable cuids; the page shows no more than the
 * booker already entered (PRD §11 security).
 */
export default async function ConfirmationPage({
  params,
}: PageProps<"/booking/confirmation/[id]">) {
  const { id } = await params;
  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      property: {
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      },
    },
  });
  if (!booking) notFound();

  const img = booking.property.images[0];
  const pending = booking.status === "pending";

  return (
    <main className="container-page flex flex-col items-center py-16">
      {pending ? (
        <Clock className="h-10 w-10 text-bronze" strokeWidth={1.25} />
      ) : (
        <CircleCheck className="h-10 w-10 text-sage" strokeWidth={1.25} />
      )}
      <h1 className="type-display-md mt-6 text-center">
        {pending ? "Request received." : "You're all set."}
      </h1>
      <p className="type-body-lg text-muted mt-4 max-w-xl text-center">
        {pending
          ? `Thank you, ${booking.guestName.split(" ")[0]}. We've emailed a copy to ${booking.guestEmail} and will confirm your stay personally — usually within a day.`
          : `Your stay is confirmed. A confirmation has been sent to ${booking.guestEmail}.`}
      </p>

      <Card className="mt-12 w-full max-w-md">
        {img && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-t">
            <Image
              src={imageUrl(img.src)}
              alt={img.alt}
              fill
              sizes="(max-width: 640px) 100vw, 448px"
              className="object-cover"
            />
          </div>
        )}
        <CardSection>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="type-headline-md">{booking.property.title}</h2>
              <p className="type-body-md text-muted mt-1">
                {booking.property.location}
              </p>
            </div>
            <StatusChip status={booking.status === "pending" ? "pending" : "confirmed"} />
          </div>
          <Divider className="my-5" />
          <div className="space-y-2">
            <Row
              label="Dates"
              value={formatDateRange(booking.checkIn, booking.checkOut)}
            />
            <Row
              label="Guests"
              value={`${booking.guestCount} guest${booking.guestCount === 1 ? "" : "s"}`}
            />
            <Row
              label="Total"
              value={formatMoney(booking.totalCents, booking.currency)}
            />
            <Row label="Booking ID" value={booking.code} />
          </div>
        </CardSection>
      </Card>

      <Link
        href="/properties"
        className={cn(buttonVariants({ variant: "tertiary" }), "mt-10")}
      >
        Browse more stays
      </Link>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6">
      <p className="type-label text-muted pt-0.5">{label}</p>
      <p className="type-body-md text-right">{value}</p>
    </div>
  );
}
