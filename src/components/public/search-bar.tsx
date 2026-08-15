"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type PropertyOption = { slug: string; title: string; maxGuests: number };

const selectCls =
  "type-body-md h-11 w-full rounded border border-border-input bg-surface-lowest px-3 focus:border-bronze focus:outline-none focus:ring-1 focus:ring-bronze";

/**
 * Hero search (improvement #1): with only ~8 properties, search is a
 * property dropdown + guest count. Picking a property goes straight to
 * it; "All stays" filters the collection by guests.
 */
export function SearchBar({ properties }: { properties: PropertyOption[] }) {
  const router = useRouter();
  const [slug, setSlug] = React.useState("");
  const [guests, setGuests] = React.useState("2");
  const maxGuests = Math.max(...properties.map((p) => p.maxGuests), 2);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (slug) {
      router.push(`/properties/${slug}`);
    } else {
      router.push(`/properties?guests=${guests}`);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4 rounded border border-border-ghost bg-surface-lowest p-5 md:flex-row md:items-end"
    >
      <div className="flex-1">
        <Label htmlFor="sb-property">Property</Label>
        <select
          id="sb-property"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className={selectCls}
        >
          <option value="">All stays</option>
          {properties.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.title}
            </option>
          ))}
        </select>
      </div>
      <div className="w-full md:w-44">
        <Label htmlFor="sb-guests">Guests</Label>
        <select
          id="sb-guests"
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          className={selectCls}
        >
          {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} guest{n === 1 ? "" : "s"}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" size="md" className="md:w-auto">
        <Search className="h-3.5 w-3.5" /> Search stays
      </Button>
    </form>
  );
}
