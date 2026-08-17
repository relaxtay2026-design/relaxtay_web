import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listAdminProperties } from "@/server/admin/queries";
import { imageUrl } from "@/lib/images";
import { formatMoney } from "@/lib/money";
import { Card } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { Table, THead, TH, TBody, TD } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StatusToggle } from "./status-toggle";
import { ClickableRow } from "@/components/admin/clickable-row";

export const metadata: Metadata = { title: "Admin — Properties" };

export default async function AdminPropertiesPage() {
  const properties = await listAdminProperties();

  return (
    <main>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="type-display-md">Properties</h1>
        <Link
          href="/admin/properties/new"
          className={cn(buttonVariants({ size: "sm" }))}
        >
          + Add property
        </Link>
      </div>

      <Card className="mt-8">
        <Table>
          <THead>
            <tr>
              <TH>Property</TH>
              <TH>Location</TH>
              <TH className="text-right">Price / night</TH>
              <TH className="text-center">Bookings</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {properties.map((p) => (
              <ClickableRow key={p.id} href={`/admin/properties/${p.id}`}>
                <TD>
                  <div className="flex items-center gap-3">
                    {p.images[0] && (
                      <span className="relative block h-10 w-14 flex-none overflow-hidden rounded">
                        <Image
                          src={imageUrl(p.images[0].src)}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </span>
                    )}
                    <span className="font-medium">{p.title}</span>
                  </div>
                </TD>
                <TD className="text-muted">{p.location}</TD>
                <TD className="text-right">
                  {formatMoney(p.priceCents, p.currency)}
                </TD>
                <TD className="text-center">{p._count.bookings}</TD>
                <TD>
                  <StatusChip
                    status={p.status === "active" ? "confirmed" : "blocked"}
                  >
                    {p.status === "active" ? "active" : "archived"}
                  </StatusChip>
                </TD>
                <TD className="text-right">
                  <div className="flex items-center justify-end gap-4">
                    <StatusToggle
                      propertyId={p.id}
                      title={p.title}
                      active={p.status === "active"}
                    />
                    <Link
                      href={`/admin/properties/${p.id}`}
                      className="type-label underline underline-offset-4 hover:text-bronze"
                    >
                      Edit
                    </Link>
                  </div>
                </TD>
              </ClickableRow>
            ))}
          </TBody>
        </Table>
      </Card>
    </main>
  );
}
