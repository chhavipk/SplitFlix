import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteFooter, SiteHeader } from "@/components/site/header";
import { catalogQuery } from "@/lib/queries";
import { CatalogBrowser } from "@/components/site/catalog-browser";
import streamingRoom from "@/assets/streaming-room.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SplitFlix — Netflix, Prime & Hotstar from ₹49" },
      {
        name: "description",
        content:
          "Get your own profile on shared Netflix, Prime Video, Disney+ Hotstar, SonyLIV, Spotify and YouTube Premium plans. Pay by UPI.",
      },
      { property: "og:title", content: "SplitFlix — Shared OTT plans from ₹49" },
      {
        property: "og:description",
        content: "Your own profile on premium streaming plans, for a fraction of the price.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const faqs: [string, string][] = [
  [
    "How do I get my login?",
    "After you pay by UPI and submit the transaction ID, we verify it and your login appears in My account — usually within 30 minutes.",
  ],
  [
    "Do I get my own profile?",
    "Yes. Each slot comes with its own profile name and PIN where the service supports it.",
  ],
  [
    "What if it stops working?",
    "Raise a support ticket from your account and we'll fix or replace your slot for the rest of your plan.",
  ],
  ["Can I renew?", "Yes, buy the same plan again before it expires from My account."],
  ["Can I get a refund?", "No refunds are offered after user credentials are provided, subject to rights required by applicable law."],
];

function Index() {
  const { data } = useQuery(catalogQuery);
  const prices = data?.services.flatMap(s=>s.plans.map(p=>p.price)) ?? [];
  const startingPrice = prices.length ? Math.min(...prices) : null;
  return (
    <div className="min-h-screen bg-background font-sans">
      <SiteHeader />
      <section className="relative isolate overflow-hidden">
        <img
          src={streamingRoom}
          alt="Cinema screen, headphones and controller in a home entertainment room"
          width={1536}
          height={1024}
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40 sm:opacity-70"
        />
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-16">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-accent">
            Premium streaming, split smart
          </p>
          <h1 className="font-display text-6xl leading-[0.9] sm:text-8xl">
            SplitFlix
            <br />
            <span className="text-gradient">OTT subscriptions</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Get your own profile on Netflix, Prime Video, Hotstar and more{startingPrice ? ` — from ₹${startingPrice}` : ""}. Pay by UPI, with admin verification.
          </p>
          <div className="mt-8 flex gap-3">
            <Button asChild size="lg" className="bg-gradient-primary shadow-glow">
              <Link to="/plans">Browse plans</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/combos">Build a combo</Link>
            </Button>
          </div>
          <div className="mt-14 grid max-w-lg grid-cols-3 gap-6">
            {[
              [String(data?.services.length ?? 0), "Services"],
              ["UPI", "Payments"],
              ["Support", "In your account"],
            ].map(([a, b]) => (
              <div key={b}>
                <div className="font-display text-4xl">{a}</div>
                <div className="text-sm text-muted-foreground">{b}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 pt-12">
        <h2 className="mb-8 font-display text-5xl">Browse subscriptions</h2>
        <CatalogBrowser />
      </section>
      <section className="mx-auto max-w-3xl px-4 pt-24">
        <h2 className="mb-6 font-display text-5xl">Questions</h2>
        <Accordion type="single" collapsible>
          {faqs.map(([q, a]) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger>{q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
      <SiteFooter />
    </div>
  );
}
