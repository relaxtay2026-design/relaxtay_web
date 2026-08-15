import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { brand } from "@/lib/brand";

/**
 * Shared email shell — Ivory & Bronze, table-safe. System serif stands in
 * for Playfair (webfonts are unreliable in email clients).
 */
export function EmailShell({
  preview,
  heading,
  children,
}: {
  preview: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#fbf9f4", fontFamily: "Georgia, serif" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 24px" }}>
          <Text
            style={{
              fontSize: "22px",
              letterSpacing: "0.04em",
              color: "#1a1a1a",
              margin: 0,
            }}
          >
            {brand.name.toUpperCase()}
          </Text>
          <Hr style={{ borderColor: "#e4e2dd", margin: "24px 0" }} />
          <Heading
            as="h1"
            style={{
              fontSize: "26px",
              fontWeight: 400,
              color: "#1a1a1a",
              margin: "0 0 16px",
            }}
          >
            {heading}
          </Heading>
          <Section>{children}</Section>
          <Hr style={{ borderColor: "#e4e2dd", margin: "32px 0 16px" }} />
          <Text style={{ fontSize: "12px", color: "#6b6b6b" }}>
            {brand.legalName} · This is a transactional message about your
            reservation.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const bodyText = {
  fontFamily: "Helvetica, Arial, sans-serif",
  fontSize: "15px",
  lineHeight: "24px",
  color: "#1a1a1a",
} as const;

export const mutedText = { ...bodyText, color: "#6b6b6b" } as const;

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Text style={{ ...bodyText, margin: "4px 0" }}>
      <span style={{ color: "#6b6b6b" }}>{label}: </span>
      {value}
    </Text>
  );
}
