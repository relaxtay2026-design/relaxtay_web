import Link from "next/link";
import { brand } from "@/lib/brand";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="container-page flex flex-1 flex-col items-center justify-center py-32 text-center">
      <p className="type-label text-bronze mb-6">{brand.legalName}</p>
      <h1 className="type-display-lg max-w-3xl">{brand.tagline}</h1>
      <p className="type-body-lg text-muted mt-6 max-w-xl">
        {brand.description}
      </p>
      <div className="mt-12 flex gap-4">
        <Button size="lg" disabled>
          Explore stays
        </Button>
        <Link href="/style-guide">
          <Button variant="outline" size="lg">
            Style guide
          </Button>
        </Link>
      </div>
      <p className="type-label text-muted mt-16">
        Phase 1 — foundation · full homepage arrives in Phase 3
      </p>
    </main>
  );
}
