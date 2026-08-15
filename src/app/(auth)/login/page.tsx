import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/lib/brand";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Sign in" };

/** Placeholder — real authentication ships in Phase 5. */
export default function LoginPage() {
  return (
    <main className="container-page flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <Link href="/" className="font-display text-3xl tracking-tight">
        {brand.name.toUpperCase()}
      </Link>
      <h1 className="type-headline-lg mt-10">Guest accounts are almost here</h1>
      <p className="type-body-md text-muted mt-4 max-w-md">
        Soon you&apos;ll be able to sign in to view upcoming stays, revisit
        past trips, and manage your details. Booking never requires an
        account.
      </p>
      <Link
        href="/properties"
        className={cn(buttonVariants({ variant: "outline", size: "md" }), "mt-10")}
      >
        Browse stays
      </Link>
    </main>
  );
}
