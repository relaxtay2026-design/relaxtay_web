/**
 * Client-side direct upload to Cloudinary using our signed params
 * (/api/uploads/sign). Returns the public_id to store in the DB.
 * Shared by the edit-page ImageManager and the New-form photo section.
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  if (file.size > 10 * 1024 * 1024)
    throw new Error(`${file.name} is over 10 MB.`);

  const signRes = await fetch("/api/uploads/sign", { method: "POST" });
  if (!signRes.ok) throw new Error("Could not sign upload.");
  const sign = await signRes.json();

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", sign.apiKey);
  fd.append("timestamp", String(sign.timestamp));
  fd.append("folder", sign.folder);
  fd.append("signature", sign.signature);

  const up = await fetch(
    `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
    { method: "POST", body: fd }
  );
  if (!up.ok) throw new Error(`Upload of ${file.name} failed.`);
  const result = await up.json();
  return result.public_id as string;
}
