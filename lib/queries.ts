import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const catalogQuery = queryOptions({
  queryKey: ["catalog"],
  queryFn: async () => {
    const [s, p, slots, settings] = await Promise.all([
      supabase.from("services").select("*").order("sort"),
      supabase.from("plans").select("*").order("months"),
      supabase.rpc("service_slots_left"),
      supabase.from("settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    if (s.error) throw s.error;
    if (p.error) throw p.error;
    if (slots.error) throw slots.error;
    if (settings.error) throw settings.error;
    return {
      services: (s.data ?? []).filter(svc => svc.active).map((svc) => ({
        ...svc,
        plans: (p.data ?? []).filter((x) => x.service_id === svc.id && x.active),
        slots: (slots.data ?? []).find((x) => x.service_id === svc.id),
      })),
      settings: settings.data,
    };
  },
});
export type CatalogService = Awaited<ReturnType<NonNullable<typeof catalogQuery.queryFn>>>["services"][number];
