import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { daysLeft, inr } from "@/lib/rules";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/admin/")({ head:()=>pageMeta("Admin overview","SplitFlix subscription revenue and order overview."), component: Overview });

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="font-display text-4xl">{value}</p></div>;
}

function Overview() {
  const { data } = useQuery({
    queryKey: ["admin-orders-all"],
    queryFn: async () => (await supabase.from("orders").select("*, plans(name, services(name))").order("created_at", { ascending: false })).data ?? [],
  });
  const orders = data ?? [];
  const live = orders.filter((o) => o.status === "active" && daysLeft(o.expires_at) > 0);
  const revenue = orders.filter((o) => o.status === "active" || o.status === "expired").reduce((a, o) => a + o.amount, 0);
  const pending = orders.filter((o) => o.status === "pending");
  const soon = live.filter((o) => daysLeft(o.expires_at) <= 5);
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    const key = d.toISOString().slice(0, 10);
    return { day: key.slice(5), revenue: orders.filter((o) => o.status !== "rejected" && o.status !== "pending" && o.created_at.slice(0, 10) === key).reduce((a, o) => a + o.amount, 0) };
  });
  return (
    <div className="space-y-8">
      <h1 className="font-display text-5xl">Overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue" value={inr(revenue)} /><Stat label="Active subscriptions" value={live.length} />
        <Stat label="Pending orders" value={pending.length} /><Stat label="Expiring in 5 days" value={soon.length} />
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 font-bold">Revenue — last 14 days</h2>
        <div className="h-64"><ResponsiveContainer><BarChart data={days}>
          <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} /><YAxis stroke="var(--muted-foreground)" fontSize={12} />
          <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
          <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
        </BarChart></ResponsiveContainer></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 font-bold">Pending orders <Link to="/admin/orders" className="text-sm text-primary">View all</Link></h2>
          {pending.slice(0, 5).map((o) => <p key={o.id} className="text-sm">{o.plans?.services?.name} {o.plans?.name} · {inr(o.amount)}</p>)}
          {pending.length === 0 && <p className="text-sm text-muted-foreground">All caught up.</p>}
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 font-bold">Expiring soon</h2>
          {soon.map((o) => <p key={o.id} className="text-sm">{o.plans?.services?.name} · {daysLeft(o.expires_at)} days</p>)}
          {soon.length === 0 && <p className="text-sm text-muted-foreground">Nothing expiring.</p>}
        </div>
      </div>
    </div>
  );
}
