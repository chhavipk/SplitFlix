import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site/header";
import { CatalogBrowser } from "@/components/site/catalog-browser";
import { pageMeta } from "@/lib/marketplace";
export const Route = createFileRoute("/saved")({
  head: () => pageMeta("Saved subscriptions", "Your saved SplitFlix subscriptions."),
  component: () => (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pt-12">
        <h1 className="mb-8 font-display text-5xl">Saved subscriptions</h1>
        <CatalogBrowser savedOnly />
      </main>
      <SiteFooter />
    </div>
  ),
});
