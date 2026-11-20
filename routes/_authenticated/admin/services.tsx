import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { inr } from "@/lib/rules";
import { supabase } from "@/integrations/supabase/client";
import { categories, pageMeta } from "@/lib/marketplace";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin/services")({
  head: () =>
    pageMeta(
      "Manage services and plans",
      "Manage SplitFlix subscription categories, features and prices.",
    ),
  component: Services,
});

function Services() {
  const qc = useQueryClient();
  const services = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () =>
      (await supabase.from("services").select("*, plans(*)").order("sort")).data ?? [],
  });
  const refresh = () => qc.invalidateQueries();
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [hue, setHue] = useState("20");
  const [category, setCategory] = useState("OTT");
  const addService = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from("services")
      .insert({
        name,
        tagline,
        category,
        hue: Number(hue),
        sort: (services.data?.length ?? 0) + 1,
      });
    if (error) {
      toast.error(error.message);
      return;
    }
    setName("");
    setTagline("");
    refresh();
  };
  return (
    <div className="space-y-6">
      <h1 className="font-display text-5xl">Services & plans</h1>
      <form
        onSubmit={addService}
        className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-4"
      >
        <Input
          className="w-48"
          placeholder="Service name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          className="w-64"
          placeholder="Tagline"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
        />
        <Input
          className="w-28"
          type="number"
          min={0}
          max={360}
          placeholder="Color 0-360"
          value={hue}
          onChange={(e) => setHue(e.target.value)}
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-40" aria-label="New service category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories
              .filter((c) => c !== "All")
              .map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Button type="submit" className="bg-gradient-primary">
          Add service
        </Button>
      </form>
      {services.data?.map((s) => (
        <div key={s.id} className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="h-4 w-4 rounded-full"
              style={{ background: `oklch(0.6 0.2 ${s.hue})` }}
            />
            <b className="text-lg">{s.name}</b>
            <span className="text-sm text-muted-foreground">{s.tagline}</span>
            <label className="ml-auto flex items-center gap-2 text-sm">
              Visible
              <Switch
                checked={s.active}
                onCheckedChange={async (v) => {
                  await supabase.from("services").update({ active: v }).eq("id", s.id);
                  refresh();
                }}
              />
            </label>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={async () => {
                if (!confirm(`Delete ${s.name} and all its plans?`)) return;
                const { error } = await supabase.from("services").delete().eq("id", s.id);
                if (error) toast.error("Can't delete: it has orders. Hide it instead.");
                refresh();
              }}
            >
              Delete
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            <ServiceDetails s={s} onDone={refresh} />
            {s.plans
              .sort((a, b) => a.months - b.months)
              .map((p) => (
                <PlanRow key={p.id} p={p} onDone={refresh} />
              ))}
            <NewPlan serviceId={s.id} onDone={refresh} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ServiceDetails({
  s,
  onDone,
}: {
  s: Database["public"]["Tables"]["services"]["Row"];
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    name: s.name,
    tagline: s.tagline,
    category: s.category,
    description: s.description,
    features: s.features.join("\n"),
  });
  const save = async () => {
    const { error } = await supabase
      .from("services")
      .update({
        ...form,
        features: form.features
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean),
      })
      .eq("id", s.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Product details saved");
    onDone();
  };
  return (
    <details className="border-y border-border py-3">
      <summary className="cursor-pointer text-sm text-primary">Edit product details</summary>
      <div className="mt-4 grid gap-3">
        <Label>Name</Label>
        <Input
          aria-label={`${s.name} name`}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Label>Tagline</Label>
        <Input
          value={form.tagline}
          onChange={(e) => setForm({ ...form, tagline: e.target.value })}
        />
        <Label>Category</Label>
        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
          <SelectTrigger aria-label={`${s.name} category`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories
              .filter((c) => c !== "All")
              .map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Label>Description</Label>
        <Textarea
          aria-label={`${s.name} description`}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <Label>Features (one per line)</Label>
        <Textarea
          aria-label={`${s.name} features`}
          value={form.features}
          onChange={(e) => setForm({ ...form, features: e.target.value })}
        />
        <Button className="w-fit" onClick={save}>
          Save product details
        </Button>
      </div>
    </details>
  );
}

function PlanRow({
  p,
  onDone,
}: {
  p: {
    id: string;
    name: string;
    months: number;
    price: number;
    mrp: number | null;
    active: boolean;
  };
  onDone: () => void;
}) {
  const [price, setPrice] = useState(String(p.price));
  const [mrp, setMrp] = useState(String(p.mrp ?? ""));
  const [name, setName] = useState(p.name);
  const [months, setMonths] = useState(String(p.months));
  const save = async () => {
    const { error } = await supabase
      .from("plans")
      .update({ name, months: Number(months), price: Number(price), mrp: mrp ? Number(mrp) : null })
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else toast.success("Saved");
    onDone();
  };
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Input
        className="h-8 w-36"
        aria-label="Plan name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        className="h-8 w-20"
        type="number"
        min={1}
        aria-label="Plan months"
        value={months}
        onChange={(e) => setMonths(e.target.value)}
      />
      <span>months</span>
      <span className="text-muted-foreground">Price</span>
      <Input
        className="h-8 w-24"
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <span className="text-muted-foreground">MRP</span>
      <Input
        className="h-8 w-24"
        type="number"
        value={mrp}
        onChange={(e) => setMrp(e.target.value)}
      />
      <Button size="sm" variant="outline" onClick={save}>
        Save
      </Button>
      <Switch
        checked={p.active}
        onCheckedChange={async (v) => {
          await supabase.from("plans").update({ active: v }).eq("id", p.id);
          onDone();
        }}
      />
      <span className="text-xs text-muted-foreground">{inr(p.price)}</span>
    </div>
  );
}

function NewPlan({ serviceId, onDone }: { serviceId: string; onDone: () => void }) {
  const [months, setMonths] = useState("1");
  const [price, setPrice] = useState("");
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const m = Number(months);
    const { error } = await supabase
      .from("plans")
      .insert({
        service_id: serviceId,
        months: m,
        name: m === 1 ? "1 Month" : `${m} Months`,
        price: Number(price),
      });
    if (error) {
      toast.error(error.message);
      return;
    }
    setPrice("");
    onDone();
  };
  return (
    <form
      onSubmit={add}
      className="flex flex-wrap items-center gap-2 border-t border-border pt-3 text-sm"
    >
      <span className="text-muted-foreground">New plan:</span>
      <Input
        className="h-8 w-20"
        type="number"
        min={1}
        value={months}
        onChange={(e) => setMonths(e.target.value)}
      />{" "}
      months
      <Input
        className="h-8 w-24"
        type="number"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
      />
      <Button size="sm" type="submit" variant="secondary">
        Add
      </Button>
    </form>
  );
}
