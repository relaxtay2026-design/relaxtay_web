import { Button, Text } from "@react-email/components";
import { EmailShell, bodyText, mutedText } from "./base";
import { brand } from "@/lib/brand";

const cta = {
  backgroundColor: "#1a1a1a",
  color: "#fbf9f4",
  fontFamily: "Helvetica, Arial, sans-serif",
  fontSize: "12px",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  padding: "12px 24px",
  borderRadius: "4px",
};

/** Account invitation after first booking (PRD §25 — claim flow). */
export function AccountInvitationEmail({
  guestName,
  claimUrl,
}: {
  guestName: string;
  claimUrl: string;
}) {
  return (
    <EmailShell
      preview="Your booking is ready to manage online."
      heading="Your booking is ready to manage online"
    >
      <Text style={bodyText}>
        {guestName.split(" ")[0]}, your reservation created a guest profile
        with {brand.name}. Claim it to see upcoming and past stays, track your
        booking status, and manage your details — no obligation, your booking
        stands either way.
      </Text>
      <Button href={claimUrl} style={{ ...cta, marginTop: "16px" }}>
        Claim your account
      </Button>
      <Text style={{ ...mutedText, marginTop: "24px" }}>
        This link is personal to you and expires in 7 days. If you didn&apos;t
        book with us, you can safely ignore this email.
      </Text>
    </EmailShell>
  );
}

/** Password reset (PRD §64 — never email a password). */
export function PasswordResetEmail({ resetUrl }: { resetUrl: string }) {
  return (
    <EmailShell
      preview="Reset your password."
      heading="Reset your password"
    >
      <Text style={bodyText}>
        We received a request to reset the password for your {brand.name}{" "}
        account. The link below is valid for one hour and can be used once.
      </Text>
      <Button href={resetUrl} style={{ ...cta, marginTop: "16px" }}>
        Choose a new password
      </Button>
      <Text style={{ ...mutedText, marginTop: "24px" }}>
        If you didn&apos;t request this, ignore this email — your password is
        unchanged.
      </Text>
    </EmailShell>
  );
}
