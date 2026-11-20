import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/marketplace";
export const Route = createFileRoute("/_authenticated/admin/reviews")({
  head: () => pageMeta("Review moderation", "Approve or hide SplitFlix customer reviews."),
  component: Moderation,
});
function Moderation() {
  const qc = useQueryClient();
  const { data, error, isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  return (
    <div>
      <h1 className="font-display text-5xl">Customer reviews</h1>
      {isLoading && <p>Loading…</p>}
      {error && <p>Reviews could not be loaded.</p>}
      {data?.length === 0 && (
        <p className="mt-6 text-muted-foreground">No reviews submitted yet.</p>
      )}
      <div className="mt-6 space-y-4">
        {data?.map((r) => (
          <article key={r.id} className="rounded-lg border border-border p-5">
            <div className="flex flex-wrap gap-3">
              <b>{r.display_name}</b>
              <span>{r.rating}/5</span>
              <Badge variant={r.approved ? "default" : "secondary"}>
                {r.approved ? "Published" : "Pending"}
              </Badge>
            </div>
            <p className="my-4 break-words">{r.comment}</p>
            <Button
              variant="outline"
              onClick={async () => {
                const { error } = await supabase
                  .from("reviews")
                  .update({ approved: !r.approved })
                  .eq("id", r.id);
                if (error) {
                  toast.error(error.message);
                  return;
                }
                toast.success(r.approved ? "Review hidden" : "Review published");
                qc.invalidateQueries({ queryKey: ["admin-reviews"] });
                qc.invalidateQueries({ queryKey: ["reviews"] });
              }}
            >
              {r.approved ? "Hide" : "Approve"}
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
