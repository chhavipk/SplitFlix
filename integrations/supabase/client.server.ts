import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function isNewApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (isNewApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

// Server-side client with the secret key — bypasses row-level security.
// Use only inside verified server handlers (admin operations such as changing
// or deleting a customer's login). Never import it into browser code.
function createAdminClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !key) {
    const missing = [
      ...(!url ? ["SUPABASE_URL"] : []),
      ...(!key ? ["SUPABASE_SERVICE_ROLE_KEY"] : []),
    ];
    const message = `Missing environment variable(s): ${missing.join(", ")}.`;
    console.error(`[database] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(url, key, {
    global: { fetch: createFetch(key) },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

let _supabaseAdmin: ReturnType<typeof createAdminClient> | undefined;

// Load inside the handler after the caller has been verified:
// const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createAdminClient>, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  },
});
