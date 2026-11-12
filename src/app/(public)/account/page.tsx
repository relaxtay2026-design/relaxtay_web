import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { nextUpcomingBooking } from "@/server/account/queries";
import { imageUrl } from "@/lib/images";
import { formatDateRange } from "@/lib/dates";
import { Card, CardSection } from "@/components/ui/card";
import { StatusChip, type ChipStatus } from "@/components/ui/status-chip";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WelcomeNote } from "./welcome-note";

export const metadata: Metadata = { title: "Your stays" };

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function AccountOverviewPage({
  searchParams,
}: PageProps<"/account">) {
  const session = await requireUser();
  const welcome = (await searchParams).welcome === "1";
  const next = await nextUpcomingBooking(
    session.user.id,
    session.user.email ?? ""
  );
  const firstName = (session.user.name ?? "there").split(" ")[0];

  return (
    <main>
      {welcome && <WelcomeNote />}
      <h1 className="type-display-md">
        {greeting()}, {firstName}.
      </h1>
      <p className="type-body-lg text-muted mt-4">
        {next
          ? "Your next stay is coming up."
          : "No upcoming stays — the collection is waiting."}
      </p>

      {next ? (
        <Card className="mt-10 max-w-2xl">
          {next.property.images[0] && (
            <div className="relative aspect-[16/9] overflow-hidden rounded-t">
              <Image
                src={imageUrl(next.property.images[0].src)}
                alt={next.property.images[0].alt}
                fill
                sizes="(max-width: 1024px) 100vw, 640px"
                className="object-cover"
              />
            </div>
          )}
          <CardSection>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="type-headline-lg">{next.property.title}</h2>
                <p className="type-body-md text-muted mt-1 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {next.property.location}
                </p>
              </div>
              <div className="text-right">
                <p className="type-label text-muted">
                  {formatDateRange(next.checkIn, next.checkOut)}
                </p>
                <p className="type-body-md mt-1">
                  {next.guestCount} guest{next.guestCount === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <StatusChip status={next.status as ChipStatus} />
              <Link
                href={`/account/bookings/${next.id}`}
                className={cn(buttonVariants({ size: "sm" }))}
              >
                View reservation
              </Link>
            </div>
          </CardSection>
        </Card>
      ) : (
        <Link
          href="/properties"
          className={cn(buttonVariants({ size: "lg" }), "mt-10")}
        >
          Explore stays
        </Link>
      )}

      <div className="mt-12">
        <Link
          href="/account/bookings"
          className="type-label underline underline-offset-4 hover:text-bronze"
        >
          View all stays
        </Link>
      </div>
    </main>
  );
}
