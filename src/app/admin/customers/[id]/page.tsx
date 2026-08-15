import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCustomer } from "@/server/admin/queries";
import { formatMoney } from "@/lib/money";
import { formatDateRange, todayUTC } from "@/lib/dates";
import { Card, CardSection } from "@/components/ui/card";
import { StatusChip, type ChipStatus } from "@/components/ui/status-chip";
import { Table, THead, TH, TBody, TD } from "@/components/ui/table";

export const metadata: Metadata = { title: "Admin — Customer" };

export default async function CustomerDetailPage({
  params,
}: PageProps<"/admin/customers/[id]">) {
  const { id } = await params;
  const c = await getCustomer(id);
  if (!c) notFound();

  const today = todayUTC();
  const upcoming = c.bookings.filter(
    (b) => b.checkOut >= today && ["pending", "confirmed"].includes(b.status)
  );
  const totalSpentCents = c.bookings
    .filter((b) => ["confirmed", "completed"].includes(b.status))
    .reduce((sum, b) => sum + b.totalCents, 0);

  return (
    <main className="max-w-4xl">
      <Link
        href="/admin/customers"
        className="type-label flex items-center gap-2 text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Customers
      </Link>

      <h1 className="type-display-md mt-6">{c.name}</h1>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <Card>
          <CardSection>
            <p className="type-label text-muted">Contact</p>
            <p className="type-body-md mt-2">{c.email}</p>
            <p className="type-body-md text-muted">{c.phone ?? "no phone"}</p>
          </CardSection>
        </Card>
        <Card>
          <CardSection>
            <p className="type-label text-muted">Account</p>
            <p className="type-body-md mt-2 capitalize">{c.accountStatus}</p>
            <p className="type-body-md text-muted">
              {c.marketingOptIn ? "Marketing: subscribed" : "Marketing: not subscribed"}
            </p>
          </CardSection>
        </Card>
        <Card>
          <CardSection>
            <p className="type-label text-muted">History</p>
            <p className="type-body-md mt-2">
              {c.bookings.length} booking{c.bookings.length === 1 ? "" : "s"}
              {upcoming.length > 0 && ` · ${upcoming.length} upcoming`}
            </p>
            <p className="type-body-md text-muted">
              {formatMoney(totalSpentCents, "USD")} lifetime
            </p>
          </CardSection>
        </Card>
      </div>

      <h2 className="type-headline-lg mt-12 mb-5">Bookings</h2>
      <Card>
        {c.bookings.length === 0 ? (
          <CardSection>
            <p className="type-body-md text-muted">No bookings.</p>
          </CardSection>
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Ref</TH>
                <TH>Property</TH>
                <TH>Dates</TH>
                <TH>Status</TH>
                <TH className="text-right">Total</TH>
              </tr>
            </THead>
            <TBody>
              {c.bookings.map((b) => (
                <tr key={b.id} className="hover:bg-surface-low">
                  <TD>
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="font-medium hover:underline"
                    >
                      {b.code}
                    </Link>
                  </TD>
                  <TD>{b.property.title}</TD>
                  <TD className="text-muted">
                    {formatDateRange(b.checkIn, b.checkOut)}
                  </TD>
                  <TD>
                    <StatusChip status={b.status as ChipStatus} />
                  </TD>
                  <TD className="text-right">
                    {formatMoney(b.totalCents, b.currency)}
                  </TD>
                </tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </main>
  );
}
