import type { Metadata } from "next";
import { brand } from "@/lib/brand";
import { db } from "@/lib/db";
import { Card, CardSection } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { AmenitiesManager } from "./amenities-manager";

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

export default async function AdminSettingsPage() {
  const amenities = await db.amenity.findMany({
    include: { _count: { select: { properties: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <main className="max-w-2xl">
      <h1 className="type-display-md">Settings</h1>

      <section className="mt-10">
        <h2 className="type-headline-md mb-1">Amenities</h2>
        <p className="type-body-md text-muted mb-6">
          The global list properties choose from. Renames apply everywhere
          instantly.
        </p>
        <Card>
          <CardSection>
            <AmenitiesManager
              amenities={amenities.map((a) => ({
                id: a.id,
                name: a.name,
                usageCount: a._count.properties,
              }))}
            />
          </CardSection>
        </Card>
      </section>

      <p className="type-body-md text-muted mt-12">
        Service configuration lives in the server environment (.env) — below
        shows what&apos;s wired up.
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
