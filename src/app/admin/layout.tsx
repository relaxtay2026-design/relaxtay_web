import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireManager, signOut } from "@/lib/auth";
import { brand } from "@/lib/brand";
import { AdminSidebar } from "./sidebar";

/** Manager shell (mock 7/8): functional, efficient, clear (PRD §3.7). */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireManager();

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 flex-none flex-col border-r border-border-ghost bg-surface-low md:flex">
        <div className="border-b border-divider p-5">
          <Link href="/" className="font-display text-xl tracking-tight">
            {brand.name.toUpperCase()}
          </Link>
          <p className="type-label text-muted mt-2">
            {session.user.name ?? "Manager"}
          </p>
        </div>
        <AdminSidebar
          signOutSlot={
            <form action={signOutAction}>
              <button
                type="submit"
                className="type-label flex w-full items-center gap-3 px-1 py-2 text-muted transition-colors hover:text-ink"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
                Log out
              </button>
            </form>
          }
        />
      </aside>
      <div className="min-w-0 flex-1 px-6 py-10 md:px-10">{children}</div>
    </div>
  );
}
