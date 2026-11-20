import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/site/header";
import { useShopping } from "@/hooks/use-shopping";
import { catalogQuery } from "@/lib/queries";
import { cartTotal, pageMeta } from "@/lib/marketplace";
import { inr, upiLink } from "@/lib/rules";
import { supabase } from "@/integrations/supabase/client";
export const Route = createFileRoute("/_authenticated/checkout-cart")({
  head: () =>
    pageMeta(
      "Cart payment",
      "Pay for your SplitFlix subscriptions by UPI and submit your transaction reference.",
    ),
  component: CheckoutCart,
});
function CheckoutCart() {
  const { cart, clear, ready } = useShopping();
  const { data, isLoading, error } = useQuery(catalogQuery);
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const plans = (data?.services ?? []).flatMap((s) =>
    s.plans.map((p) => ({ ...p, service: s.name })),
  );
  const total = cartTotal(plans, cart);
  const st = data?.settings;
  const paymentReady = !!st?.upi_id && st.upi_id !== "yourname@upi";
  const valid = cart.length > 0 && cart.every((id) => plans.some((p) => p.id === id));
  const link = upiLink(
    st?.upi_id ?? "",
    st?.upi_name ?? "SplitFlix",
    total,
    "SplitFlix subscriptions",
  );
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || !paymentReady || busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc("submit_cart", { _plan_ids: cart, _utr: utr.trim() });
      if (error) throw error;
      clear();
      await qc.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success("Orders submitted for payment verification");
      await navigate({ to: "/account" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit orders");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-8 font-display text-5xl">Payment</h1>
        {!ready || isLoading ? (
          <p>Loading payment…</p>
        ) : error ? (
          <p>Payment details could not be loaded.</p>
        ) : !valid ? (
          <p>
            Your cart is empty or contains unavailable plans.{" "}
            <Link to="/cart" className="text-primary">
              Return to cart
            </Link>
          </p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            <section>
              <h2 className="mb-4 text-xl font-bold">Order summary</h2>
              {cart.map((id) => {
                const p = plans.find((p) => p.id === id);
                return (
                  p && (
                    <div
                      key={id}
                      className="flex justify-between gap-3 border-b border-border py-4"
                    >
                      <span>
                        {p.service}
                        <small className="block text-muted-foreground">{p.name}</small>
                      </span>
                      <b>{inr(p.price)}</b>
                    </div>
                  )
                );
              })}
              <p className="mt-6 text-2xl font-bold">Total {inr(total)}</p>
              <p className="mt-4 text-sm text-muted-foreground">
                Each subscription is assigned after admin payment verification.
              </p>
            </section>
            <section>
              {paymentReady ? (
                <>
                  <div className="mx-auto w-fit rounded-lg bg-foreground p-4">
                    <QRCodeSVG value={link} size={200} />
                  </div>
                  <p className="mt-3 break-all text-center">{st?.upi_id}</p>
                  <a href={link} className="mt-3 block text-center text-primary">
                    Open UPI app
                  </a>
                  <form onSubmit={submit} className="mt-6 space-y-3">
                    <Label htmlFor="cart-utr">Transaction reference (UTR)</Label>
                    <Input
                      id="cart-utr"
                      required
                      minLength={6}
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                    />
                    <Button type="submit" disabled={busy} className="w-full">
                      {busy ? "Submitting…" : "I've paid — submit orders"}
                    </Button>
                    <p className="text-xs text-muted-foreground">No refunds after credentials are provided, subject to applicable law. <Link to="/refund-policy" className="text-primary">Refund policy</Link></p>
                  </form>
                </>
              ) : (
                <p className="border-l-2 border-primary pl-4">
                  Payments are not configured yet. Please contact support before paying.
                </p>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
