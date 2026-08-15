import type { Metadata } from "next";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "About",
  description: `The story and standards behind ${brand.name}.`,
};

export default function AboutPage() {
  return (
    <main className="container-page py-20">
      <p className="type-label text-bronze mb-3">Our story</p>
      <h1 className="type-display-md max-w-2xl">
        A small collection, kept to one standard.
      </h1>
      <div className="type-body-lg mt-10 max-w-2xl space-y-6">
        <p>
          {brand.name} began with a single property and a simple conviction:
          that a stay arranged directly — person to person — is better for the
          guest and better for the house.
        </p>
        <p>
          Today the collection spans eight properties across Canada, from the
          Pacific rainforest of Tofino to the seventeenth-century walls of Old
          Québec. Each one is prepared the same way: as if a friend were
          arriving.
        </p>
        <p>
          We keep the collection small on purpose. It means the coffee is the
          kind we drink, the linens are the ones we sleep in, and when you
          write to us, the reply comes from someone who has stood in the house.
        </p>
      </div>

      <section id="contact" className="mt-24 border-t border-divider pt-12">
        <h2 className="type-headline-lg">Contact</h2>
        <p className="type-body-md text-muted mt-4 max-w-xl">
          Questions about a property, your stay, or something else? Write to us
          — a person answers.
        </p>
        <a
          href={`mailto:${brand.email}`}
          className="type-body-lg mt-4 inline-block underline underline-offset-4 hover:text-bronze"
        >
          {brand.email}
        </a>
      </section>
    </main>
  );
}
