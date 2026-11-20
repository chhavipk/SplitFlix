import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/admin/settings")({ head:()=>pageMeta("Store settings","Manage SplitFlix UPI payment and support settings."), component: Settings });

function Settings() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["settings"], queryFn: async () => (await supabase.from("settings").select("*").eq("id", 1).single()).data });
  const [f, setF] = useState({ site_name: "", upi_id: "", upi_name: "", whatsapp: "" });
  useEffect(() => { if (data) setF({ site_name: data.site_name, upi_id: data.upi_id, upi_name: data.upi_name, whatsapp: data.whatsapp }); }, [data]);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("settings").update(f).eq("id", 1);
    if (error) { toast.error(error.message); return; }
    toast.success("Settings saved"); qc.invalidateQueries();
  };
  const field = (k: keyof typeof f, label: string) => (
    <div className="space-y-1"><Label htmlFor={k}>{label}</Label><Input id={k} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
  );
  return (
    <form onSubmit={save} className="max-w-md space-y-4">
      <h1 className="font-display text-5xl">Settings</h1>
      {field("site_name", "Site name")}{field("upi_id", "UPI ID (payments go here)")}{field("upi_name", "UPI payee name")}{field("whatsapp", "WhatsApp support number")}
      <Button type="submit" className="bg-gradient-primary">Save</Button>
    </form>
  );
}
