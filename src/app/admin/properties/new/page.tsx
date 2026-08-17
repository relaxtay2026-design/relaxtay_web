import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listAmenities } from "@/server/admin/queries";
import { PropertyForm } from "../property-form";

export const metadata: Metadata = { title: "Admin — Add property" };

export default async function NewPropertyPage() {
  const amenities = await listAmenities();

  return (
    <main>
      <Link
        href="/admin/properties"
        className="type-label flex items-center gap-2 text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back to properties
      </Link>
      <h1 className="type-display-md mt-6 mb-10">Add property</h1>
      <PropertyForm
        amenities={amenities}
        cloudinaryEnabled={Boolean(process.env.CLOUDINARY_CLOUD_NAME)}
        values={{
          title: "",
          location: "",
          summary: "",
          description: "",
          price: 0,
          currency: "USD",
          maxGuests: 2,
          bedrooms: 1,
          beds: 1,
          bathrooms: 1,
          minNights: 1,
          status: "active",
          amenityIds: [],
        }}
      />
    </main>
  );
}
