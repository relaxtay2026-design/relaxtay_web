"use client";

import * as React from "react";
import Image from "next/image";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, UploadCloud } from "lucide-react";
import { savePropertyAction, type PropertyFormState } from "./actions";
import { createAmenityAction } from "../amenity-actions";
import { propertyFields, type PropertyFieldName } from "./property-schema";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import { imageUrl } from "@/lib/images";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const initial: PropertyFormState = { error: null };
const DRAFT_KEY = "property-draft-new";

type Amenity = { id: string; name: string };
type PendingImage = { src: string; alt: string };

type PropertyValues = {
  id?: string;
  title: string;
  location: string;
  summary: string;
  description: string;
  price: number; // dollars
  currency: string;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  minNights: number;
  status: string;
  amenityIds: string[];
};

const selectCls =
  "type-body-md h-11 w-full rounded border border-border-input bg-surface-lowest px-3 focus:border-bronze focus:outline-none focus:ring-1 focus:ring-bronze";

/**
 * Add/Edit form (mock 8), hardened per admin feedback:
 * - controlled fields + instant zod validation → a failed save NEVER
 *   clears your input (impr. A4)
 * - create mode auto-saves a draft to localStorage, restored on return
 * - amenities can be added inline (impr. A2)
 * - photos can be added before the property exists (impr. A3)
 */
export function PropertyForm({
  values,
  amenities,
  cloudinaryEnabled = false,
}: {
  values: PropertyValues;
  amenities: Amenity[];
  cloudinaryEnabled?: boolean;
}) {
  const router = useRouter();
  const isCreate = !values.id;
  const [state, formAction, pending] = useActionState(
    savePropertyAction,
    initial
  );

  const [form, setForm] = React.useState({
    title: values.title,
    location: values.location,
    summary: values.summary,
    description: values.description,
    price: values.price ? String(values.price) : "",
    currency: values.currency,
    maxGuests: String(values.maxGuests),
    bedrooms: String(values.bedrooms),
    beds: String(values.beds),
    bathrooms: String(values.bathrooms),
    minNights: String(values.minNights),
    status: values.status,
  });
  const [checkedAmenities, setCheckedAmenities] = React.useState<string[]>(
    values.amenityIds
  );
  const [amenityList, setAmenityList] = React.useState(amenities);
  const [pendingImages, setPendingImages] = React.useState<PendingImage[]>([]);
  const [fieldErrors, setFieldErrors] = React.useState<
    Partial<Record<PropertyFieldName, string>>
  >({});
  const restored = React.useRef(false);

  // ── Draft: restore on mount, persist on change, clear on success ──
  React.useEffect(() => {
    if (!isCreate || restored.current) return;
    restored.current = true;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.form) setForm((f) => ({ ...f, ...draft.form }));
      if (Array.isArray(draft.checkedAmenities))
        setCheckedAmenities(draft.checkedAmenities);
      if (Array.isArray(draft.pendingImages))
        setPendingImages(draft.pendingImages);
    } catch {
      /* corrupt draft — ignore */
    }
  }, [isCreate]);

  React.useEffect(() => {
    if (!isCreate || !restored.current) return;
    const t = setTimeout(() => {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ form, checkedAmenities, pendingImages })
      );
    }, 400);
    return () => clearTimeout(t);
  }, [form, checkedAmenities, pendingImages, isCreate]);

  React.useEffect(() => {
    if (state.savedId) {
      if (isCreate) localStorage.removeItem(DRAFT_KEY);
      router.push(`/admin/properties/${state.savedId}?saved=1`);
    }
  }, [state.savedId, isCreate, router]);

  // ── Instant validation (shared zod schema) ──
  function validateField(name: PropertyFieldName, value: string) {
    const result = propertyFields[name].safeParse(value);
    setFieldErrors((e) => ({
      ...e,
      [name]: result.success ? undefined : result.error.issues[0].message,
    }));
    return result.success;
  }

  function set(name: PropertyFieldName, value: string) {
    setForm((f) => ({ ...f, [name]: value }));
    if (fieldErrors[name]) validateField(name, value);
  }

  function validateAll(): boolean {
    let ok = true;
    (Object.keys(propertyFields) as PropertyFieldName[]).forEach((name) => {
      if (!validateField(name, form[name])) ok = false;
    });
    return ok;
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!validateAll()) {
      e.preventDefault();
      document
        .querySelector("[data-field-error]")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  // ── Inline amenity add (impr. A2) ──
  const [newAmenity, setNewAmenity] = React.useState("");
  const [amenityError, setAmenityError] = React.useState<string | null>(null);
  const [addingAmenity, setAddingAmenity] = React.useState(false);
  async function addAmenity() {
    if (!newAmenity.trim()) return;
    setAddingAmenity(true);
    setAmenityError(null);
    const result = await createAmenityAction(newAmenity);
    setAddingAmenity(false);
    if (!result.ok) {
      setAmenityError(result.error);
      return;
    }
    setAmenityList((list) =>
      list.some((a) => a.id === result.amenity.id)
        ? list
        : [...list, result.amenity]
    );
    setCheckedAmenities((c) =>
      c.includes(result.amenity.id) ? c : [...c, result.amenity.id]
    );
    setNewAmenity("");
  }

  // ── Photos before save (create mode, impr. A3) ──
  const [imgUrl, setImgUrl] = React.useState("");
  const [imgError, setImgError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function uploadPendingFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setImgError(null);
    try {
      for (const file of Array.from(files)) {
        const publicId = await uploadToCloudinary(file);
        setPendingImages((imgs) => [
          ...imgs,
          { src: publicId, alt: file.name.replace(/\.[a-z]+$/i, "") },
        ]);
      }
    } catch (err) {
      setImgError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const err = (name: PropertyFieldName) =>
    fieldErrors[name] ? (
      <p data-field-error className="type-label mt-1.5 text-error normal-case">
        {fieldErrors[name]}
      </p>
    ) : null;

  return (
    <form action={formAction} onSubmit={onSubmit} className="max-w-2xl">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      {isCreate && (
        <input
          type="hidden"
          name="pendingImages"
          value={JSON.stringify(pendingImages)}
        />
      )}
      {/* Controlled values travel via hidden mirrors for the action */}
      {(
        [
          "title",
          "location",
          "summary",
          "description",
          "price",
          "currency",
          "maxGuests",
          "bedrooms",
          "beds",
          "bathrooms",
          "minNights",
          "status",
        ] as const
      ).map((name) => (
        <input key={name} type="hidden" name={name} value={form[name]} />
      ))}

      <section>
        <h2 className="type-headline-md">Basic information</h2>
        <p className="type-body-md text-muted mt-1 mb-6">
          The primary details that define the listing.
        </p>
        <div className="space-y-6">
          <div>
            <Label htmlFor="f-title">Property name</Label>
            <Input
              id="f-title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              onBlur={() => validateField("title", form.title)}
              placeholder="e.g. The Glasshouse Retreat"
            />
            {err("title")}
          </div>
          <div>
            <Label htmlFor="f-location">Location</Label>
            <Input
              id="f-location"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              onBlur={() => validateField("location", form.location)}
              placeholder="City, Province"
            />
            {err("location")}
          </div>
          <div>
            <Label htmlFor="f-summary">Short summary (cards &amp; search)</Label>
            <Textarea
              id="f-summary"
              value={form.summary}
              onChange={(e) => set("summary", e.target.value)}
              onBlur={() => validateField("summary", form.summary)}
              className="min-h-20"
              placeholder="One or two sentences shown on property cards…"
            />
            {err("summary")}
          </div>
          <div>
            <Label htmlFor="f-description">Full description</Label>
            <Textarea
              id="f-description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              onBlur={() => validateField("description", form.description)}
              className="min-h-40"
              placeholder="Describe the atmosphere, architecture, and unique selling points…"
            />
            {err("description")}
          </div>
        </div>
      </section>

      <Divider className="my-10" />

      <section>
        <h2 className="type-headline-md mb-6">Pricing &amp; capacity</h2>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          <div>
            <Label htmlFor="f-price">Nightly rate</Label>
            <Input
              id="f-price"
              type="number"
              min={1}
              step="0.01"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              onBlur={() => validateField("price", form.price)}
            />
            {err("price")}
          </div>
          <div>
            <Label htmlFor="f-currency">Currency</Label>
            <select
              id="f-currency"
              value={form.currency}
              onChange={(e) => set("currency", e.target.value)}
              className={selectCls}
            >
              <option value="USD">USD</option>
              <option value="CAD">CAD</option>
            </select>
          </div>
          <div>
            <Label htmlFor="f-minNights">Minimum nights</Label>
            <Input
              id="f-minNights"
              type="number"
              min={1}
              value={form.minNights}
              onChange={(e) => set("minNights", e.target.value)}
            />
            {err("minNights")}
          </div>
          <div>
            <Label htmlFor="f-maxGuests">Max guests</Label>
            <Input
              id="f-maxGuests"
              type="number"
              min={1}
              value={form.maxGuests}
              onChange={(e) => set("maxGuests", e.target.value)}
            />
            {err("maxGuests")}
          </div>
          <div>
            <Label htmlFor="f-bedrooms">Bedrooms</Label>
            <Input
              id="f-bedrooms"
              type="number"
              min={0}
              value={form.bedrooms}
              onChange={(e) => set("bedrooms", e.target.value)}
            />
            {err("bedrooms")}
          </div>
          <div>
            <Label htmlFor="f-beds">Beds</Label>
            <Input
              id="f-beds"
              type="number"
              min={1}
              value={form.beds}
              onChange={(e) => set("beds", e.target.value)}
            />
            {err("beds")}
          </div>
          <div>
            <Label htmlFor="f-bathrooms">Bathrooms</Label>
            <Input
              id="f-bathrooms"
              type="number"
              min={1}
              value={form.bathrooms}
              onChange={(e) => set("bathrooms", e.target.value)}
            />
            {err("bathrooms")}
          </div>
          <div>
            <Label htmlFor="f-status">Status</Label>
            <select
              id="f-status"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className={selectCls}
            >
              <option value="active">Active</option>
              <option value="inactive">Archived</option>
            </select>
          </div>
        </div>
      </section>

      <Divider className="my-10" />

      <section>
        <h2 className="type-headline-md mb-1">Amenities</h2>
        <p className="type-body-md text-muted mb-6">
          Select the features available at this property — or add a new one.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {amenityList.map((a) => (
            <label key={a.id} className="flex items-center gap-2.5">
              <input
                type="checkbox"
                name="amenityIds"
                value={a.id}
                checked={checkedAmenities.includes(a.id)}
                onChange={(e) =>
                  setCheckedAmenities((c) =>
                    e.target.checked
                      ? [...c, a.id]
                      : c.filter((id) => id !== a.id)
                  )
                }
                className="h-4 w-4 accent-ink"
              />
              <span className="type-body-md">{a.name}</span>
            </label>
          ))}
        </div>
        <div className="mt-5 flex gap-3">
          <Input
            value={newAmenity}
            onChange={(e) => setNewAmenity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addAmenity();
              }
            }}
            placeholder="New amenity, e.g. Sauna"
            className="max-w-60"
          />
          <Button
            type="button"
            variant="outline"
            size="md"
            disabled={addingAmenity || !newAmenity.trim()}
            onClick={addAmenity}
          >
            <Plus className="h-3.5 w-3.5" />
            {addingAmenity ? "Adding…" : "Add"}
          </Button>
        </div>
        {amenityError && (
          <p className="type-label mt-2 text-error normal-case">
            {amenityError}
          </p>
        )}
      </section>

      {isCreate && (
        <>
          <Divider className="my-10" />
          <section>
            <h2 className="type-headline-md mb-1">Photography</h2>
            <p className="type-body-md text-muted mb-6">
              Add photos now — they&apos;re saved together with the property.
              The first image becomes the cover.
            </p>

            {cloudinaryEnabled ? (
              <label
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-3 rounded border border-dashed border-outline-variant bg-surface-lowest px-6 py-10 text-center transition-colors hover:border-bronze",
                  uploading && "pointer-events-none opacity-60"
                )}
              >
                <UploadCloud className="h-6 w-6 text-muted" strokeWidth={1.5} />
                <span className="type-body-md">
                  {uploading ? "Uploading…" : "Drag & drop or click to browse"}
                </span>
                <span className="type-label text-muted">
                  JPG or PNG, up to 10 MB
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => uploadPendingFiles(e.target.files)}
                />
              </label>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  value={imgUrl}
                  onChange={(e) => setImgUrl(e.target.value)}
                  placeholder="Paste an image URL (file upload activates once Cloudinary is configured)"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!imgUrl.trim()}
                  onClick={() => {
                    setPendingImages((imgs) => [
                      ...imgs,
                      { src: imgUrl.trim(), alt: form.title || "Property photo" },
                    ]);
                    setImgUrl("");
                  }}
                >
                  Add image
                </Button>
              </div>
            )}
            {imgError && (
              <p className="type-label mt-2 text-error normal-case">{imgError}</p>
            )}

            {pendingImages.length > 0 && (
              <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {pendingImages.map((img, i) => (
                  <li key={`${img.src}-${i}`} className="relative">
                    <div className="relative aspect-[4/3] overflow-hidden rounded">
                      <Image
                        src={imageUrl(img.src)}
                        alt={img.alt}
                        fill
                        sizes="(max-width: 640px) 50vw, 200px"
                        className="object-cover"
                      />
                      {i === 0 && (
                        <span className="type-label absolute left-2 top-2 rounded bg-ink/80 px-2 py-0.5 text-ivory">
                          Cover
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      title="Remove"
                      onClick={() =>
                        setPendingImages((imgs) =>
                          imgs.filter((_, idx) => idx !== i)
                        )
                      }
                      className="mt-2 rounded border border-border-ghost p-1.5 transition-colors hover:bg-surface-high"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-error" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {state.error && (
        <p className="type-body-md mt-8 rounded border border-error/30 bg-error-container/40 px-4 py-3 text-on-error-container">
          {state.error}
        </p>
      )}

      <div className="mt-10 flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save property"}
        </Button>
        {isCreate && (
          <span className="type-label text-muted">
            Draft auto-saves in this browser
          </span>
        )}
      </div>
    </form>
  );
}
