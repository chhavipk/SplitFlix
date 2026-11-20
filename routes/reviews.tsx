import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SiteHeader, SiteFooter } from "@/components/site/header";
import { useAuth } from "@/hooks/use-auth";
import { pageMeta } from "@/lib/marketplace";
import { supabase } from "@/integrations/supabase/client";
export const Route = createFileRoute("/reviews")({
  head: () =>
    pageMeta("Customer reviews", "Read genuine customer reviews of SplitFlix subscriptions."),
  component: Reviews,
});
function Reviews() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [order, setOrder] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const reviews = useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const orders = useQuery({
    queryKey: ["review-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("id,plans(name,services(name))")
        .eq("user_id", user.id)
        .in("status", ["active", "expired"]);
      if (error) throw error;
      return data ?? [];
    },
  });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !order || busy) return;
    setBusy(true);
    const { error } = await supabase
      .from("reviews")
      .insert({
        user_id: user.id,
        order_id: order,
        rating,
        comment: comment.trim(),
        display_name:
          typeof user.user_metadata["full_name"] === "string"
            ? user.user_metadata["full_name"]
            : "Customer",
      });
    setBusy(false);
    if (error) {
      toast.error(
        error.code === "23505" ? "You have already reviewed this subscription." : error.message,
      );
      return;
    }
    toast.success("Review sent for moderation");
    setComment("");
    qc.invalidateQueries({ queryKey: ["reviews"] });
  };
  const list = reviews.data ?? [];
  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="font-display text-6xl">Customer reviews</h1>
        {!!list.length && (
          <p className="mt-3 text-accent">
            {(list.reduce((a, r) => a + r.rating, 0) / list.length).toFixed(1)} / 5 · {list.length}{" "}
            approved reviews
          </p>
        )}
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {list.map((r) => (
            <article key={r.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex gap-1 text-accent">
                {Array.from({ length: r.rating }, (_, i) => (
                  <Star key={i} className="size-4 fill-current" />
                ))}
              </div>
              <p className="my-4 break-words">{r.comment}</p>
              <p className="text-sm text-muted-foreground">{r.display_name} · Verified purchase</p>
            </article>
          ))}
        </div>
        {reviews.isLoading ? (
          <p className="mt-8">Loading reviews…</p>
        ) : reviews.error ? (
          <p className="mt-8">Reviews could not be loaded.</p>
        ) : (
          !list.length && <p className="mt-8 text-muted-foreground">No published reviews yet.</p>
        )}
        <section className="mt-12 max-w-xl border-t border-border pt-8">
          <h2 className="font-display text-3xl">Write a review</h2>
          {!user ? (
            <Button asChild className="mt-5">
              <Link to="/auth">Sign in to review your subscription</Link>
            </Button>
          ) : orders.isLoading ? (
            <p>Loading purchases…</p>
          ) : !orders.data?.length ? (
            <p className="mt-4 text-muted-foreground">
              You can review a subscription after your order is approved.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-5 space-y-4">
              <Label>Subscription</Label>
              <Select value={order} onValueChange={setOrder}>
                <SelectTrigger aria-label="Review subscription">
                  <SelectValue placeholder="Choose your purchase" />
                </SelectTrigger>
                <SelectContent>
                  {orders.data.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.plans?.services?.name} · {o.plans?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-1" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Button
                    key={n}
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`${n} stars`}
                    aria-pressed={rating === n}
                    onClick={() => setRating(n)}
                  >
                    <Star
                      className={n <= rating ? "fill-accent text-accent" : "text-muted-foreground"}
                    />
                  </Button>
                ))}
              </div>
              <Label htmlFor="review-comment">Your experience</Label>
              <Textarea
                id="review-comment"
                required
                minLength={3}
                maxLength={2000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <Button disabled={busy || !order} type="submit">
                Submit review
              </Button>
            </form>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
