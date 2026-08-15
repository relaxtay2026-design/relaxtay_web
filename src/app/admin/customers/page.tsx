import type { Metadata } from "next";
import Link from "next/link";
import { listCustomers } from "@/server/admin/queries";
import { Card, CardSection } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { Table, THead, TH, TBody, TD } from "@/components/ui/table";

export const metadata: Metadata = { title: "Admin — Customers" };

const statusChip = {
  unclaimed: "pending",
  active: "confirmed",
  disabled: "cancelled",
} as const;

export default async function CustomersPage() {
  const customers = await listCustomers();

  return (
    <main>
      <h1 className="type-display-md">Customers</h1>
      <p className="type-body-md text-muted mt-2">
        Every booking builds this list — the owned relationship (PRD vision).
      </p>

      <Card className="mt-8">
        {customers.length === 0 ? (
          <CardSection>
            <p className="type-body-md text-muted">No customers yet.</p>
          </CardSection>
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Name</TH>
                <TH>Email</TH>
                <TH className="text-center">Bookings</TH>
                <TH>Last stay</TH>
                <TH>Account</TH>
                <TH>Marketing</TH>
              </tr>
            </THead>
            <TBody>
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-surface-low">
                  <TD>
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className="font-medium hover:underline"
                    >
                      {c.name}
                    </Link>
                  </TD>
                  <TD className="text-muted">{c.email}</TD>
                  <TD className="text-center">{c.bookingCount}</TD>
                  <TD className="text-muted">
                    {c.lastStay
                      ? c.lastStay.toLocaleDateString("en-CA", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          timeZone: "UTC",
                        })
                      : "—"}
                  </TD>
                  <TD>
                    <StatusChip status={statusChip[c.accountStatus]}>
                      {c.accountStatus}
                    </StatusChip>
                  </TD>
                  <TD className="type-label text-muted">
                    {c.marketingOptIn ? "Subscribed" : "—"}
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
