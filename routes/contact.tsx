import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader, SiteFooter } from "@/components/site/header";
import { catalogQuery } from "@/lib/queries";
import { pageMeta, whatsappUrl } from "@/lib/marketplace";
export const Route = createFileRoute("/contact")({
  head: () =>
    pageMeta(
      "Contact & support",
      "Contact SplitFlix about subscriptions, payment and account access.",
    ),
  component: Contact,
});
function Contact() {
  const { data } = useQuery(catalogQuery);
  const url = whatsappUrl(data?.settings?.whatsapp ?? "", "Hi, I need help with SplitFlix.");
  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-16">
        <p className="text-accent">SUPPORT CENTER</p>
        <h1 className="mt-3 font-display text-6xl">Contact SplitFlix</h1>
        <div className="mt-12 grid gap-10 sm:grid-cols-2">
          <section className="border-t border-border pt-6">
            <LifeBuoy className="mb-4 size-8 text-primary" />
            <h2 className="text-xl font-bold">Orders & account support</h2>
            <p className="mt-3 text-muted-foreground">
              Payment questions, login issues, renewals, and order updates.
            </p>
            <Button asChild className="mt-6">
              <Link to="/account">Open support tickets</Link>
            </Button>
          </section>
          <section className="border-t border-border pt-6">
            <MessageCircle className="mb-4 size-8 text-success" />
            <h2 className="text-xl font-bold">WhatsApp</h2>
            {url ? (
              <Button asChild variant="outline" className="mt-6">
                <a href={url} target="_blank" rel="noreferrer">
                  Chat with support
                </a>
              </Button>
            ) : (
              <p className="mt-3 text-muted-foreground">
                WhatsApp is not configured yet. Use an account support ticket.
              </p>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
