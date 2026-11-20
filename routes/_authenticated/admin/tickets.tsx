import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/admin/tickets")({ head:()=>pageMeta("Support tickets","Reply to SplitFlix customer support requests."), component: Tickets });

function Tickets() {
  const tickets = useQuery({ queryKey: ["admin-tickets"], queryFn: async () => (await supabase.from("tickets").select("*").order("created_at", { ascending: false })).data ?? [] });
  const profiles = useQuery({ queryKey: ["admin-profiles"], queryFn: async () => (await supabase.from("profiles").select("id, email, full_name")).data ?? [] });
  return (
    <div className="space-y-6">
      <h1 className="font-display text-5xl">Support tickets</h1>
      {tickets.data?.length === 0 && <p className="text-muted-foreground">No tickets yet.</p>}
      {tickets.data?.map((t) => <Ticket key={t.id} t={t} who={profiles.data?.find((p) => p.id === t.user_id)?.email ?? ""} />)}
    </div>
  );
}

function Ticket({ t, who }: { t: { id: string; subject: string; message: string; reply: string | null; status: string; created_at: string }; who: string }) {
  const qc = useQueryClient();
  const [reply, setReply] = useState(t.reply ?? "");
  const send = async () => {
    const { error } = await supabase.from("tickets").update({ reply, status: "closed" }).eq("id", t.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Reply sent"); qc.invalidateQueries({ queryKey: ["admin-tickets"] });
  };
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap gap-2"><b>{t.subject}</b><Badge variant={t.status === "open" ? "default" : "outline"}>{t.status}</Badge>
        <span className="ml-auto text-sm text-muted-foreground">{who} · {new Date(t.created_at).toLocaleString("en-IN")}</span></div>
      <p className="mt-2 text-sm">{t.message}</p>
      <Textarea className="mt-3" placeholder="Write a reply" value={reply} onChange={(e) => setReply(e.target.value)} />
      <Button size="sm" className="mt-2 bg-gradient-primary" onClick={send}>Send reply & close</Button>
    </div>
  );
}
