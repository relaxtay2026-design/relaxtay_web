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

/**
 * The link that activates an account (PRD §25 — claim flow). Sent after a
 * first booking, or when someone signs up with their email address.
 */
export function AccountInvitationEmail({
  guestName,
  claimUrl,
  reason = "booking",
}: {
  guestName: string;
  claimUrl: string;
  reason?: "booking" | "signup";
}) {
  if (reason === "signup") {
    return (
      <EmailShell
        preview={`Finish creating your ${brand.name} account.`}
        heading="Finish creating your account"
      >
        <Text style={bodyText}>
          {guestName.split(" ")[0]}, thanks for signing up with {brand.name}.
          Confirm this is your email address and choose a password to finish
          creating your account.
        </Text>
        <Button href={claimUrl} style={{ ...cta, marginTop: "16px" }}>
          Set your password
        </Button>
        <Text style={{ ...mutedText, marginTop: "24px" }}>
          This link is personal to you and expires in 7 days. If you
          didn&apos;t sign up, you can safely ignore this email — no account
          is created without it.
        </Text>
      </EmailShell>
    );
  }
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

/** Sign-up attempt with an address that already has an active account. */
export function AccountExistsEmail({
  name,
  loginUrl,
  resetUrl,
}: {
  name: string;
  loginUrl: string;
  resetUrl: string;
}) {
  return (
    <EmailShell
      preview={`You already have a ${brand.name} account.`}
      heading="You already have an account"
    >
      <Text style={bodyText}>
        {name.split(" ")[0]}, someone — hopefully you — just tried to sign up
        with this email address, but it already has a {brand.name} account.
        Sign in to see your stays.
      </Text>
      <Button href={loginUrl} style={{ ...cta, marginTop: "16px" }}>
        Sign in
      </Button>
      <Text style={{ ...mutedText, marginTop: "24px" }}>
        Forgot your password? Choose a new one at {resetUrl}. If this
        wasn&apos;t you, no action is needed — nothing has changed.
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
