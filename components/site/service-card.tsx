import { Link } from "@tanstack/react-router";
import { Heart, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShopping } from "@/hooks/use-shopping";
import { Badge } from "@/components/ui/badge";
import { discountPct, inr, slotsLeft } from "@/lib/rules";
import type { CatalogService } from "@/lib/queries";

export function ServiceCard({ s }: { s: CatalogService }) {
  const left = slotsLeft(s.slots?.total ?? 0, s.slots?.used ?? 0);
  const cheapest = [...s.plans].sort((a, b) => a.price - b.price)[0];
  const { saved, toggleSaved } = useShopping();
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-glow">
      <div className="relative flex h-36 items-end bg-secondary p-5">
        <h3 className="font-display text-4xl tracking-wide text-foreground drop-shadow">
          {s.name}
        </h3>
        <Badge className="absolute left-4 top-4" variant={left > 0 ? "secondary" : "destructive"}>
          {left > 0 ? `${left} slots left` : "Restocking"}
        </Badge>
        <Button
          className="absolute right-3 top-3"
          size="icon"
          variant="ghost"
          aria-label={`Save ${s.name}`}
          title={`Save ${s.name}`}
          aria-pressed={saved.includes(s.id)}
          onClick={() => toggleSaved(s.id)}
        >
          <Heart className={saved.includes(s.id) ? "fill-primary text-primary" : ""} />
        </Button>
      </div>
      <div className="space-y-3 p-5">
        <p className="text-sm text-muted-foreground">{s.tagline}</p>
        <div className="space-y-2">
          {s.plans.map((p) => (
            <Link
              key={p.id}
              to="/checkout/$planId"
              params={{ planId: p.id }}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm transition hover:border-primary"
            >
              <span>{p.name}</span>
              <span className="flex items-center gap-2">
                {p.mrp ? <s className="text-xs text-muted-foreground">{inr(p.mrp)}</s> : null}
                <b>{inr(p.price)}</b>
                {discountPct(p.price, p.mrp) > 0 && (
                  <span className="text-xs text-success">-{discountPct(p.price, p.mrp)}%</span>
                )}
              </span>
            </Link>
          ))}
        </div>
        {cheapest && (
          <p className="text-xs text-muted-foreground">
            From {inr(cheapest.price)} · {cheapest.name}
          </p>
        )}
        <Button asChild variant="outline" className="w-full">
          <Link to="/product/$serviceId" params={{ serviceId: s.id }}>
            View subscription <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
