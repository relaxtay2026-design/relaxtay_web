import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAdminProperty, listAmenities } from "@/server/admin/queries";
import { imageUrl } from "@/lib/images";
import { Divider } from "@/components/ui/card";
import { PropertyForm } from "../property-form";
import { ImageManager } from "./image-manager";

export const metadata: Metadata = { title: "Admin — Edit property" };

export default async function EditPropertyPage({
  params,
  searchParams,
}: PageProps<"/admin/properties/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const [property, amenities] = await Promise.all([
    getAdminProperty(id),
    listAmenities(),
  ]);
  if (!property) notFound();

  return (
    <main>
      <Link
        href="/admin/properties"
        className="type-label flex items-center gap-2 text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back to properties
      </Link>
      <div className="mt-6 mb-10 flex flex-wrap items-center gap-4">
        <h1 className="type-display-md">{property.title}</h1>
        <Link
          href={`/properties/${property.slug}`}
          className="type-label underline underline-offset-4 hover:text-bronze"
          target="_blank"
        >
          View public page ↗
        </Link>
      </div>

      {sp.saved === "1" && (
        <p className="type-body-md mb-8 max-w-2xl rounded border border-sage/40 bg-sage-container/50 px-4 py-3">
          Property saved.
        </p>
      )}

      <PropertyForm
        amenities={amenities}
        values={{
          id: property.id,
          title: property.title,
          location: property.location,
          summary: property.summary,
          description: property.description,
          price: property.priceCents / 100,
          currency: property.currency,
          maxGuests: property.maxGuests,
          bedrooms: property.bedrooms,
          beds: property.beds,
          bathrooms: property.bathrooms,
          minNights: property.minNights,
          status: property.status,
          amenityIds: property.amenities.map((a) => a.amenityId),
        }}
      />

      <Divider className="my-12 max-w-2xl" />

      <section className="max-w-2xl">
        <h2 className="type-headline-md mb-1">Photography</h2>
        <p className="type-body-md text-muted mb-6">
          Upload high-resolution editorial imagery. The cover image leads the
          public page and cards.
        </p>
        <ImageManager
          propertyId={property.id}
          cloudinaryEnabled={Boolean(process.env.CLOUDINARY_CLOUD_NAME)}
          images={property.images.map((i) => ({
            id: i.id,
            url: imageUrl(i.src),
            alt: i.alt,
            isPrimary: i.isPrimary,
          }))}
        />
      </section>
    </main>
  );
}
