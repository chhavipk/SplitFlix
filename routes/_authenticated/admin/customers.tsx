import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { inr } from "@/lib/rules";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/marketplace";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { adminDeleteCustomer, adminUpdateCustomer } from "@/lib/admin-users.functions";

export const Route = createFileRoute("/_authenticated/admin/customers")({ head:()=>pageMeta("Customers","Manage SplitFlix customers and subscription history."), component: Customers });

function Customers() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<null | { id: string; email: string; full_name: string; phone: string; password: string }>(null);
  const update = useServerFn(adminUpdateCustomer);
  const del = useServerFn(adminDeleteCustomer);
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!edit) return;
    try { await update({ data: { ...edit, password: edit.password || undefined } }); toast.success("Customer updated"); setEdit(null); qc.invalidateQueries(); }
    catch (err) { toast.error((err as Error).message); }
  };
  const profiles = useQuery({ queryKey: ["admin-profiles-full"], queryFn: async () => (await supabase.from("profiles").select("*").order("created_at", { ascending: false })).data ?? [] });
  const orders = useQuery({ queryKey: ["admin-orders"], queryFn: async () => (await supabase.from("orders").select("*, plans(name, service_id, services(name))").order("created_at", { ascending: false })).data ?? [] });
  const list = (profiles.data ?? []).filter((p) => `${p.email} ${p.full_name}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-6">
      <h1 className="font-display text-5xl">Customers</h1>
      <Input className="max-w-sm" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Orders</TableHead><TableHead>Spent</TableHead><TableHead>Phone</TableHead><TableHead>Password</TableHead><TableHead>Joined</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {list.map((p) => {
              const mine = (orders.data ?? []).filter((o) => o.user_id === p.id);
              const spent = mine.filter((o) => o.status === "active" || o.status === "expired").reduce((a, o) => a + o.amount, 0);
              return (
                <TableRow key={p.id}>
                  <TableCell>{p.full_name} {p.blocked && <Badge variant="destructive">Blocked</Badge>}</TableCell>
                  <TableCell>{p.email}</TableCell><TableCell>{mine.length}</TableCell><TableCell>{inr(spent)}</TableCell>
                  <TableCell>{p.phone ?? "-"}</TableCell><TableCell className="text-xs text-muted-foreground">Hidden (use Edit to set new)</TableCell>
                  <TableCell>{new Date(p.created_at).toLocaleDateString("en-IN")}</TableCell>
                  <TableCell><Button size="sm" variant="outline" onClick={async () => {
                    await supabase.from("profiles").update({ blocked: !p.blocked }).eq("id", p.id); qc.invalidateQueries();
                  }}>{p.blocked ? "Unblock" : "Block"}</Button>
                    <Button size="sm" variant="outline" className="ml-2" onClick={() => setEdit({ id: p.id, email: p.email ?? "", full_name: p.full_name ?? "", phone: p.phone ?? "", password: "" })}>Edit</Button>
                    <Button size="sm" variant="ghost" className="ml-1 text-destructive" onClick={async () => {
                      if (!confirm(`Delete ${p.email}? This removes their login permanently.`)) return;
                      try { await del({ data: { id: p.id } }); toast.success("Customer deleted"); qc.invalidateQueries(); }
                      catch (err) { toast.error((err as Error).message); }
                    }}>Delete</Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit customer</DialogTitle></DialogHeader>
          {edit && <form onSubmit={save} className="space-y-3">
            <div className="space-y-1"><Label>Full name</Label><Input value={edit.full_name} onChange={(e) => setEdit({ ...edit, full_name: e.target.value })} /></div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" required value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></div>
            <div className="space-y-1"><Label>Phone</Label><Input value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></div>
            <div className="space-y-1"><Label>New password</Label><Input type="text" minLength={6} placeholder="Leave empty to keep current" value={edit.password} onChange={(e) => setEdit({ ...edit, password: e.target.value })} /></div>
            <Button type="submit" className="w-full bg-gradient-primary">Save</Button>
          </form>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
