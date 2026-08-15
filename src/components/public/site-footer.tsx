import Link from "next/link";
import { brand } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="mt-32 bg-surface-high">
      <div className="container-page py-16">
        <div className="grid gap-12 md:grid-cols-[1fr_auto_auto] md:gap-24">
          <div className="max-w-sm">
            <p className="font-display text-3xl tracking-tight">
              {brand.name.toUpperCase()}
            </p>
            <p className="type-body-md text-muted mt-4">{brand.description}</p>
          </div>
          <div>
            <p className="type-label text-muted mb-4">Explore</p>
            <ul className="space-y-3">
              <li>
                <Link href="/properties" className="type-body-md hover:text-bronze">
                  All stays
                </Link>
              </li>
              <li>
                <Link href="/about" className="type-body-md hover:text-bronze">
                  About
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="type-label text-muted mb-4">Contact</p>
            <ul className="space-y-3">
              <li>
                <a
                  href={`mailto:${brand.email}`}
                  className="type-body-md hover:text-bronze"
                >
                  {brand.email}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-16 border-t border-border-ghost pt-8">
          <p className="type-label text-muted">
            © {new Date().getFullYear()} {brand.legalName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
