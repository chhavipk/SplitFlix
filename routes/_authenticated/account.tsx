import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiteHeader } from "@/components/site/header";
import { daysLeft, inr } from "@/lib/rules";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => pageMeta("My account", "Manage SplitFlix subscriptions, credentials and support tickets."),
  component: Account,
});

const statusVariant = { pending: "secondary", active: "default", rejected: "destructive", expired: "outline" } as const;

function Credentials({ orderId }: { orderId: string }) {
  const { data } = useQuery({
    queryKey: ["creds", orderId],
    queryFn: async () => (await supabase.rpc("my_credentials", { _order_id: orderId })).data?.[0] ?? null,
  });
  if (!data) return null;
  return (
    <div className="mt-3 grid gap-1 rounded-lg bg-muted p-3 font-mono text-sm">
      <span>Email: {data.login_email}</span><span>Password: {data.login_password}</span>
      {data.profile_label && <span>Profile: {data.profile_label}</span>}
    </div>
  );
}

function Account() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const orders = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => (await supabase.from("orders").select("*, plans(name, id, services(name))").order("created_at", { ascending: false })).data ?? [],
  });
  const tickets = useQuery({
    queryKey: ["my-tickets"],
    queryFn: async () => (await supabase.from("tickets").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const sendTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("tickets").insert({ user_id: user.id, subject, message });
    if (error) { toast.error(error.message); return; }
    toast.success("Ticket sent"); setSubject(""); setMessage("");
    qc.invalidateQueries({ queryKey: ["my-tickets"] });
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 pt-12">
        <h1 className="font-display text-5xl">My account</h1>
        <p className="text-muted-foreground">{user.email}</p>
        <Tabs defaultValue="subs" className="mt-8">
          <TabsList><TabsTrigger value="subs">Subscriptions</TabsTrigger><TabsTrigger value="support">Support</TabsTrigger></TabsList>
          <TabsContent value="subs" className="space-y-4 pt-4">
            {orders.data?.length === 0 && <p className="text-muted-foreground">No orders yet. <Link to="/plans" className="text-primary">Browse plans</Link></p>}
            {orders.data?.map((o) => {
              const expired = o.status === "active" && daysLeft(o.expires_at) === 0;
              const status = expired ? "expired" : o.status;
              return (
                <div key={o.id} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-bold">{o.plans?.services?.name} · {o.plans?.name}</h3>
                    <Badge variant={statusVariant[status]}>{status}</Badge>
                    <span className="ml-auto text-sm text-muted-foreground">{inr(o.amount)} · UTR {o.utr}</span>
                  </div>
                  {status === "active" && <><p className="mt-2 text-sm text-success">{daysLeft(o.expires_at)} days left</p><Credentials orderId={o.id} /></>}
                  {status === "pending" && <p className="mt-2 text-sm text-muted-foreground">We're verifying your payment.</p>}
                  {status === "rejected" && <p className="mt-2 text-sm text-destructive">{o.admin_note || "Payment could not be verified. Contact support."}</p>}
                  {(status === "active" || status === "expired") && o.plans && (
                    <Button asChild size="sm" variant="outline" className="mt-3"><Link to="/checkout/$planId" params={{ planId: o.plans.id }}>Renew</Link></Button>
                  )}
                </div>
              );
            })}
          </TabsContent>
          <TabsContent value="support" className="space-y-4 pt-4">
            <form onSubmit={sendTicket} className="space-y-3 rounded-xl border border-border bg-card p-5">
              <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
              <Textarea placeholder="Describe the issue" value={message} onChange={(e) => setMessage(e.target.value)} required />
              <Button type="submit" className="bg-gradient-primary">Send ticket</Button>
            </form>
            {tickets.data?.map((t) => (
              <div key={t.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex gap-2"><b>{t.subject}</b><Badge variant="outline">{t.status}</Badge></div>
                <p className="mt-1 text-sm text-muted-foreground">{t.message}</p>
                {t.reply && <p className="mt-3 rounded-lg bg-muted p-3 text-sm">Reply: {t.reply}</p>}
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
