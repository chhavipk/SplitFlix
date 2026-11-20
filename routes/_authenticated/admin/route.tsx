import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { Logo } from "@/components/site/header";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta } from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" });
    if (!data) throw redirect({ to: "/account" });
  },
  head: () => pageMeta("Administration", "SplitFlix store administration."),
  component: AdminLayout,
});

const links = [
  ["/admin", "Overview"], ["/admin/orders", "Orders"], ["/admin/services", "Services & plans"],
  ["/admin/accounts", "Accounts pool"], ["/admin/customers", "Customers"], ["/admin/tickets", "Support"], ["/admin/reviews", "Reviews"], ["/admin/settings", "Settings"],
] as const;

function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-background font-sans">
      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar p-5 md:block">
        <Logo />
        <p className="mb-6 text-xs uppercase tracking-widest text-muted-foreground">Admin</p>
        <nav className="flex flex-col gap-1 text-sm">
          {links.map(([to, label]) => (
            <Link key={to} to={to} activeOptions={{ exact: true }} className="rounded-md px-3 py-2 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              activeProps={{ className: "bg-sidebar-accent text-foreground" }}>{label}</Link>
          ))}
          <Link to="/" className="mt-6 px-3 text-xs text-muted-foreground">← Back to store</Link>
        </nav>
      </aside>
      <div className="flex-1 overflow-x-auto">
        <nav className="flex gap-3 overflow-x-auto border-b border-border p-3 text-sm md:hidden">
          {links.map(([to, label]) => <Link key={to} to={to} activeOptions={{ exact: true }} activeProps={{ className: "text-primary" }} className="whitespace-nowrap">{label}</Link>)}
        </nav>
        <main className="p-6 md:p-10"><Outlet /></main>
      </div>
    </div>
  );
}
