import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await requireUser();
  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { marketingOptIn: true },
  });

  return (
    <main>
      <h1 className="type-display-md">Settings</h1>
      <section className="mt-10">
        <h2 className="type-headline-md mb-4">Email preferences</h2>
        <SettingsForm optedIn={user.marketingOptIn} />
      </section>
    </main>
  );
}
