import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader, SiteFooter } from "@/components/site/header";
import { useShopping } from "@/hooks/use-shopping";
import { catalogQuery } from "@/lib/queries";
import { inr } from "@/lib/rules";
import { cartTotal, pageMeta } from "@/lib/marketplace";
export const Route = createFileRoute("/cart")({
  head: () =>
    pageMeta("Your cart", "Review your selected SplitFlix subscriptions before paying by UPI."),
  component: Cart,
});
function Cart() {
  const { cart, remove, ready } = useShopping();
  const { data, isLoading, error } = useQuery(catalogQuery);
  const plans = (data?.services ?? []).flatMap((s) =>
    s.plans.map((p) => ({ ...p, service: s.name })),
  );
  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-5xl">Your cart</h1>
        {!ready || isLoading ? (
          <p className="mt-8">Loading cart…</p>
        ) : error ? (
          <p className="mt-8">Prices could not be loaded. Please try again.</p>
        ) : (
          <>
            <div className="mt-8 divide-y divide-border">
              {cart.map((id) => {
                const p = plans.find((p) => p.id === id);
                return (
                  <div key={id} className="flex items-center gap-4 py-5">
                    <div className="flex-1">
                      <b>{p?.service ?? "Unavailable subscription"}</b>
                      <p className="text-sm text-muted-foreground">
                        {p?.name ?? "Remove this plan before checkout"}
                      </p>
                    </div>
                    {p && <b>{inr(p.price)}</b>}
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Remove from cart"
                      aria-label={`Remove ${p?.service ?? "plan"}`}
                      onClick={() => remove(id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
            {!cart.length ? (
              <div className="py-12 text-center">
                <ShoppingBag className="mx-auto mb-4 size-10 text-muted-foreground" />
                <p>Your cart is empty.</p>
                <Button asChild className="mt-5">
                  <Link to="/plans">Browse subscriptions</Link>
                </Button>
              </div>
            ) : (
              <div className="mt-6 border-t border-border pt-6">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span>{inr(cartTotal(plans, cart))}</span>
                </div>
                <Button
                  asChild
                  className="mt-6 w-full"
                  disabled={cart.some((id) => !plans.some((p) => p.id === id))}
                >
                  <Link to="/checkout-cart">Continue to payment</Link>
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
