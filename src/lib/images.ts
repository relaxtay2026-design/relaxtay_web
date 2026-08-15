/**
 * PropertyImage.src holds either a full URL (seed placeholders) or a
 * Cloudinary public ID (production, Phase 6). Resolve to a renderable URL.
 */
export function imageUrl(src: string): string {
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto/${src}`;
}
