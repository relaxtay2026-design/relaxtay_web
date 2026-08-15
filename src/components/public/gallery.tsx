"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Grip, X } from "lucide-react";

type GalleryImage = { url: string; alt: string };

/**
 * Property gallery (PRD §12):
 * desktop — one large + four supporting images; mobile — swipeable
 * scroll-snap strip with a counter. Clicking anything opens a minimal
 * full-screen lightbox (arrows, counter, ESC).
 */
export function Gallery({ images }: { images: GalleryImage[] }) {
  const [open, setOpen] = React.useState<number | null>(null);

  return (
    <>
      {/* Desktop grid */}
      <div className="hidden gap-2 md:grid md:grid-cols-4 md:grid-rows-2 md:[&>button:first-child]:col-span-2 md:[&>button:first-child]:row-span-2">
        {images.slice(0, 5).map((img, i) => (
          <button
            key={img.url}
            onClick={() => setOpen(i)}
            className="group relative block aspect-[4/3] overflow-hidden rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze"
            aria-label={`Open photo ${i + 1}`}
          >
            <Image
              src={img.url}
              alt={img.alt}
              fill
              sizes="(max-width: 768px) 100vw, 25vw"
              priority={i === 0}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </button>
        ))}
        {images.length > 5 && (
          <button
            onClick={() => setOpen(0)}
            className="type-label absolute bottom-6 right-6 inline-flex items-center gap-2 rounded border border-ink bg-ivory/95 px-4 py-2.5 text-ink hover:bg-ivory"
          >
            <Grip className="h-3.5 w-3.5" />
            All photos ({images.length})
          </button>
        )}
      </div>

      {/* Mobile strip */}
      <div className="relative md:hidden">
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setOpen(i)}
              className="relative aspect-[4/3] w-[88%] flex-none snap-center overflow-hidden rounded"
              aria-label={`Open photo ${i + 1}`}
            >
              <Image
                src={img.url}
                alt={img.alt}
                fill
                sizes="88vw"
                priority={i === 0}
                className="object-cover"
              />
            </button>
          ))}
        </div>
        <span className="type-label absolute bottom-3 right-5 rounded bg-ink/70 px-2 py-1 text-ivory">
          {images.length} photos
        </span>
      </div>

      {open !== null && (
        <Lightbox images={images} index={open} onClose={() => setOpen(null)} />
      )}
    </>
  );
}

function Lightbox({
  images,
  index,
  onClose,
}: {
  images: GalleryImage[];
  index: number;
  onClose: () => void;
}) {
  const [i, setI] = React.useState(index);
  const prev = React.useCallback(
    () => setI((n) => (n - 1 + images.length) % images.length),
    [images.length]
  );
  const next = React.useCallback(
    () => setI((n) => (n + 1) % images.length),
    [images.length]
  );

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-ink/95"
      role="dialog"
      aria-modal="true"
      aria-label="Photo gallery"
    >
      <div className="flex items-center justify-between p-5">
        <span className="type-label text-ivory/80">
          {i + 1} / {images.length}
        </span>
        <button
          onClick={onClose}
          aria-label="Close gallery"
          className="rounded p-2 text-ivory/80 hover:text-ivory focus-visible:outline-2 focus-visible:outline-bronze"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="relative flex-1">
        <Image
          src={images[i].url}
          alt={images[i].alt}
          fill
          sizes="100vw"
          className="object-contain"
        />
        <button
          onClick={prev}
          aria-label="Previous photo"
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded p-3 text-ivory/80 hover:text-ivory focus-visible:outline-2 focus-visible:outline-bronze"
        >
          <ChevronLeft className="h-7 w-7" />
        </button>
        <button
          onClick={next}
          aria-label="Next photo"
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded p-3 text-ivory/80 hover:text-ivory focus-visible:outline-2 focus-visible:outline-bronze"
        >
          <ChevronRight className="h-7 w-7" />
        </button>
      </div>
      <div className="p-5" />
    </div>
  );
}
