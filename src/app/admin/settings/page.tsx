import type { Metadata } from "next";
import { brand } from "@/lib/brand";
import { Card, CardSection } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";

export const metadata: Metadata = { title: "Admin — Settings" };

function EnvRow({
  label,
  ok,
  hint,
}: {
  label: string;
  ok: boolean;
  hint: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div>
        <p className="type-body-md font-medium">{label}</p>
        <p className="type-body-md text-muted">{hint}</p>
      </div>
      <StatusChip status={ok ? "confirmed" : "pending"}>
        {ok ? "configured" : "not set"}
      </StatusChip>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <main className="max-w-2xl">
      <h1 className="type-display-md">Settings</h1>
      <p className="type-body-md text-muted mt-2">
        Service configuration lives in the server environment (.env) — this
        page shows what&apos;s wired up.
      </p>

      <Card className="mt-8">
        <CardSection className="divide-y divide-divider">
          <EnvRow
            label="Brand"
            ok
            hint={`"${brand.name}" — change in src/lib/brand.ts (one file)`}
          />
          <EnvRow
            label="Email delivery (Resend)"
            ok={Boolean(process.env.RESEND_API_KEY)}
            hint="Transactional booking + account emails"
          />
          <EnvRow
            label="Manager notifications"
            ok={Boolean(process.env.MANAGER_EMAIL)}
            hint={`New requests go to ${process.env.MANAGER_EMAIL ?? "(unset — falls back to brand email)"}`}
          />
          <EnvRow
            label="Image uploads (Cloudinary)"
            ok={Boolean(process.env.CLOUDINARY_CLOUD_NAME)}
            hint="Direct photo upload in the property editor; URL-paste works meanwhile"
          />
          <EnvRow
            label="Google sign-in"
            ok={Boolean(process.env.AUTH_GOOGLE_ID)}
            hint="Guests can sign in with Google once OAuth credentials are set"
          />
        </CardSection>
      </Card>
    </main>
  );
}
