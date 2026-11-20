import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/site/header";
import { catalogQuery } from "@/lib/queries";
import { inr, upiLink } from "@/lib/rules";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/checkout/$planId")({
  head: () => pageMeta("Checkout", "Pay by UPI for a SplitFlix subscription."),
  component: Checkout,
});

function Checkout() {
  const { planId } = Route.useParams();
  const { user } = Route.useRouteContext();
  const { data } = useQuery(catalogQuery);
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const svc = data?.services.find((s) => s.plans.some((p) => p.id === planId));
  const plan = svc?.plans.find((p) => p.id === planId);
  const st = data?.settings;

  if (!data) return <div className="min-h-screen bg-background"><SiteHeader /></div>;
  if (!plan || !svc) return <div className="min-h-screen bg-background"><SiteHeader /><p className="p-10">Plan not found. <Link to="/plans" className="text-primary">Back to plans</Link></p></div>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!st?.upi_id || st.upi_id === "yourname@upi") { toast.error("Payments are not configured yet. Contact support."); return; }
    setBusy(true);
    const { error } = await supabase.from("orders").insert({ user_id: user.id, plan_id: plan.id, amount: plan.price, utr: utr.trim() });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Order submitted! We'll verify your payment shortly.");
    navigate({ to: "/account" });
  };

  const link = upiLink(st?.upi_id ?? "", st?.upi_name ?? "SplitFlix", plan.price, `${svc.name} ${plan.name}`);
  return (
    <div className="min-h-screen bg-background font-sans">
      <SiteHeader />
      <main className="mx-auto grid max-w-4xl gap-8 px-4 pt-12 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">You're buying</p>
          <h1 className="font-display text-5xl">{svc.name}</h1>
          <p className="text-lg">{plan.name}</p>
          <p className="mt-6 font-display text-6xl text-gradient">{inr(plan.price)}</p>
          <ol className="mt-6 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Scan the QR code with any UPI app and pay exactly {inr(plan.price)}.</li>
            <li>Copy the 12-digit UTR / transaction ID.</li>
            <li>Paste it below and submit.</li>
          </ol>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mx-auto w-fit rounded-xl bg-foreground p-4"><QRCodeSVG value={link} size={200} /></div>
          <p className="mt-3 text-center text-sm text-muted-foreground">UPI ID: <b className="text-foreground">{st?.upi_id}</b></p>
          <a href={link} className="mt-2 block text-center text-sm text-primary sm:hidden">Open UPI app</a>
          <form onSubmit={submit} className="mt-6 space-y-3">
            <Label htmlFor="utr">Transaction ID (UTR)</Label>
            <Input id="utr" value={utr} onChange={(e) => setUtr(e.target.value)} required minLength={6} placeholder="e.g. 412345678901" />
            <p className="text-xs text-muted-foreground">No refunds after credentials are provided, subject to applicable law. <Link to="/refund-policy" className="text-primary">Refund policy</Link></p>
            <Button type="submit" disabled={busy || !st?.upi_id || st.upi_id === "yourname@upi"} className="w-full bg-gradient-primary">I've paid — submit order</Button>
          </form>
        </div>
      </main>
    </div>
  );
}
