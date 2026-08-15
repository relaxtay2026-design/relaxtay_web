import { brand } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Card, CardSection, Divider } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { Table, THead, TH, TBody, TD } from "@/components/ui/table";

export const metadata = { title: "Style Guide" };

const swatches = [
  { name: "ivory (canvas)", cls: "bg-ivory border border-border-ghost" },
  { name: "surface-lowest", cls: "bg-surface-lowest border border-border-ghost" },
  { name: "surface-low", cls: "bg-surface-low" },
  { name: "surface", cls: "bg-surface" },
  { name: "surface-high", cls: "bg-surface-high" },
  { name: "surface-highest", cls: "bg-surface-highest" },
  { name: "ink", cls: "bg-ink" },
  { name: "muted", cls: "bg-muted" },
  { name: "bronze (accent)", cls: "bg-bronze" },
  { name: "bronze-deep", cls: "bg-bronze-deep" },
  { name: "sage (success)", cls: "bg-sage" },
  { name: "amber-container", cls: "bg-amber-container" },
  { name: "sage-container", cls: "bg-sage-container" },
  { name: "error", cls: "bg-error" },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-24">
      <p className="type-label text-bronze mb-2">Section</p>
      <h2 className="type-headline-lg mb-10">{title}</h2>
      {children}
    </section>
  );
}

export default function StyleGuidePage() {
  return (
    <main className="container-page py-16">
      {/* Wordmark */}
      <header className="mb-20 border-b border-divider pb-10">
        <p className="font-display text-4xl tracking-tight">{brand.name}</p>
        <p className="type-body-md text-muted mt-2">
          Ivory &amp; Bronze — living style guide. Every primitive on this page
          must match Designs.md: no shadows, 4px radii, ghost borders, tonal
          depth.
        </p>
      </header>

      <Section title="Typography">
        <div className="space-y-10">
          <div>
            <p className="type-label text-muted mb-3">display-lg · Playfair 64</p>
            <p className="type-display-lg">Stay somewhere worth remembering</p>
          </div>
          <div>
            <p className="type-label text-muted mb-3">display-md · Playfair 48</p>
            <p className="type-display-md">Find your stay</p>
          </div>
          <div>
            <p className="type-label text-muted mb-3">headline-lg · Playfair 32</p>
            <p className="type-headline-lg">Garden Residence</p>
          </div>
          <div>
            <p className="type-label text-muted mb-3">headline-md · Playfair 24</p>
            <p className="type-headline-md">About this stay</p>
          </div>
          <div>
            <p className="type-label text-muted mb-3">body-lg · Inter 18</p>
            <p className="type-body-lg max-w-2xl">
              Thoughtfully selected stays designed for comfort, privacy, and
              memorable moments.
            </p>
          </div>
          <div>
            <p className="type-label text-muted mb-3">body-md · Inter 16</p>
            <p className="type-body-md max-w-2xl text-muted">
              Experience quiet luxury. This meticulously designed residence
              offers a serene escape, blending modern minimalism with warm,
              organic materials.
            </p>
          </div>
          <div>
            <p className="type-label text-muted mb-3">label-sm · Inter 12 +6%</p>
            <p className="type-label">Check-in · Check-out · Guests</p>
          </div>
        </div>
      </Section>

      <Section title="Colors">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-7">
          {swatches.map((s) => (
            <div key={s.name}>
              <div className={`h-20 rounded ${s.cls}`} />
              <p className="type-label text-muted mt-2">{s.name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-6">
          <Button>Book a stay</Button>
          <Button variant="outline">Check availability</Button>
          <Button variant="tertiary">View all amenities</Button>
          <Button variant="ghost">Cancel</Button>
          <Button disabled>Unavailable</Button>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Explore stays</Button>
        </div>
      </Section>

      <Section title="Form fields">
        <div className="grid max-w-2xl gap-8 sm:grid-cols-2">
          <Field label="First name" htmlFor="fn">
            <Input id="fn" placeholder="Alexander" />
          </Field>
          <Field label="Email address" htmlFor="em">
            <Input id="em" type="email" placeholder="you@example.com" />
          </Field>
          <Field label="Check-in" htmlFor="ci">
            <Input id="ci" placeholder="Select date" />
          </Field>
          <Field label="Guests" htmlFor="gu">
            <Input id="gu" placeholder="2 guests" />
          </Field>
          <Field label="Optional message" htmlFor="msg" className="sm:col-span-2">
            <Textarea
              id="msg"
              placeholder="Any special requests or arrival time details…"
            />
          </Field>
        </div>
      </Section>

      <Section title="Status chips">
        <div className="flex flex-wrap gap-4">
          <StatusChip status="pending" />
          <StatusChip status="confirmed" />
          <StatusChip status="completed" />
          <StatusChip status="declined" />
          <StatusChip status="cancelled" />
          <StatusChip status="blocked">blocked · maintenance</StatusChip>
        </div>
      </Section>

      <Section title="Cards & elevation">
        <div className="grid gap-8 md:grid-cols-3">
          <Card>
            <CardSection>
              <p className="type-headline-md mb-1">Ghost border card</p>
              <p className="type-body-md text-muted">
                White surface, 1px ink @ 10% border. No shadow, ever.
              </p>
            </CardSection>
          </Card>
          <Card tonal>
            <CardSection>
              <p className="type-headline-md mb-1">Tonal card</p>
              <p className="type-body-md text-muted">
                Depth from a slightly shifted surface tone instead of blur.
              </p>
            </CardSection>
          </Card>
          <Card>
            <CardSection>
              <p className="type-label text-muted">Total (USD)</p>
              <p className="type-headline-lg mt-1">$480</p>
              <Divider className="my-4" />
              <p className="type-body-md text-muted">4 nights × $120</p>
            </CardSection>
          </Card>
        </div>
      </Section>

      <Section title="Booking card (composite)">
        <Card className="max-w-sm">
          <CardSection>
            <p>
              <span className="font-display text-2xl">$120</span>
              <span className="type-body-md text-muted"> / night</span>
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Field label="Check-in">
                <Input defaultValue="10/24/2026" readOnly />
              </Field>
              <Field label="Check-out">
                <Input defaultValue="10/28/2026" readOnly />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Guests">
                <Input defaultValue="2 guests" readOnly />
              </Field>
            </div>
            <Button className="mt-6 w-full">Request this stay</Button>
            <Divider className="my-5" />
            <div className="flex justify-between">
              <p className="type-body-md text-muted">4 nights × $120</p>
              <p className="type-body-md">$480</p>
            </div>
            <div className="mt-2 flex justify-between">
              <p className="type-body-md font-medium">Total</p>
              <p className="type-body-md font-medium">$480</p>
            </div>
          </CardSection>
        </Card>
      </Section>

      <Section title="Management table">
        <Card>
          <Table>
            <THead>
              <tr>
                <TH>Guest</TH>
                <TH>Property</TH>
                <TH>Dates</TH>
                <TH>Status</TH>
                <TH className="text-right">Total</TH>
              </tr>
            </THead>
            <TBody>
              <tr>
                <TD>Eleanor Vance</TD>
                <TD>The Glass Pavilion</TD>
                <TD className="text-muted">Oct 12 – Oct 15</TD>
                <TD>
                  <StatusChip status="confirmed" />
                </TD>
                <TD className="text-right">$1,250</TD>
              </tr>
              <tr>
                <TD>Julian Dashwood</TD>
                <TD>Coastal Retreat</TD>
                <TD className="text-muted">Oct 14 – Oct 20</TD>
                <TD>
                  <StatusChip status="pending" />
                </TD>
                <TD className="text-right">$3,400</TD>
              </tr>
              <tr>
                <TD>Margaret White</TD>
                <TD>Urban Loft</TD>
                <TD className="text-muted">Oct 18 – Oct 22</TD>
                <TD>
                  <StatusChip status="cancelled" />
                </TD>
                <TD className="text-right">$980</TD>
              </tr>
            </TBody>
          </Table>
        </Card>
      </Section>
    </main>
  );
}
