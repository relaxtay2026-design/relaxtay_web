import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { brand } from "@/lib/brand";
import { imageUrl } from "@/lib/images";
import { formatMoney } from "@/lib/money";
import { listActiveProperties } from "@/server/property/queries";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { SearchBar } from "@/components/public/search-bar";
import { cn } from "@/lib/utils";

export const revalidate = 3600;

/**
 * Curated brand hero — deliberately independent of property data so the
 * homepage doesn't change when photos are reordered. Swap for the real
 * signature photograph when brand photography lands.
 */
const HERO = {
  url: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=2400&auto=format&fit=crop",
  alt: "A timber boathouse on a turquoise alpine lake beneath mountain peaks",
};

const whyDirect = [
  {
    title: "Direct with the host",
    body: "No call centers, no intermediaries. Questions land with the people who hold the keys.",
  },
  {
    title: "Simple, honest booking",
    body: "The price you see is the price. Request your dates and we confirm personally.",
  },
  {
    title: "Personal hospitality",
    body: "Eight properties, kept small on purpose — every stay is prepared like a guest room, not a unit.",
  },
];

export default async function HomePage() {
  const properties = await listActiveProperties();
  const featured = properties.slice(0, 3);
  // Manager-curated strip (impr. #6); falls back to recent 5★ if none featured
  let reviews = await db.review.findMany({
    where: { isPublished: true, isFeatured: true },
    include: { property: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 12,
  });
  if (reviews.length === 0) {
    reviews = await db.review.findMany({
      where: { isPublished: true, rating: 5 },
      include: { property: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
  }

  return (
    <main>
      {/* Hero */}
      <section className="relative flex min-h-[85vh] items-end">
        <Image
          src={HERO.url}
          alt={HERO.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/10 to-transparent" />
        <div className="container-page relative pb-24 text-ivory">
          <p className="type-label mb-4 text-ivory/80">{brand.legalName}</p>
          <h1 className="type-display-lg max-w-3xl">
            Stay somewhere worth remembering.
          </h1>
          <p className="type-body-lg mt-6 max-w-xl text-ivory/90">
            {brand.description}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/properties"
              className={cn(buttonVariants({ size: "lg" }), "bg-ivory text-ink hover:bg-ivory/85")}
            >
              Explore stays
            </Link>
            <Link
              href="/properties"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-ivory text-ivory hover:bg-ivory hover:text-ink"
              )}
            >
              Check availability
            </Link>
          </div>
        </div>
      </section>

      {/* Search bar — floats up over the hero so it's in the first viewport */}
      <section className="container-page relative z-10 -mt-14 pb-4">
        <SearchBar
          properties={properties.map((p) => ({
            slug: p.slug,
            title: p.title,
            maxGuests: p.maxGuests,
          }))}
        />
      </section>

      {/* Featured stays — editorial alternating layout */}
      <section className="container-page py-20">
        <p className="type-label text-bronze mb-3">The collection</p>
        <h2 className="type-display-md mb-16">Featured stays</h2>
        <div className="space-y-24">
          {featured.map((p, i) => {
            const img = p.images.find((im) => im.isPrimary) ?? p.images[0];
            return (
              <article
                key={p.id}
                className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
              >
                <Link
                  href={`/properties/${p.slug}`}
                  className={cn(
                    "group relative block aspect-[4/3] overflow-hidden rounded",
                    i % 2 === 1 && "lg:order-2"
                  )}
                >
                  {img && (
                    <Image
                      src={imageUrl(img.src)}
                      alt={img.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  )}
                </Link>
                <div className={cn(i % 2 === 1 && "lg:order-1")}>
                  <p className="type-label text-muted">{p.location}</p>
                  <h3 className="type-headline-lg mt-3">{p.title}</h3>
                  {p.avgRating !== null && (
                    <p className="type-body-md text-muted mt-3 flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-current text-ink" />
                      <span className="text-ink">{p.avgRating.toFixed(2)}</span>
                      · {p.reviewCount} review{p.reviewCount === 1 ? "" : "s"}
                    </p>
                  )}
                  <p className="type-body-lg mt-4 max-w-lg">{p.summary}</p>
                  <p className="type-body-md mt-4">
                    From{" "}
                    <span className="font-medium">
                      {formatMoney(p.priceCents, p.currency)}
                    </span>
                    <span className="text-muted"> / night</span>
                  </p>
                  <Link
                    href={`/properties/${p.slug}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "md" }),
                      "mt-8"
                    )}
                  >
                    View property
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Why book direct */}
      <section className="bg-surface-low py-24">
        <div className="container-page">
          <p className="type-label text-bronze mb-3">Why book direct</p>
          <h2 className="type-display-md mb-16 max-w-2xl">
            A better way to stay
          </h2>
          <div className="grid gap-12 md:grid-cols-3">
            {whyDirect.map((item) => (
              <div key={item.title}>
                <h3 className="type-headline-md">{item.title}</h3>
                <p className="type-body-md text-muted mt-3">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials — slow auto-scroll loop, pauses on hover (impr. #6) */}
      {reviews.length > 0 && (
        <section className="py-24">
          <div className="container-page">
            <p className="type-label text-bronze mb-3">Guest words</p>
            <h2 className="type-display-md mb-16">In their own words</h2>
          </div>
          <div className="marquee">
            <div className="marquee-track gap-8 pr-8">
              {[...reviews, ...reviews].map((r, i) => (
                <blockquote
                  key={`${r.id}-${i}`}
                  className="w-80 flex-none rounded border border-border-ghost bg-surface-lowest p-6 sm:w-96"
                  aria-hidden={i >= reviews.length}
                >
                  <div className="flex gap-1" aria-label={`${r.rating} stars`}>
                    {Array.from({ length: r.rating }, (_, s) => (
                      <Star
                        key={s}
                        className="h-3.5 w-3.5 fill-current text-bronze"
                      />
                    ))}
                  </div>
                  <p className="type-body-md mt-4">“{r.body}”</p>
                  <footer className="type-label text-muted mt-4">
                    {r.authorName} · {r.property.title}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Brand / experience */}
      <section id="experience" className="bg-inverse-surface py-24 text-inverse-on-surface">
        <div className="container-page grid gap-10 lg:grid-cols-2 lg:gap-24">
          <h2 className="type-display-md">
            Hospitality, practised quietly.
          </h2>
          <div className="type-body-lg space-y-6 self-center opacity-90">
            <p>
              We keep a small collection so that nothing is anonymous: the
              coffee is the kind we drink, the linens are the ones we sleep in,
              and the guidebook in each house is written by hand.
            </p>
            <p>
              From the Pacific rainforest to the walls of Old Québec, every
              property is chosen for its setting and kept to one standard.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container-page py-32 text-center">
        <h2 className="type-display-md mx-auto max-w-2xl">
          Your next stay is waiting.
        </h2>
        <Link
          href="/properties"
          className={cn(buttonVariants({ size: "lg" }), "mt-10")}
        >
          Explore the collection
        </Link>
      </section>
    </main>
  );
}
