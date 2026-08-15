import { Text } from "@react-email/components";
import { EmailShell, DetailRow, bodyText, mutedText } from "./base";
import { formatDateRange } from "@/lib/dates";

/** To the manager when a guest requests cancellation (PRD D7). */
export function CancellationRequestEmail({
  code,
  propertyTitle,
  guestName,
  guestEmail,
  checkIn,
  checkOut,
  adminUrl,
}: {
  code: string;
  propertyTitle: string;
  guestName: string;
  guestEmail: string;
  checkIn: Date;
  checkOut: Date;
  adminUrl: string;
}) {
  return (
    <EmailShell
      preview={`${guestName} requests cancellation of ${code}.`}
      heading="Cancellation requested"
    >
      <Text style={bodyText}>
        {guestName} has requested to cancel their reservation. The booking
        stays active until you cancel it in the dashboard.
      </Text>
      <DetailRow label="Reference" value={code} />
      <DetailRow label="Property" value={propertyTitle} />
      <DetailRow label="Dates" value={formatDateRange(checkIn, checkOut)} />
      <DetailRow label="Guest" value={`${guestName} (${guestEmail})`} />
      <Text style={{ ...mutedText, marginTop: "24px" }}>Manage: {adminUrl}</Text>
    </EmailShell>
  );
}
