import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/site/header";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How SplitFlix Works — Pay by UPI, Watch Tonight" },
      { name: "description", content: "Choose a plan, pay by UPI, submit your transaction ID and get your OTT login in your account within minutes." },
      { property: "og:title", content: "How SplitFlix Works" },
      { property: "og:description", content: "Four simple steps from checkout to streaming." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: How,
});

const steps = [
  ["Pick a plan", "Choose your service and how many months you want."],
  ["Pay by UPI", "Scan the QR code with any UPI app — GPay, PhonePe, Paytm."],
  ["Submit transaction ID", "Paste the 12-digit UTR so we can match your payment."],
  ["Start watching", "Your login and profile appear in My account once verified."],
];

function How() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 pt-14">
        <h1 className="font-display text-6xl">How it works</h1>
        <ol className="mt-10 grid gap-6 sm:grid-cols-2">
          {steps.map(([t, d], i) => (
            <li key={t} className="rounded-xl border border-border bg-card p-6">
              <div className="font-display text-5xl text-gradient">0{i + 1}</div>
              <h2 className="mt-2 text-lg font-bold">{t}</h2>
              <p className="text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
        <Button asChild size="lg" className="mt-10 bg-gradient-primary"><Link to="/plans">See plans</Link></Button>
      </main>
      <SiteFooter />
    </div>
  );
}
