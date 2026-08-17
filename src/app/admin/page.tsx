import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, CalendarClock, Home } from "lucide-react";
import { requireManager } from "@/lib/auth";
import {
  getDashboardStats,
  listUpcomingBookings,
} from "@/server/admin/queries";
import { formatMoney } from "@/lib/money";
import { formatDateRange } from "@/lib/dates";
import { Card, CardSection } from "@/components/ui/card";
import { StatusChip, type ChipStatus } from "@/components/ui/status-chip";
import { Table, THead, TH, TBody, TD } from "@/components/ui/table";

export const metadata: Metadata = { title: "Admin — Dashboard" };

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function AdminDashboardPage() {
  const session = await requireManager();
  const [stats, upcoming] = await Promise.all([
    getDashboardStats(),
    listUpcomingBookings(),
  ]);
  const firstName = (session.user.name ?? "Manager").split(" ")[0];

  return (
    <main>
      <h1 className="type-display-md">
        {greeting()}, {firstName}
      </h1>
      <p className="type-body-md text-muted mt-2">
        Here is a summary of your portfolio for today.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        <Card>
          <CardSection>
            <div className="flex items-center justify-between">
              <p className="type-label text-muted">Active properties</p>
              <Home className="h-4 w-4 text-muted" strokeWidth={1.5} />
            </div>
            <p className="font-display mt-3 text-4xl">{stats.activeProperties}</p>
            <p className="type-label text-muted mt-2">All properties online</p>
          </CardSection>
        </Card>
        <Card>
          <CardSection>
            <div className="flex items-center justify-between">
              <p className="type-label text-muted">Upcoming bookings</p>
              <CalendarDays className="h-4 w-4 text-muted" strokeWidth={1.5} />
            </div>
            <p className="font-display mt-3 text-4xl">{stats.upcoming}</p>
            <p className="type-label text-muted mt-2">Confirmed, ahead</p>
          </CardSection>
        </Card>
        <Card className={stats.pending > 0 ? "border-l-2 border-l-bronze" : ""}>
          <CardSection>
            <div className="flex items-center justify-between">
              <p className="type-label text-muted">Pending requests</p>
              <CalendarClock className="h-4 w-4 text-bronze" strokeWidth={1.5} />
            </div>
            <p className="font-display mt-3 text-4xl">{stats.pending}</p>
            <p className="type-label mt-2 text-bronze-deep">
              {stats.pending > 0 ? "Require your attention" : "All caught up"}
            </p>
          </CardSection>
        </Card>
      </div>

      <div className="mt-14 flex items-center justify-between">
        <h2 className="type-headline-lg">Upcoming bookings</h2>
        <Link
          href="/admin/bookings"
          className="type-label underline underline-offset-4 hover:text-bronze"
        >
          View all
        </Link>
      </div>

      <Card className="mt-6">
        {upcoming.length === 0 ? (
          <CardSection>
            <p className="type-body-md text-muted">No upcoming bookings.</p>
          </CardSection>
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Guest</TH>
                <TH>Property</TH>
                <TH>Dates</TH>
                <TH>Status</TH>
                <TH className="text-right">Total</TH>
              </tr>
            </THead>
            <TBody>
              {upcoming.map((b) => (
                <tr key={b.id} className="hover:bg-surface-low">
                  <TD>
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="underline underline-offset-4 decoration-outline-variant hover:decoration-ink"
                    >
                      {b.guestName}
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
