import { Text } from "@react-email/components";
import { EmailShell, DetailRow, bodyText, mutedText } from "./base";
import { formatDateRange } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

type BookingEmailData = {
  code: string;
  propertyTitle: string;
  propertyLocation: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestCount: number;
  guestMessage: string | null;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  totalCents: number;
  currency: string;
};

/** To the guest, immediately after the request (PRD §7 — request received). */
export function BookingRequestGuestEmail({ b }: { b: BookingEmailData }) {
  return (
    <EmailShell
      preview={`Your reservation request for ${b.propertyTitle} has been received.`}
      heading="Your request has been received"
    >
      <Text style={bodyText}>
        Thank you, {b.guestName.split(" ")[0]}. We&apos;ve received your
        reservation request and will confirm it personally — usually within a
        day. Nothing is charged and no dates are final until you receive your
        confirmation email.
      </Text>
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
      <DetailRow
        label="Total"
        value={`${formatMoney(b.totalCents, b.currency)} (${b.nights} night${b.nights === 1 ? "" : "s"})`}
      />
      <DetailRow label="Reference" value={b.code} />
      <Text style={{ ...mutedText, marginTop: "24px" }}>
        We&apos;ll be in touch shortly. If your plans change in the meantime,
        just reply to this email.
      </Text>
    </EmailShell>
  );
}

/** To the manager: a new request needs a decision (PRD §7). */
export function BookingRequestManagerEmail({
  b,
  adminUrl,
}: {
  b: BookingEmailData;
  adminUrl: string;
}) {
  return (
    <EmailShell
      preview={`New booking request: ${b.propertyTitle}, ${formatDateRange(b.checkIn, b.checkOut)}`}
      heading="New booking request"
    >
      <Text style={bodyText}>
        {b.guestName} has requested {b.propertyTitle}. The dates are now held
        as pending — confirm or decline in the dashboard.
      </Text>
      <DetailRow label="Property" value={b.propertyTitle} />
      <DetailRow label="Dates" value={formatDateRange(b.checkIn, b.checkOut)} />
      <DetailRow
        label="Guests"
        value={`${b.guestCount} guest${b.guestCount === 1 ? "" : "s"}`}
      />
      <DetailRow label="Total" value={formatMoney(b.totalCents, b.currency)} />
      <DetailRow label="Guest email" value={b.guestEmail} />
      <DetailRow label="Guest phone" value={b.guestPhone} />
      {b.guestMessage && <DetailRow label="Message" value={b.guestMessage} />}
      <DetailRow label="Reference" value={b.code} />
      <Text style={{ ...mutedText, marginTop: "24px" }}>
        Manage: {adminUrl}
      </Text>
    </EmailShell>
  );
}
