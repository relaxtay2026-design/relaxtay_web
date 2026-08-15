import type { Metadata } from "next";
import { listActiveProperties } from "@/server/property/queries";
import { PropertyCard } from "@/components/public/property-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Find your stay",
  description:
    "Browse our curated collection of properties across Canada — from Pacific rainforest to the walls of Old Québec.",
};

function toInt(v: string | string[] | undefined): number | undefined {
  if (typeof v !== "string") return undefined;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export default async function PropertiesPage({
  searchParams,
}: PageProps<"/properties">) {
  const params = await searchParams;
  const guests = toInt(params.guests);
  const bedrooms = toInt(params.bedrooms);
  const maxPrice = toInt(params.maxPrice);
  const location =
    typeof params.location === "string" && params.location.trim() !== ""
      ? params.location.trim()
      : undefined;

  const properties = await listActiveProperties({
    guests,
    bedrooms,
    maxPriceCents: maxPrice ? maxPrice * 100 : undefined,
    location,
  });

  const hasFilters = Boolean(guests || bedrooms || maxPrice || location);

  return (
    <main className="container-page py-16">
      <p className="type-label text-bronze mb-3">The collection</p>
      <h1 className="type-display-md">Find your stay</h1>
      <p className="type-body-lg text-muted mt-4 max-w-xl">
        A small collection of properties across Canada, each kept to one
        standard.
      </p>

      {/* Quiet filters (PRD §10 — lightweight, 8 properties) */}
      <form
        action="/properties"
        className="mt-10 flex flex-wrap items-end gap-4 border-b border-divider pb-8"
      >
        <div>
          <label htmlFor="location" className="type-label text-muted mb-2 block">
            Location
          </label>
          <input
            id="location"
            name="location"
            defaultValue={location ?? ""}
            placeholder="Anywhere"
            className="type-body-md h-10 w-40 rounded border border-border-input bg-surface-lowest px-3 focus:border-bronze focus:outline-none focus:ring-1 focus:ring-bronze"
          />
        </div>
        <div>
          <label htmlFor="guests" className="type-label text-muted mb-2 block">
            Guests
          </label>
          <input
            id="guests"
            name="guests"
            type="number"
            min={1}
            defaultValue={guests ?? ""}
            placeholder="Any"
            className="type-body-md h-10 w-24 rounded border border-border-input bg-surface-lowest px-3 focus:border-bronze focus:outline-none focus:ring-1 focus:ring-bronze"
          />
        </div>
        <div>
          <label htmlFor="bedrooms" className="type-label text-muted mb-2 block">
            Bedrooms
          </label>
          <input
            id="bedrooms"
            name="bedrooms"
            type="number"
            min={1}
            defaultValue={bedrooms ?? ""}
            placeholder="Any"
            className="type-body-md h-10 w-24 rounded border border-border-input bg-surface-lowest px-3 focus:border-bronze focus:outline-none focus:ring-1 focus:ring-bronze"
          />
        </div>
        <div>
          <label htmlFor="maxPrice" className="type-label text-muted mb-2 block">
            Max price / night
          </label>
          <input
            id="maxPrice"
            name="maxPrice"
            type="number"
            min={1}
            defaultValue={maxPrice ?? ""}
            placeholder="Any"
            className="type-body-md h-10 w-32 rounded border border-border-input bg-surface-lowest px-3 focus:border-bronze focus:outline-none focus:ring-1 focus:ring-bronze"
          />
        </div>
        <button
          type="submit"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Apply
        </button>
        {hasFilters && (
          <a
            href="/properties"
            className="type-label text-muted underline underline-offset-4 hover:text-ink"
          >
            Clear
          </a>
        )}
      </form>

      {properties.length === 0 ? (
        <div className="py-24 text-center">
          <p className="type-headline-md">No stays match those filters.</p>
          <p className="type-body-md text-muted mt-3">
            Try widening your search — the collection is intentionally small.
          </p>
        </div>
      ) : (
        <div className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </main>
  );
}
