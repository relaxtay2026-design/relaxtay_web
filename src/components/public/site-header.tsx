import Link from "next/link";
import { brand } from "@/lib/brand";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/properties", label: "Stays" },
  { href: "/about", label: "About" },
  { href: "/about#contact", label: "Contact" },
];

/** Minimal editorial top bar: wordmark, tracked links, one loud CTA. */
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

        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="type-label hidden text-muted transition-colors hover:text-ink sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/properties"
            className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
          >
            Book a stay
          </Link>
        </div>
      </div>
    </header>
  );
}
