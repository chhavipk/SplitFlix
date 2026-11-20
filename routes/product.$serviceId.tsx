import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ShoppingCart, Check, Heart } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/site/header";
import { ServiceCard } from "@/components/site/service-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { catalogQuery } from "@/lib/queries";
import { inr, slotsLeft } from "@/lib/rules";
import { pageMeta } from "@/lib/marketplace";
import { useShopping } from "@/hooks/use-shopping";

export const Route = createFileRoute("/product/$serviceId")({
  loader: async ({ context, params }) => {
    const catalog = await context.queryClient.ensureQueryData(catalogQuery);
    return { service: catalog.services.find(s=>s.id===params.serviceId) };
  },
  head: ({ params, loaderData }) =>
    pageMeta(
      loaderData?.service?.name ?? `Subscription ${params.serviceId.slice(0, 8)}`,
      loaderData?.service?.tagline || "Compare subscription options, prices and availability on SplitFlix.",
    ),
  component: Product,
});
function Product() {
  const { serviceId } = Route.useParams();
  const { data, isLoading, error } = useQuery(catalogQuery);
  const [selected, setSelected] = useState("");
  const { add, saved, toggleSaved } = useShopping();
  const s = data?.services.find((s) => s.id === serviceId);
  const plan = s?.plans.find((p) => p.id === selected) ?? s?.plans[0];
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        {isLoading ? (
          <p>Loading subscription…</p>
        ) : error ? (
          <p>Subscription could not be loaded.</p>
        ) : !s ? (
          <p>
            Subscription not found. <Link to="/plans">All plans</Link>
          </p>
        ) : (
          <>
            <Link to="/plans" className="text-sm text-muted-foreground">
              ← All subscriptions
            </Link>
            <div className="mt-8 grid gap-10 md:grid-cols-2">
              <div className="flex min-h-64 flex-col justify-center border-y border-border bg-secondary p-8">
                <Badge className="mb-5 w-fit">{s.category}</Badge>
                <h1 className="font-display text-6xl">{s.name}</h1>
                <p className="mt-4 text-muted-foreground">{s.tagline}</p>
                <Button className="mt-6 w-fit" variant="outline" onClick={() => toggleSaved(s.id)}>
                  <Heart className={saved.includes(s.id) ? "fill-primary text-primary" : ""} />
                  {saved.includes(s.id) ? "Saved" : "Save subscription"}
                </Button>
              </div>
              <div>
                <p className="mb-5 text-sm text-muted-foreground">
                  {slotsLeft(s.slots?.total ?? 0, s.slots?.used ?? 0)} slots available
                </p>
                <fieldset>
                  <legend className="mb-3 font-bold">Choose a plan</legend>
                  <div className="grid grid-cols-2 gap-3">
                    {s.plans.map((p) => (
                      <Button
                        key={p.id}
                        className="h-auto flex-col items-start whitespace-normal p-4"
                        variant={plan?.id === p.id ? "default" : "outline"}
                        aria-pressed={plan?.id === p.id}
                        onClick={() => setSelected(p.id)}
                      >
                        <span>{p.name}</span>
                        <b className="text-xl">{inr(p.price)}</b>
                        {p.mrp && <s className="text-xs opacity-70">{inr(p.mrp)}</s>}
                      </Button>
                    ))}
                  </div>
                </fieldset>
                {plan && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button
                      onClick={() => {
                        add(plan.id);
                        toast.success("Added to cart");
                      }}
                    >
                      <ShoppingCart className="size-4" />
                      Add to cart
                    </Button>
                    <Button asChild variant="outline">
                      <Link to="/checkout/$planId" params={{ planId: plan.id }}>
                        Buy now
                      </Link>
                    </Button>
                  </div>
                )}
                <p className="mt-5 text-sm text-muted-foreground">
                  UPI payment · Admin verification · Login in My account
                </p>
              </div>
            </div>
            <section className="py-12">
              <h2 className="font-display text-3xl">Description & features</h2>
              <p className="mt-4 max-w-3xl text-muted-foreground">{s.description || s.tagline}</p>
              <ul className="mt-4 space-y-2">
                {s.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check className="size-5 text-success" />
                    {feature}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="mb-5 font-display text-3xl">Related subscriptions</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data?.services
                  .filter((x) => x.id !== s.id && x.category === s.category)
                  .slice(0, 3)
                  .map((x) => (
                    <ServiceCard key={x.id} s={x} />
                  ))}
              </div>
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
