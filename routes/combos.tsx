import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SiteHeader, SiteFooter } from "@/components/site/header";
import { catalogQuery } from "@/lib/queries";
import { useShopping } from "@/hooks/use-shopping";
import { cartTotal, pageMeta } from "@/lib/marketplace";
import { inr } from "@/lib/rules";
export const Route = createFileRoute("/combos")({
  head: () =>
    pageMeta(
      "Build your combo",
      "Choose subscriptions and durations for your own SplitFlix combination.",
    ),
  component: Combos,
});
function Combos() {
  const { data, error, isLoading } = useQuery(catalogQuery);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const { add } = useShopping();
  const plans = (data?.services ?? []).flatMap((s) => s.plans);
  const ids = Object.values(selected).filter(Boolean);
  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-sm uppercase text-accent">Your subscriptions, together</p>
        <h1 className="mt-3 font-display text-6xl">Build your combo</h1>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && <p>Loading subscriptions…</p>}
          {error && <p>Subscriptions could not be loaded.</p>}
          {data?.services
            .filter((s) => s.plans.length > 0)
            .map((s) => (
              <div key={s.id} className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-3xl">{s.name}</h2>
                  <Button
                    aria-label={`Select ${s.name}`}
                    title={`Select ${s.name}`}
                    variant={selected[s.id] ? "default" : "outline"}
                    size="icon"
                    onClick={() =>
                      setSelected((old) => ({
                        ...old,
                        [s.id]: old[s.id] ? "" : (s.plans[0]?.id ?? ""),
                      }))
                    }
                  >
                    {selected[s.id] ? <Check /> : <Plus />}
                  </Button>
                </div>
                {selected[s.id] && (
                  <Select
                    value={selected[s.id] ?? ""}
                    onValueChange={(v) => setSelected((old) => ({ ...old, [s.id]: v }))}
                  >
                    <SelectTrigger className="mt-4" aria-label={`${s.name} duration`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {s.plans.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} · {inr(p.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
        </div>
        <div className="sticky bottom-0 mt-8 flex flex-wrap items-center gap-4 border-t border-border bg-background py-5">
          <span className="flex-1">
            {ids.length} selected · <b>{inr(cartTotal(plans, ids))}</b>
          </span>
          <Button
            disabled={!ids.length}
            onClick={() => {
              ids.forEach(add);
              toast.success("Combination added to cart");
            }}
          >
            Add combo to cart
          </Button>
          <Button asChild variant="outline">
            <Link to="/cart">View cart</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
