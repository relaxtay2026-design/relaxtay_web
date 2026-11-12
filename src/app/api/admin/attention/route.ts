import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAttentionCounts } from "@/server/admin/queries";

/**
 * How many things are waiting on the manager (manager only). The admin
 * sidebar polls this so its dot stays current while the dashboard is open,
 * without the manager having to reload.
 */
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(await getAttentionCounts(), {
    headers: { "Cache-Control": "no-store" },
  });
}
