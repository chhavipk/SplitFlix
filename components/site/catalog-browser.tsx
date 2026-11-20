import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, LayoutGrid, List, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ServiceCard } from "@/components/site/service-card";
import { catalogQuery } from "@/lib/queries";
import { categories, matchesCatalog } from "@/lib/marketplace";
import { useShopping } from "@/hooks/use-shopping";

export function CatalogBrowser({ savedOnly = false }: { savedOnly?: boolean }) {
  const { data, isLoading, error, refetch } = useQuery(catalogQuery);
  const { saved } = useShopping();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [layout, setLayout] = useState("grid");
  const services = (data?.services ?? []).filter((s) => !savedOnly || saved.includes(s.id));
  const list = services.filter((s) => matchesCatalog(s, search, category));
  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
        <Input
          aria-label="Search subscriptions"
          className="pl-10"
          placeholder="Search subscriptions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-5">
        {categories.map((c) => (
          <Button
            key={c}
            variant={category === c ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(c)}
          >
            {c}{" "}
            <span className="text-xs opacity-70">
              {services.filter((s) => c === "All" || s.category === c).length}
            </span>
          </Button>
        ))}
        <div className="ml-auto flex gap-1">
          <Button
            size="icon"
            variant={layout === "grid" ? "secondary" : "ghost"}
            aria-label="Grid view"
            title="Grid view"
            onClick={() => setLayout("grid")}
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            size="icon"
            variant={layout === "list" ? "secondary" : "ghost"}
            aria-label="List view"
            title="List view"
            onClick={() => setLayout("list")}
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>
      {isLoading && <p className="py-10 text-muted-foreground">Loading subscriptions…</p>}
      {error && (
        <div className="py-10">
          <p>Subscriptions could not be loaded.</p>
          <Button className="mt-3" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}
      {!isLoading && !error && !list.length && (
        <div className="py-12 text-center text-muted-foreground">
          {savedOnly && <Heart className="mx-auto mb-3 size-8" />}
          {savedOnly ? "No saved subscriptions yet." : "No subscriptions match your search."}
        </div>
      )}
      <div
        className={
          layout === "grid"
            ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            : "grid gap-5 sm:grid-cols-2"
        }
      >
        {list.map((s) => (
          <ServiceCard key={s.id} s={s} />
        ))}
      </div>
    </div>
  );
}
