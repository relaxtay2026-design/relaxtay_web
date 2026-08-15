import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { imageUrl } from "@/lib/images";
import { formatMoney } from "@/lib/money";
import type { PropertyCardData } from "@/server/property/queries";

/**
 * Photography-first card per Designs.md: image dominates, info sits
 * directly on the ivory canvas below it — no fill, no shadow.
 */
export function PropertyCard({ property }: { property: PropertyCardData }) {
  const primary = property.images.find((i) => i.isPrimary) ?? property.images[0];
  return (
    <Link href={`/properties/${property.slug}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded">
        {primary && (
          <Image
            src={imageUrl(primary.src)}
            alt={primary.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        {property.avgRating !== null && (
          <span className="type-label absolute right-3 top-3 inline-flex items-center gap-1 rounded bg-ivory/90 px-2.5 py-1.5 text-ink">
            <Star className="h-3 w-3 fill-current" />
            {property.avgRating.toFixed(2)}
          </span>
        )}
      </div>
      <div className="pt-4">
        <h3 className="type-headline-md group-hover:text-bronze transition-colors">
          {property.title}
        </h3>
        <p className="type-body-md text-muted mt-0.5">{property.location}</p>
        <p className="type-body-md mt-2">
          <span className="font-medium">
            {formatMoney(property.priceCents, property.currency)}
          </span>
          <span className="text-muted"> / night</span>
        </p>
      </div>
    </Link>
  );
}
