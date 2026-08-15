import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { brand } from "@/lib/brand";

/** Focused booking chrome (PRD §18): back link + wordmark, nothing else. */
export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-border-ghost">
        <div className="container-page grid h-20 grid-cols-3 items-center">
          <Link
            href="/properties"
            className="type-label flex items-center gap-2 text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <Link
            href="/"
            className="text-center font-display text-2xl tracking-tight"
          >
            {brand.name.toUpperCase()}
          </Link>
          <span />
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </>
  );
}
