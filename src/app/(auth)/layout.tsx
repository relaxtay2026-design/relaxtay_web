import Link from "next/link";
import { brand } from "@/lib/brand";

/** Auth chrome: quiet, centered, wordmark on top. */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center px-5 py-16">
      <Link href="/" className="font-display text-3xl tracking-tight">
        {brand.name.toUpperCase()}
      </Link>
      <div className="mt-12 w-full max-w-md">{children}</div>
    </div>
  );
}
