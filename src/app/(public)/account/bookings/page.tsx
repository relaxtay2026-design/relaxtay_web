import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listUserBookings } from "@/server/account/queries";
import { imageUrl } from "@/lib/images";
import { formatMoney } from "@/lib/money";
import { formatDateRange, todayUTC } from "@/lib/dates";
import { Card, CardSection } from "@/components/ui/card";
import { StatusChip, type ChipStatus } from "@/components/ui/status-chip";
import { cn } from "@/lib/utils";
import { MarkSeen } from "../mark-seen";

export const metadata: Metadata = { title: "My stays" };

export default async function MyStaysPage({
  searchParams,
}: PageProps<"/account/bookings">) {
  const session = await requireUser();
  const sp = await searchParams;
  const tab = sp.tab === "past" ? "past" : "upcoming";

  const all = await listUserBookings(
    session.user.id,
    session.user.email ?? ""
  );
  const today = todayUTC();
  const bookings = all.filter((b) =>
    tab === "upcoming"
      ? b.checkOut >= today && !["cancelled", "declined"].includes(b.status)
      : b.checkOut < today || ["cancelled", "declined"].includes(b.status)
  );

  // Bookings with an update the guest hasn't seen: flagged here, and marked
  // seen once this list is on screen. Updates in the other tab are counted
  // on that tab so nothing is hidden.
  const isUpdated = (b: (typeof all)[number]) => b.guestUpdateAt !== null;
  const seenNow = bookings.filter(isUpdated).map((b) => b.id);
  const otherTabUpdates = all.filter(
    (b) => isUpdated(b) && !bookings.includes(b)
  ).length;

  return (
    <main>
      <MarkSeen ids={seenNow} />
      <h1 className="type-display-md">My stays</h1>

      <div className="mt-8 flex gap-8 border-b border-divider">
        {(["upcoming", "past"] as const).map((t) => (
          <Link
            key={t}
            href={t === "upcoming" ? "/account/bookings" : "/account/bookings?tab=past"}
            className={cn(
              "type-label -mb-px border-b-2 pb-3 transition-colors",
              tab === t
                ? "border-ink text-ink"
                : "border-transparent text-muted hover:text-ink"
            )}
          >
            {t === "upcoming" ? "Upcoming" : "Past"}
            {t !== tab && otherTabUpdates > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1.5 align-middle text-[11px] font-semibold leading-none tracking-normal text-white">
                {otherTabUpdates}
              </span>
            )}
          </Link>
        ))}
      </div>

      {bookings.length === 0 ? (
        <p className="type-body-md text-muted mt-12">
          {tab === "upcoming"
            ? "No upcoming stays yet."
            : "No past stays yet."}{" "}
          <Link href="/properties" className="underline underline-offset-4">
            Browse the collection
          </Link>
          .
        </p>
      ) : (
        <div className="mt-8 space-y-6">
          {bookings.map((b) => (
            <Card key={b.id}>
              <CardSection className="flex flex-col gap-6 sm:flex-row">
                {b.property.images[0] && (
                  <div className="relative aspect-[4/3] w-full flex-none overflow-hidden rounded sm:w-44">
                    <Image
                      src={imageUrl(b.property.images[0].src)}
                      alt={b.property.images[0].alt}
                      fill
                      sizes="(max-width: 640px) 100vw, 176px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="type-headline-md">{b.property.title}</h2>
                      <p className="type-body-md text-muted mt-0.5">
                        {formatDateRange(b.checkIn, b.checkOut)} ·{" "}
                        {b.guestCount} guest{b.guestCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isUpdated(b) && (
                        <span className="type-label rounded-full bg-error px-2 py-0.5 text-white">
                          Updated
                        </span>
                      )}
                      <StatusChip status={b.status as ChipStatus} />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="type-body-md">
                      <span className="font-medium">
                        {formatMoney(b.totalCents, b.currency)}
                      </span>
                      <span className="text-muted"> total · {b.code}</span>
                    </p>
                    <Link
                      href={`/account/bookings/${b.id}`}
                      className="type-label underline underline-offset-4 hover:text-bronze"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              </CardSection>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
