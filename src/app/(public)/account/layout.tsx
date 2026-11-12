import { LogOut } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { countGuestUpdates } from "@/server/account/queries";
import { AccountSidebar } from "./sidebar";
import { signOutAction } from "./actions";

/** Auth-gated shell: personal travel space, not a SaaS dashboard (PRD §28). */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();
  const updates = await countGuestUpdates(session.user.id);
  return (
    <div className="container-page grid gap-12 py-14 lg:grid-cols-[220px_1fr]">
      <aside className="hidden lg:block">
        <AccountSidebar
          updates={updates}
          signOutSlot={
            <form action={signOutAction}>
              <button
                type="submit"
                className="type-body-md flex w-full items-center gap-3 px-3 py-2.5 text-muted transition-colors hover:text-ink"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.5} />
                Log out
              </button>
            </form>
          }
        />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
