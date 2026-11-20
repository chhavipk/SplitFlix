import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("Admins only");
}

type EditInput = { id: string; email?: string | undefined; password?: string | undefined; full_name?: string | undefined; phone?: string | undefined };

export const adminUpdateCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: EditInput) => {
    if (!d?.id) throw new Error("Missing customer");
    if (d.password && d.password.length < 6) throw new Error("Password must be at least 6 characters");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const attrs: { email?: string; password?: string; email_confirm?: boolean } = {};
    if (data.email) { attrs.email = data.email.trim(); attrs.email_confirm = true; }
    if (data.password) attrs.password = data.password;
    if (Object.keys(attrs).length) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, attrs);
      if (error) throw new Error(error.message);
    }
    const { error } = await supabaseAdmin.from("profiles").update({
      ...(data.email ? { email: data.email.trim() } : {}),
      full_name: data.full_name ?? null, phone: data.phone ?? null,
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => { if (!d?.id) throw new Error("Missing customer"); return d; })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.id === context.userId) throw new Error("You cannot delete your own admin account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
