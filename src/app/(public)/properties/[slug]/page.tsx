import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, Star } from "lucide-react";
import {
  getPropertyBySlug,
  listActiveSlugs,
} from "@/server/property/queries";
import { imageUrl } from "@/lib/images";
import { formatMoney } from "@/lib/money";
import { brand } from "@/lib/brand";
import { Gallery } from "@/components/public/gallery";
import { AmenityIcon } from "@/components/public/amenity-icon";
import { BookingCard } from "@/components/public/booking-card";
import { Divider } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await listActiveSlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/properties/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return {};
  const primary =
    property.images.find((i) => i.isPrimary) ?? property.images[0];
  return {
    title: `${property.title} — ${property.location}`,
    description: property.summary,
    alternates: { canonical: `/properties/${property.slug}` },
    openGraph: {
      title: `${property.title} — ${brand.name}`,
      description: property.summary,
      images: primary ? [{ url: imageUrl(primary.src) }] : [],
    },
  };
}

const stat = (n: number, singular: string) =>
  `${n} ${singular}${n === 1 ? "" : "s"}`;

export default async function PropertyPage({
  params,
}: PageProps<"/properties/[slug]">) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VacationRental",
    name: property.title,
    description: property.summary,
    image: property.images.map((i) => imageUrl(i.src)),
    address: { "@type": "PostalAddress", addressLocality: property.location },
    containsPlace: {
      "@type": "Accommodation",
      occupancy: { "@type": "QuantitativeValue", maxValue: property.maxGuests },
      numberOfBedrooms: property.bedrooms,
      numberOfBathroomsTotal: property.bathrooms,
    },
    ...(property.avgRating !== null && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: property.avgRating,
        reviewCount: property.reviewCount,
      },
    }),
  };

  return (
    <main className="container-page py-10 pb-28 md:pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Gallery
        images={property.images.map((i) => ({
          url: imageUrl(i.src),
          alt: i.alt,
        }))}
      />

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px]">
        <div>
          {/* Property information (PRD §13) */}
          <h1 className="type-display-md">{property.title}</h1>
          <p className="type-body-md text-muted mt-3 flex items-center gap-1.5">
            <MapPin className="h-4 w-4" /> {property.location}
          </p>
          <div className="type-body-md mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted">
            {property.avgRating !== null && (
              <>
                <span className="flex items-center gap-1.5 text-ink">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {property.avgRating.toFixed(2)}
                </span>
                <span>
                  · {stat(property.reviewCount, "review")} ·
                </span>
              </>
            )}
            <span>{stat(property.maxGuests, "guest")}</span>·
            <span>{stat(property.bedrooms, "bedroom")}</span>·
            <span>{stat(property.beds, "bed")}</span>·
            <span>{stat(property.bathrooms, "bathroom")}</span>
          </div>

          <Divider className="my-8" />

          {/* Description (PRD §14) */}
          <section>
            <h2 className="type-headline-md mb-4">About this stay</h2>
            <p className="type-body-lg">{property.summary}</p>
            <p className="type-body-md text-muted mt-4 whitespace-pre-line">
              {property.description}
            </p>
          </section>

          <Divider className="my-8" />

          {/* Amenities (PRD §15) */}
          <section>
            <h2 className="type-headline-md mb-6">Amenities</h2>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {property.amenities.map(({ amenity }) => (
                <li
                  key={amenity.id}
                  className="type-body-md flex items-center gap-3"
                >
                  <AmenityIcon
                    name={amenity.icon}
                    className="h-4.5 w-4.5 text-muted"
                  />
                  {amenity.name}
                </li>
              ))}
            </ul>
          </section>

          <Divider className="my-8" />

          {/* Location */}
          <section>
            <h2 className="type-headline-md mb-4">Location</h2>
            <p className="type-body-md text-muted">
              {property.location}. Exact address is shared with your booking
              confirmation.
            </p>
          </section>

          <Divider className="my-8" />

          {/* Reviews (PRD §46 — manager-curated) */}
          <section>
            <h2 className="type-headline-md mb-6">
              {property.reviewCount > 0
                ? `Guest reviews (${property.reviewCount})`
                : "Guest reviews"}
            </h2>
            {property.reviews.length === 0 ? (
              <p className="type-body-md text-muted">
                This property hasn&apos;t collected reviews yet.
              </p>
            ) : (
              <div className="space-y-8">
                {property.reviews.map((r) => (
                  <blockquote key={r.id}>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-0.5" aria-label={`${r.rating} stars`}>
                        {Array.from({ length: r.rating }, (_, i) => (
                          <Star
                            key={i}
                            className="h-3.5 w-3.5 fill-current text-bronze"
                          />
                        ))}
                      </div>
                      <span className="type-body-md font-medium">
                        {r.authorName}
                      </span>
                      {r.stayedMonth && (
                        <span className="type-body-md text-muted">
                          Stayed {r.stayedMonth}
                        </span>
                      )}
                    </div>
                    <p className="type-body-md text-muted mt-3 max-w-2xl">
                      “{r.body}”
                    </p>
                  </blockquote>
                ))}
              </div>
            )}
          </section>

          <Divider className="my-8" />

          {/* Policies (PRD §11) */}
          <section>
            <h2 className="type-headline-md mb-4">Good to know</h2>
            <ul className="type-body-md text-muted space-y-2">
              <li>Bookings are requests — we confirm personally, usually within a day.</li>
              <li>Minimum stay: {stat(property.minNights, "night")}.</li>
              <li>Maximum occupancy: {stat(property.maxGuests, "guest")}.</li>
              <li>Checkout day is not charged — only nights stayed.</li>
            </ul>
          </section>
        </div>

        {/* Sticky booking card, desktop (PRD §16) */}
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <BookingCard
              priceCents={property.priceCents}
              currency={property.currency}
              maxGuests={property.maxGuests}
              minNights={property.minNights}
            />
          </div>
        </aside>
      </div>

      {/* Mobile sticky bottom bar (PRD §61) — 1px top border, no shadow */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-ghost bg-ivory px-5 py-4 lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <p>
            <span className="font-display text-xl">
              {formatMoney(property.priceCents, property.currency)}
            </span>
            <span className="type-body-md text-muted"> / night</span>
          </p>
          <Button disabled>Request this stay</Button>
        </div>
      </div>
    </main>
  );
}
