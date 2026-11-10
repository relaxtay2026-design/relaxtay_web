import type { Metadata } from "next";
import { requireManager } from "@/lib/auth";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { listAdminProperties, listBlocks } from "@/server/admin/queries";
import { formatDateRange } from "@/lib/dates";
import { Card, CardSection } from "@/components/ui/card";
import { Table, THead, TH, TBody, TD } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { BlockForm } from "./block-form";
import { deleteBlockAction } from "./actions";

export const metadata: Metadata = { title: "Admin — Availability" };

/**
 * Manager blocks (D4): maintenance, offline bookings, other channels.
 * Blocked nights are unavailable on the public calendar immediately.
 */
export default async function AvailabilityPage({
  searchParams,
}: PageProps<"/admin/availability">) {
  await requireManager();
  const sp = await searchParams;
  const properties = await listAdminProperties();
  const selectedId =
    typeof sp.property === "string" &&
    properties.some((p) => p.id === sp.property)
      ? sp.property
      : properties[0]?.id;
  const blocks = selectedId ? await listBlocks(selectedId) : [];

  return (
    <main>
      <h1 className="type-display-md">Availability</h1>
      <p className="type-body-md text-muted mt-2 max-w-xl">
        Block dates for maintenance or reservations made outside this site.
        Blocked nights immediately show as unavailable to guests.
      </p>

      <div className="mt-8 flex flex-wrap gap-2 border-b border-divider pb-4">
        {properties.map((p) => (
          <Link
            key={p.id}
            href={`/admin/availability?property=${p.id}`}
            className={cn(
              "type-label rounded border px-3 py-2 transition-colors",
              p.id === selectedId
                ? "border-ink bg-ink text-ivory"
                : "border-border-ghost text-muted hover:text-ink"
            )}
          >
            {p.title}
          </Link>
        ))}
      </div>

      {selectedId && (
        <>
          <Card className="mt-8 max-w-3xl">
            <CardSection>
              <h2 className="type-headline-md mb-5">Block dates</h2>
              <BlockForm propertyId={selectedId} />
            </CardSection>
          </Card>

          <Card className="mt-6 max-w-3xl">
            {blocks.length === 0 ? (
              <CardSection>
                <p className="type-body-md text-muted">
                  No upcoming blocks for this property.
                </p>
              </CardSection>
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH>Dates</TH>
                    <TH>Note</TH>
                    <TH className="text-right">Remove</TH>
                  </tr>
                </THead>
                <TBody>
                  {blocks.map((b) => (
                    <tr key={b.id}>
                      <TD>{formatDateRange(b.startDate, b.endDate)}</TD>
                      <TD className="text-muted">{b.note ?? "—"}</TD>
                      <TD className="text-right">
                        <form action={deleteBlockAction} className="inline">
                          <input type="hidden" name="blockId" value={b.id} />
                          <button
                            type="submit"
                            title="Remove block"
                            className="rounded border border-border-ghost p-1.5 transition-colors hover:bg-surface-high"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-error" />
                          </button>
                        </form>
                      </TD>
                    </tr>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>
        </>
      )}
    </main>
  );
}
