import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Signs Cloudinary direct-upload params (manager only, PRD §11).
 * The browser uploads straight to Cloudinary with this signature —
 * files never pass through our server.
 */
export async function POST() {
  const session = await auth();
  if (session?.user?.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Cloudinary is not configured" },
      { status: 501 }
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "properties";
  const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1").update(toSign).digest("hex");

  return NextResponse.json({ cloudName, apiKey, timestamp, folder, signature });
}
