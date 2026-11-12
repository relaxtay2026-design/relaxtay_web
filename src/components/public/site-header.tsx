import Link from "next/link";
import { brand } from "@/lib/brand";
import { buttonVariants } from "@/components/ui/button";
import { ProfileMenu } from "@/components/public/profile-menu";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/properties", label: "Stays" },
  { href: "/about", label: "About" },
  { href: "/about#contact", label: "Contact" },
];

/**
 * Minimal editorial top bar: wordmark, tracked links, one loud CTA.
 *
 * Deliberately reads NO session here. Reading cookies in this shared header
 * would make every public page render on demand for every visitor; the
 * signed-in state is filled in by ProfileMenu in the browser instead, so
 * the pages themselves can be prerendered and cached.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-ghost bg-ivory/95 backdrop-blur-sm">
      <div className="container-page flex h-20 items-center justify-between gap-8">
        <Link href="/" className="font-display text-2xl tracking-tight">
          {brand.name.toUpperCase()}
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="type-label text-muted transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <Link
            href="/properties"
            className={cn(
              buttonVariants({ variant: "primary", size: "sm" }),
              "hidden sm:inline-flex"
            )}
          >
            Book a stay
          </Link>
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
