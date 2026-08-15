import type { Metadata } from "next";
import { Eye, EyeOff, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  listAdminProperties,
  listAdminReviews,
} from "@/server/admin/queries";
import { Card, CardSection } from "@/components/ui/card";
import { Table, THead, TH, TBody, TD } from "@/components/ui/table";
import { ReviewForm } from "./review-form";
import {
  togglePublishAction,
  toggleFeatureAction,
  deleteReviewAction,
} from "./actions";

export const metadata: Metadata = { title: "Admin — Reviews" };

export default async function AdminReviewsPage() {
  const [reviews, properties] = await Promise.all([
    listAdminReviews(),
    listAdminProperties(),
  ]);

  return (
    <main>
      <h1 className="type-display-md">Reviews</h1>
      <p className="type-body-md text-muted mt-2 max-w-xl">
        Curated guest words (PRD §46). The bronze star picks which reviews
        appear in the homepage testimonial strip.
      </p>

      <Card className="mt-8 max-w-3xl">
        <CardSection>
          <h2 className="type-headline-md mb-5">Add a review</h2>
          <ReviewForm
            properties={properties.map((p) => ({ id: p.id, title: p.title }))}
          />
        </CardSection>
      </Card>

      <Card className="mt-8">
        {reviews.length === 0 ? (
          <CardSection>
            <p className="type-body-md text-muted">No reviews yet.</p>
          </CardSection>
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Property</TH>
                <TH>Guest</TH>
                <TH>Rating</TH>
                <TH>Review</TH>
                <TH className="text-right">Actions</TH>
              </tr>
            </THead>
            <TBody>
              {reviews.map((r) => (
                <tr
                  key={r.id}
                  className={r.isPublished ? "" : "opacity-50"}
                >
                  <TD>{r.property.title}</TD>
                  <TD>{r.authorName}</TD>
                  <TD>
                    <span className="flex items-center gap-1">
                      {r.rating}
                      <Star className="h-3.5 w-3.5 fill-current text-bronze" />
                    </span>
                  </TD>
                  <TD className="max-w-md">
                    <span className="type-body-md text-muted line-clamp-2">
                      {r.body}
                    </span>
                  </TD>
                  <TD>
                    <div className="flex justify-end gap-1.5">
                      <form action={toggleFeatureAction}>
                        <input type="hidden" name="reviewId" value={r.id} />
                        <button
                          type="submit"
                          title={
                            r.isFeatured
                              ? "Remove from homepage strip"
                              : "Feature on homepage"
                          }
                          className="rounded border border-border-ghost p-1.5 hover:bg-surface-high"
                        >
                          <Star
                            className={cn(
                              "h-3.5 w-3.5",
                              r.isFeatured
                                ? "fill-current text-bronze"
                                : "text-muted"
                            )}
                          />
                        </button>
                      </form>
                      <form action={togglePublishAction}>
                        <input type="hidden" name="reviewId" value={r.id} />
                        <button
                          type="submit"
                          title={r.isPublished ? "Unpublish" : "Publish"}
                          className="rounded border border-border-ghost p-1.5 hover:bg-surface-high"
                        >
                          {r.isPublished ? (
                            <Eye className="h-3.5 w-3.5" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </form>
                      <form action={deleteReviewAction}>
                        <input type="hidden" name="reviewId" value={r.id} />
                        <button
                          type="submit"
                          title="Delete"
                          className="rounded border border-border-ghost p-1.5 hover:bg-surface-high"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-error" />
                        </button>
                      </form>
                    </div>
                  </TD>
                </tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </main>
  );
}
