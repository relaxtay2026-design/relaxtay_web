import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { imageUrl } from "@/lib/images";
import { formatMoney } from "@/lib/money";
import { parseDateOnly, todayUTC, formatDateRange } from "@/lib/dates";
import { quote } from "@/server/booking/quote";
import { isRangeAvailable } from "@/server/booking/availability";
import { Card, CardSection, Divider } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BookingForm } from "./booking-form";

export const metadata: Metadata = { title: "Complete your reservation" };

export default async function BookingPage({
  params,
  searchParams,
}: PageProps<"/booking/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;

  const property = await db.property.findUnique({
    where: { slug },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });
  if (!property || property.status !== "active") notFound();

  const checkIn =
    typeof sp.checkIn === "string" ? parseDateOnly(sp.checkIn) : null;
  const checkOut =
    typeof sp.checkOut === "string" ? parseDateOnly(sp.checkOut) : null;
  const guests =
    typeof sp.guests === "string" ? parseInt(sp.guests, 10) || 2 : 2;

  // Informational validation. Problems bounce back to the property page
  // as a small inline notice (?be=code) — never a full error page (impr. #3).
  function bounce(code: string): never {
    redirect(`/properties/${slug}?be=${code}#book`);
  }
  if (!checkIn || !checkOut) bounce("dates");
  if (checkIn! < todayUTC()) bounce("past");
  if (checkOut! <= checkIn!) bounce("order");
  if (quote(property, checkIn!, checkOut!).nights < property.minNights)
    bounce("min");
  if (!(await isRangeAvailable(property.id, checkIn!, checkOut!)))
    bounce("unavail");

  // Prefill for signed-in guests (impr. #5)
  const session = await auth();
  const profile = session?.user?.id
    ? await db.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, phone: true },
      })
    : null;

  const q = quote(property, checkIn!, checkOut!);
  const img = property.images[0];

  return (
    <main className="container-page py-12">
      <h1 className="type-display-md">Complete your reservation</h1>
      <p className="type-body-md text-muted mt-3">
        Review your details and send your request — we confirm personally.
      </p>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_380px]">
        <BookingForm
          slug={slug}
          checkIn={sp.checkIn as string}
          checkOut={sp.checkOut as string}
          guests={Math.min(Math.max(guests, 1), property.maxGuests)}
          maxGuests={property.maxGuests}
          prefill={{
            name: profile?.name ?? "",
            email: profile?.email ?? "",
            phone: profile?.phone ?? "",
          }}
        />

        {/* Summary card (mockup 5) */}
        <aside>
          <Card>
            {img && (
              <div className="relative aspect-[4/3] overflow-hidden rounded-t">
                <Image
                  src={imageUrl(img.src)}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 380px"
                  className="object-cover"
                />
              </div>
            )}
            <CardSection>
              <h2 className="type-headline-md">{property.title}</h2>
              <p className="type-body-md text-muted mt-1">
                {property.location}
              </p>
              <p className="type-body-md mt-4 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted" />
                {formatDateRange(checkIn, checkOut)}
              </p>
              <p className="type-label text-muted mt-1 pl-6">
                {q.nights} night{q.nights === 1 ? "" : "s"}
              </p>
              <Divider className="my-5" />
              {q.lines.map((line) => (
                <div key={line.label} className="flex justify-between">
                  <p className="type-body-md text-muted">
                    {formatMoney(q.nightlyPriceCents, q.currency)} ×{" "}
                    {line.label}
                  </p>
                  <p className="type-body-md">
                    {formatMoney(line.amountCents, q.currency)}
                  </p>
                </div>
              ))}
              <Divider className="my-5" />
              <div className="flex justify-between">
                <p className="type-body-md font-medium">
                  Total ({q.currency})
                </p>
                <p className="type-body-md font-medium">
                  {formatMoney(q.totalCents, q.currency)}
                </p>
              </div>
            </CardSection>
          </Card>
        </aside>
      </div>
    </main>
  );
}
