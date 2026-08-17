"use client";

import { setPropertyStatusAction } from "./actions";

/** One-click archive/activate from the list row (impr. A1). */
export function StatusToggle({
  propertyId,
  title,
  active,
}: {
  propertyId: string;
  title: string;
  active: boolean;
}) {
  return (
    <form
      action={setPropertyStatusAction}
      className="inline"
      onSubmit={(e) => {
        const msg = active
          ? `Archive “${title}”? It will disappear from the public site and stop taking bookings. Existing bookings are kept.`
          : `Activate “${title}”? It will appear on the public site and accept bookings.`;
        if (!confirm(msg)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={propertyId} />
      <input type="hidden" name="status" value={active ? "inactive" : "active"} />
      <button
        type="submit"
        className="type-label underline underline-offset-4 text-muted hover:text-ink"
      >
        {active ? "Archive" : "Activate"}
      </button>
    </form>
  );
}
