import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/site/header";
import { CatalogBrowser } from "@/components/site/catalog-browser";

export const Route = createFileRoute("/plans")({
  head: () => ({
    meta: [
      { title: "All Plans & Prices — SplitFlix" },
      { name: "description", content: "Compare shared plans for Netflix, Prime Video, Hotstar, SonyLIV, Spotify and YouTube Premium. 1, 3 and 12 month options." },
      { property: "og:title", content: "All Plans & Prices — SplitFlix" },
      { property: "og:description", content: "1, 3 and 12 month shared OTT plans with live slot availability." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Plans,
});

function Plans() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pt-14">
        <h1 className="font-display text-6xl">All plans</h1>
        <div className="mt-8"><CatalogBrowser/></div>
      </main>
      <SiteFooter />
    </div>
  );
}
