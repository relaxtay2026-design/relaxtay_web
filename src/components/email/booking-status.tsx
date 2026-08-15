import { Text } from "@react-email/components";
import { EmailShell, DetailRow, bodyText, mutedText } from "./base";
import { formatDateRange } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { brand } from "@/lib/brand";

type StatusEmailData = {
  code: string;
  propertyTitle: string;
  propertyLocation: string;
  guestName: string;
  guestCount: number;
  checkIn: Date;
  checkOut: Date;
  totalCents: number;
  currency: string;
};

function StayDetails({ b }: { b: StatusEmailData }) {
  return (
    <>
      <Text style={{ ...bodyText, fontSize: "18px", margin: "24px 0 4px" }}>
        {b.propertyTitle}
      </Text>
      <Text style={{ ...mutedText, margin: "0 0 16px" }}>
        {b.propertyLocation}
      </Text>
      <DetailRow label="Dates" value={formatDateRange(b.checkIn, b.checkOut)} />
      <DetailRow
        label="Guests"
        value={`${b.guestCount} guest${b.guestCount === 1 ? "" : "s"}`}
      />
      <DetailRow label="Total" value={formatMoney(b.totalCents, b.currency)} />
      <DetailRow label="Reference" value={b.code} />
    </>
  );
}

/** The V2 §22 moment — sent when the manager confirms (PRD D2). */
export function BookingConfirmedEmail({ b }: { b: StatusEmailData }) {
  return (
    <EmailShell
      preview={`Your stay at ${b.propertyTitle} is confirmed.`}
      heading="Your stay is confirmed"
    >
      <Text style={bodyText}>
        {b.guestName.split(" ")[0]}, pack your bags — your reservation is
        confirmed. We&apos;ll share arrival details and the exact address
        closer to your stay.
      </Text>
      <StayDetails b={b} />
      <Text style={{ ...mutedText, marginTop: "24px" }}>
        Questions or plans changing? Just reply to this email and mention{" "}
        {b.code}.
      </Text>
    </EmailShell>
  );
}

export function BookingDeclinedEmail({
  b,
  note,
}: {
  b: StatusEmailData;
  note?: string | null;
}) {
  return (
    <EmailShell
      preview={`About your request for ${b.propertyTitle}.`}
      heading="We couldn't confirm this request"
    >
      <Text style={bodyText}>
        {b.guestName.split(" ")[0]}, unfortunately we&apos;re unable to confirm
        your request for {b.propertyTitle} on these dates
        {note ? ` — ${note}` : ""}. No charge was made.
      </Text>
      <StayDetails b={b} />
      <Text style={{ ...mutedText, marginTop: "24px" }}>
        We&apos;d love to host you another time — the calendar at{" "}
        {brand.name} always shows live availability.
      </Text>
    </EmailShell>
  );
}

export function BookingCancelledEmail({
  b,
  note,
}: {
  b: StatusEmailData;
  note?: string | null;
}) {
  return (
    <EmailShell
      preview={`Your reservation ${b.code} has been cancelled.`}
      heading="Your reservation has been cancelled"
    >
      <Text style={bodyText}>
        {b.guestName.split(" ")[0]}, your reservation has been cancelled
        {note ? ` — ${note}` : ""}. The dates are released.
      </Text>
      <StayDetails b={b} />
      <Text style={{ ...mutedText, marginTop: "24px" }}>
        If this wasn&apos;t expected, reply to this email and we&apos;ll sort
        it out.
      </Text>
    </EmailShell>
  );
}
