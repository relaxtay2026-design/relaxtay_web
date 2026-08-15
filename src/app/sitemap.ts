import type { MetadataRoute } from "next";
import { listActiveSlugs } from "@/server/property/queries";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await listActiveSlugs();
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/properties`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    ...slugs.map(({ slug, updatedAt }) => ({
      url: `${base}/properties/${slug}`,
      lastModified: updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
