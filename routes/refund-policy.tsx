import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site/header";
import { pageMeta } from "@/lib/marketplace";
export const Route = createFileRoute("/refund-policy")({
  head: () =>
    pageMeta("Refund policy", "SplitFlix refund terms for delivered subscription credentials."),
  component: () => (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-display text-5xl">Refund policy</h1>
        <p className="mt-8 text-lg">
          No refunds are offered after user credentials have been provided.
        </p>
        <p className="mt-5 text-muted-foreground">
          For payment or access issues, contact support through My account. This policy does not
          limit rights or remedies required by applicable law.
        </p>
      </main>
      <SiteFooter />
    </div>
  ),
});
