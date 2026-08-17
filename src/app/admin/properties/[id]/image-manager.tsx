"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Star, Trash2, UploadCloud } from "lucide-react";
import {
  addImageAction,
  deleteImageAction,
  moveImageAction,
  setPrimaryImageAction,
} from "../actions";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Img = { id: string; url: string; alt: string; isPrimary: boolean };

/**
 * Photography manager (mock 8): upload (when Cloudinary is configured)
 * or add by URL; reorder, set cover, delete.
 */
export function ImageManager({
  propertyId,
  images,
  cloudinaryEnabled,
}: {
  propertyId: string;
  images: Img[];
  cloudinaryEnabled: boolean;
}) {
  const router = useRouter();
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const publicId = await uploadToCloudinary(file);
        const save = new FormData();
        save.append("propertyId", propertyId);
        save.append("src", publicId);
        save.append("alt", file.name.replace(/\.[a-z]+$/i, ""));
        await addImageAction(save);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      {cloudinaryEnabled ? (
        <label
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded border border-dashed border-outline-variant bg-surface-lowest px-6 py-12 text-center transition-colors hover:border-bronze",
            uploading && "pointer-events-none opacity-60"
          )}
        >
          <UploadCloud className="h-6 w-6 text-muted" strokeWidth={1.5} />
          <span className="type-body-md">
            {uploading ? "Uploading…" : "Drag & drop or click to browse"}
          </span>
          <span className="type-label text-muted">JPG or PNG, up to 10 MB</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => uploadFiles(e.target.files)}
          />
        </label>
      ) : (
        <form
          action={async (fd: FormData) => {
            await addImageAction(fd);
            router.refresh();
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <input type="hidden" name="propertyId" value={propertyId} />
          <Input
            name="src"
            placeholder="Paste an image URL (Cloudinary upload activates once configured)"
            required
            className="flex-1"
          />
          <Input name="alt" placeholder="Alt text" className="sm:w-48" />
          <Button type="submit" variant="outline">
            Add image
          </Button>
        </form>
      )}

      {error && <p className="type-body-md text-error mt-4">{error}</p>}

      {images.length > 0 && (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <li key={img.id} className="group relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded">
                <Image
                  src={img.url}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, 200px"
                  className="object-cover"
                />
                {img.isPrimary && (
                  <span className="type-label absolute left-2 top-2 rounded bg-ink/80 px-2 py-0.5 text-ivory">
                    Cover
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between gap-1">
                <div className="flex gap-1">
                  <IconForm
                    action={moveImageAction}
                    imageId={img.id}
                    extra={{ dir: "up" }}
                    disabled={i === 0}
                    title="Move earlier"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </IconForm>
                  <IconForm
                    action={moveImageAction}
                    imageId={img.id}
                    extra={{ dir: "down" }}
                    disabled={i === images.length - 1}
                    title="Move later"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </IconForm>
                  <IconForm
                    action={setPrimaryImageAction}
                    imageId={img.id}
                    disabled={img.isPrimary}
                    title="Set as cover"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </IconForm>
                </div>
                <IconForm
                  action={deleteImageAction}
                  imageId={img.id}
                  title="Delete"
                  confirmMsg="Delete this image?"
                >
                  <Trash2 className="h-3.5 w-3.5 text-error" />
                </IconForm>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IconForm({
  action,
  imageId,
  extra = {},
  disabled,
  title,
  confirmMsg,
  children,
}: {
  action: (fd: FormData) => Promise<void>;
  imageId: string;
  extra?: Record<string, string>;
  disabled?: boolean;
  title: string;
  confirmMsg?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <form
      action={async (fd: FormData) => {
        await action(fd);
        router.refresh();
      }}
      onSubmit={(e) => {
        if (confirmMsg && !confirm(confirmMsg)) e.preventDefault();
      }}
    >
      <input type="hidden" name="imageId" value={imageId} />
      {Object.entries(extra).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button
        type="submit"
        disabled={disabled}
        title={title}
        className="rounded border border-border-ghost p-1.5 transition-colors hover:bg-surface-high disabled:opacity-30"
      >
        {children}
      </button>
    </form>
  );
}
