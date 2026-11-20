import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { daysLeft, inr } from "@/lib/rules";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/admin/orders")({ head:()=>pageMeta("Order management","Verify payments and assign SplitFlix subscriptions."), component: Orders });

type Filter = "pending" | "active" | "rejected" | "all";

function Orders() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("pending");
  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await supabase.from("orders").select("*, plans(name, service_id, services(name))").order("created_at", { ascending: false })).data ?? [],
  });
  const profiles = useQuery({ queryKey: ["admin-profiles"], queryFn: async () => (await supabase.from("profiles").select("id, email, full_name")).data ?? [] });
  const accounts = useQuery({ queryKey: ["admin-accounts"], queryFn: async () => (await supabase.from("master_accounts").select("*")).data ?? [] });
  const refresh = () => qc.invalidateQueries();
  const list = (orders.data ?? []).filter((o) => filter === "all" || o.status === filter);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-5xl">Orders</h1>
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList><TabsTrigger value="pending">Pending</TabsTrigger><TabsTrigger value="active">Active</TabsTrigger><TabsTrigger value="rejected">Rejected</TabsTrigger><TabsTrigger value="all">All</TabsTrigger></TabsList>
      </Tabs>
      {list.length === 0 && <p className="text-muted-foreground">No orders here.</p>}
      {list.map((o) => {
        const cust = profiles.data?.find((p) => p.id === o.user_id);
        const usable = (accounts.data ?? []).filter((a) => a.service_id === o.plans?.service_id).map((a) => ({
          ...a, used: (orders.data ?? []).filter((x) => x.account_id === a.id && x.status === "active" && daysLeft(x.expires_at) > 0).length,
        }));
        return <OrderRow key={o.id} o={o} customer={cust?.email ?? o.user_id} accounts={usable} onDone={refresh} />;
      })}
    </div>
  );
}

function OrderRow({ o, customer, accounts, onDone }: {
  o: { id: string; status: string; amount: number; utr: string; created_at: string; expires_at: string | null; account_id: string | null; profile_label: string | null; plans: { name: string; services: { name: string } | null } | null };
  customer: string; accounts: { id: string; login_email: string; max_slots: number; used: number }[]; onDone: () => void;
}) {
  const [acc, setAcc] = useState("");
  const [label, setLabel] = useState("");
  const approve = async () => {
    if (!acc) { toast.error("Choose an account"); return; }
    const { error } = await supabase.rpc("approve_order", { _order_id: o.id, _account_id: acc, _profile_label: label });
    if (error) { toast.error(error.message); return; }
    toast.success("Order approved"); onDone();
  };
  const reject = async () => {
    const note = prompt("Reason for rejecting (shown to customer)") ?? "";
    const { error } = await supabase.from("orders").update({ status: "rejected", admin_note: note }).eq("id", o.id);
    if (error) { toast.error(error.message); return; }
    onDone();
  };
  const remove = async () => {
    if (!confirm("Delete this order?")) return;
    await supabase.from("orders").delete().eq("id", o.id); onDone();
  };
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center gap-3">
        <b>{o.plans?.services?.name} · {o.plans?.name}</b><Badge variant="secondary">{o.status}</Badge>
        <span className="text-sm text-muted-foreground">{customer}</span>
        <span className="ml-auto text-sm">{inr(o.amount)} · UTR <span className="font-mono">{o.utr}</span></span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("en-IN")}
        {o.status === "active" && ` · ${daysLeft(o.expires_at)} days left · profile ${o.profile_label ?? "-"}`}</p>
      {o.status === "pending" && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Select value={acc} onValueChange={setAcc}>
            <SelectTrigger className="w-64"><SelectValue placeholder={accounts.length ? "Assign account" : "No accounts for this service"} /></SelectTrigger>
            <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id} disabled={a.used >= a.max_slots}>{a.login_email} ({a.used}/{a.max_slots})</SelectItem>)}</SelectContent>
          </Select>
          <Input className="w-40" placeholder="Profile / PIN" value={label} onChange={(e) => setLabel(e.target.value)} />
          <Button onClick={approve} className="bg-gradient-primary">Approve</Button>
          <Button variant="outline" onClick={reject}>Reject</Button>
        </div>
      )}
      {o.status !== "pending" && <Button size="sm" variant="ghost" className="mt-2 text-destructive" onClick={remove}>Delete</Button>}
    </div>
  );
}
