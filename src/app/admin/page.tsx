import type { Metadata } from "next";
import Link from "next/link";
import { BellRing, CalendarDays, CalendarClock, Home } from "lucide-react";
import { requireManager } from "@/lib/auth";
import {
  getAttentionCounts,
  getDashboardStats,
  listUpcomingBookings,
} from "@/server/admin/queries";
import { formatMoney } from "@/lib/money";
import { formatDateRange } from "@/lib/dates";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardSection } from "@/components/ui/card";
import { StatusChip, type ChipStatus } from "@/components/ui/status-chip";
import { Table, THead, TH, TBody, TD } from "@/components/ui/table";
import { ClickableRow } from "@/components/admin/clickable-row";

export const metadata: Metadata = { title: "Admin — Dashboard" };

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function AdminDashboardPage() {
  const session = await requireManager();
  const [stats, upcoming, attention] = await Promise.all([
    getDashboardStats(),
    listUpcomingBookings(),
    getAttentionCounts(),
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

      {attention.total > 0 && (
        <div
          role="status"
          className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 rounded border border-error/30 bg-error-container/40 px-5 py-4"
        >
          <BellRing className="h-5 w-5 flex-none text-error" strokeWidth={1.5} />
          <div className="min-w-0 flex-1">
            <p className="type-body-md font-medium text-on-error-container">
              Waiting for your decision
            </p>
            <ul className="type-body-md mt-1 text-on-error-container">
              {attention.requests > 0 && (
                <li>
                  {attention.requests} booking request
                  {attention.requests === 1 ? "" : "s"} to approve or decline
                </li>
              )}
              {attention.cancellations > 0 && (
                <li>
                  {attention.cancellations} guest
                  {attention.cancellations === 1 ? " has" : "s have"} asked to
                  cancel a confirmed stay
                </li>
              )}
            </ul>
          </div>
          <Link
            href={
              attention.requests > 0
                ? "/admin/bookings?tab=pending"
                : "/admin/bookings"
            }
            className={buttonVariants({ size: "sm" })}
          >
            Review now
          </Link>
        </div>
      )}

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
                <ClickableRow key={b.id} href={`/admin/bookings/${b.id}`}>
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
                </ClickableRow>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </main>
  );
}
