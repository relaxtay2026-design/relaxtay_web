import { formatMoney } from "@/lib/money";
import { Card, CardSection, Divider } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

/**
 * Sticky booking card (PRD §16). Phase 3: presentational only — the
 * date picker, live quote, and request flow arrive with the booking
 * engine in Phase 4.
 */
export function BookingCard({
  priceCents,
  currency,
  maxGuests,
  minNights,
}: {
  priceCents: number;
  currency: string;
  maxGuests: number;
  minNights: number;
}) {
  return (
    <Card>
      <CardSection>
        <p>
          <span className="font-display text-3xl">
            {formatMoney(priceCents, currency)}
          </span>
          <span className="type-body-md text-muted"> / night</span>
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Field label="Check-in">
            <Input placeholder="Select date" readOnly />
          </Field>
          <Field label="Check-out">
            <Input placeholder="Select date" readOnly />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Guests">
            <Input placeholder={`Up to ${maxGuests} guests`} readOnly />
          </Field>
        </div>
        <Button className="mt-6 w-full" disabled>
          Request this stay
        </Button>
        <p className="type-label text-muted mt-4 text-center">
          Online booking opens shortly
        </p>
        {minNights > 1 && (
          <>
            <Divider className="my-5" />
            <div className="flex justify-between">
              <Label className="mb-0">Minimum stay</Label>
              <p className="type-body-md">{minNights} nights</p>
            </div>
          </>
        )}
      </CardSection>
    </Card>
  );
}
