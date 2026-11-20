import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { daysLeft } from "@/lib/rules";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/admin/accounts")({ head:()=>pageMeta("Account inventory","Manage SplitFlix subscription account inventory."), component: Accounts });

function Accounts() {
  const qc = useQueryClient();
  const services = useQuery({ queryKey: ["admin-services"], queryFn: async () => (await supabase.from("services").select("*, plans(*)").order("sort")).data ?? [] });
  const accounts = useQuery({ queryKey: ["admin-accounts"], queryFn: async () => (await supabase.from("master_accounts").select("*").order("created_at")).data ?? [] });
  const orders = useQuery({ queryKey: ["admin-orders"], queryFn: async () => (await supabase.from("orders").select("*, plans(name, service_id, services(name))").order("created_at", { ascending: false })).data ?? [] });
  const [svc, setSvc] = useState(""); const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [slots, setSlots] = useState("4"); const [notes, setNotes] = useState("");
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!svc) { toast.error("Choose a service"); return; }
    const { error } = await supabase.from("master_accounts").insert({ service_id: svc, login_email: email, login_password: pw, max_slots: Number(slots), notes });
    if (error) { toast.error(error.message); return; }
    setEmail(""); setPw(""); setNotes(""); qc.invalidateQueries();
  };
  return (
    <div className="space-y-6">
      <h1 className="font-display text-5xl">Accounts pool</h1>
      <form onSubmit={add} className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-4">
        <Select value={svc} onValueChange={setSvc}><SelectTrigger className="w-44"><SelectValue placeholder="Service" /></SelectTrigger>
          <SelectContent>{services.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>
        <Input className="w-56" placeholder="Login email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input className="w-40" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} required />
        <Input className="w-24" type="number" min={1} placeholder="Slots" value={slots} onChange={(e) => setSlots(e.target.value)} />
        <Input className="w-48" placeholder="Notes (renewal date…)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button type="submit" className="bg-gradient-primary">Add account</Button>
      </form>
      <div className="grid gap-4 md:grid-cols-2">
        {accounts.data?.map((a) => {
          const used = (orders.data ?? []).filter((o) => o.account_id === a.id && o.status === "active" && daysLeft(o.expires_at) > 0).length;
          return (
            <div key={a.id} className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs uppercase text-muted-foreground">{services.data?.find((s) => s.id === a.service_id)?.name}</p>
              <p className="font-mono">{a.login_email}</p><p className="font-mono text-sm text-muted-foreground">{a.login_password}</p>
              {a.notes && <p className="mt-1 text-sm text-muted-foreground">{a.notes}</p>}
              <div className="mt-3 flex items-center gap-3"><Progress value={(used / a.max_slots) * 100} /><span className="text-sm whitespace-nowrap">{used}/{a.max_slots} used</span></div>
              <Button size="sm" variant="ghost" className="mt-2 text-destructive" onClick={async () => {
                if (!confirm("Remove this account?")) return;
                await supabase.from("master_accounts").delete().eq("id", a.id); qc.invalidateQueries();
              }}>Remove</Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
