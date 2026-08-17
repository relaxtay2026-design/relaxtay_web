"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createAmenityAction,
  renameAmenityAction,
  deleteAmenityAction,
} from "../amenity-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Amenity = { id: string; name: string; usageCount: number };

/** Global amenity list: add, rename, delete (impr. A2). */
export function AmenitiesManager({ amenities }: { amenities: Amenity[] }) {
  const router = useRouter();
  const [newName, setNewName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");

  async function add() {
    if (!newName.trim()) return;
    setBusy(true);
    setError(null);
    const result = await createAmenityAction(newName);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setNewName("");
    router.refresh();
  }

  return (
    <div>
      <div className="flex gap-3">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="New amenity, e.g. Sauna"
          className="max-w-60"
        />
        <Button
          type="button"
          variant="outline"
          disabled={busy || !newName.trim()}
          onClick={add}
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>
      {error && (
        <p className="type-label mt-2 text-error normal-case">{error}</p>
      )}

      <ul className="mt-6 divide-y divide-divider">
        {amenities.map((a) => (
          <li key={a.id} className="flex items-center gap-3 py-2.5">
            {editingId === a.id ? (
              <form
                action={async (fd: FormData) => {
                  await renameAmenityAction(fd);
                  setEditingId(null);
                  router.refresh();
                }}
                className="flex flex-1 items-center gap-2"
              >
                <input type="hidden" name="amenityId" value={a.id} />
                <Input
                  name="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-9 max-w-60"
                  autoFocus
                />
                <button
                  type="submit"
                  title="Save"
                  className="rounded border border-border-ghost p-1.5 hover:bg-surface-high"
                >
                  <Check className="h-3.5 w-3.5 text-sage" />
                </button>
                <button
                  type="button"
                  title="Cancel"
                  onClick={() => setEditingId(null)}
                  className="rounded border border-border-ghost p-1.5 hover:bg-surface-high"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <>
                <span className="type-body-md flex-1">{a.name}</span>
                <span className="type-label text-muted">
                  {a.usageCount} propert{a.usageCount === 1 ? "y" : "ies"}
                </span>
                <button
                  type="button"
                  title="Rename"
                  onClick={() => {
                    setEditingId(a.id);
                    setEditName(a.name);
                  }}
                  className="rounded border border-border-ghost p-1.5 hover:bg-surface-high"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <form
                  action={async (fd: FormData) => {
                    await deleteAmenityAction(fd);
                    router.refresh();
                  }}
                  onSubmit={(e) => {
                    if (
                      !confirm(
                        `Delete “${a.name}”? It will be removed from ${a.usageCount} propert${a.usageCount === 1 ? "y" : "ies"}.`
                      )
                    )
                      e.preventDefault();
                  }}
                >
                  <input type="hidden" name="amenityId" value={a.id} />
                  <button
                    type="submit"
                    title="Delete"
                    className="rounded border border-border-ghost p-1.5 hover:bg-surface-high"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-error" />
                  </button>
                </form>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
