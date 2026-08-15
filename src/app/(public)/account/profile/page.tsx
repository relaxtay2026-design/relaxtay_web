import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Divider } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await requireUser();
  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    include: { accounts: { select: { provider: true } } },
  });
  const providers = user.accounts.map((a) => a.provider);

  return (
    <main>
      <h1 className="type-display-md">Profile</h1>
      <div className="mt-10">
        <ProfileForm
          name={user.name}
          email={user.email}
          phone={user.phone ?? ""}
        />
      </div>

      <Divider className="my-10 max-w-md" />

      <section>
        <h2 className="type-headline-md mb-4">Sign-in methods</h2>
        <ul className="type-body-md space-y-2 text-muted">
          <li>
            Email &amp; password —{" "}
            {providers.includes("credentials") ? (
              <span className="text-ink">connected</span>
            ) : (
              <Link
                href="/forgot-password"
                className="underline underline-offset-4"
              >
                set a password
              </Link>
            )}
          </li>
          <li>
            Google —{" "}
            {providers.includes("google") ? (
              <span className="text-ink">connected</span>
            ) : (
              <span>
                not connected (sign in with Google using this email to link)
              </span>
            )}
          </li>
        </ul>
      </section>
    </main>
  );
}
