import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, Heart, Menu, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useShopping } from "@/hooks/use-shopping";
import { useQuery } from "@tanstack/react-query";
import { catalogQuery } from "@/lib/queries";
import { whatsappUrl } from "@/lib/marketplace";

export function Logo() {
  return (
    <Link to="/" className="font-display text-3xl tracking-wider">
      <span className="text-gradient">SPLIT</span>FLIX
    </Link>
  );
}

export function SiteHeader() {
  const { user, isAdmin } = useAuth();
  const { cart } = useShopping();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Logo />
        <nav className="hidden gap-5 text-sm text-muted-foreground sm:flex">
          <Link
            to="/plans"
            className="hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Plans
          </Link>
          <Link
            to="/how-it-works"
            className="hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            How it works
          </Link>
          <Link to="/combos">Combos</Link>
          <Link to="/reviews">Reviews</Link>
          <Link to="/contact">Contact</Link>
          {user && (
            <Link
              to="/account"
              className="hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              My account
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="text-accent">
              Admin
            </Link>
          )}
        </nav>
        <div className="ml-auto flex gap-2">
          <Button asChild size="icon" variant="ghost" title="Saved subscriptions">
            <Link to="/saved" aria-label="Saved subscriptions">
              <Heart className="size-4" />
            </Link>
          </Button>
          <Button asChild size="icon" variant="ghost" title="Cart">
            <Link to="/cart" aria-label={`Cart, ${cart.length} items`} className="relative">
              <ShoppingCart className="size-4" />
              {cart.length > 0 && (
                <span className="absolute right-0 top-0 rounded-full bg-primary px-1 text-xs text-primary-foreground">
                  {cart.length}
                </span>
              )}
            </Link>
          </Button>
          {user ? (
            <Button variant="outline" size="sm" onClick={signOut}>
              Sign out
            </Button>
          ) : (
            <Button asChild size="sm" className="bg-gradient-primary">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
          <Button
            className="sm:hidden"
            size="icon"
            variant="ghost"
            aria-label="Open navigation"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <Menu />
          </Button>
        </div>
      </div>
      {open && (
        <nav className="flex flex-wrap gap-4 border-t border-border px-4 py-4 text-sm sm:hidden">
          <Link to="/plans">Plans</Link>
          <Link to="/combos">Combos</Link>
          <Link to="/reviews">Reviews</Link>
          <Link to="/contact">Contact</Link>
          {user && <Link to="/account">My account</Link>}
          {isAdmin && <Link to="/admin">Admin</Link>}
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  const { data } = useQuery(catalogQuery);
  const whatsapp = whatsappUrl(data?.settings?.whatsapp ?? "", "Hi, I need help with SplitFlix.");
  return (
    <footer className="mt-24 border-t border-border/60 py-10 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-4">
        <Logo />
        <p>
          Shared OTT subscriptions at a fraction of the price. © {new Date().getFullYear()}{" "}
          SplitFlix
        </p>
        <nav className="flex flex-wrap gap-4">
          <Link to="/contact">Contact</Link>
          <Link to="/reviews">Reviews</Link>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/refund-policy">Refund policy</Link>
        </nav>
      </div>
      {whatsapp && (
        <Button
          asChild
          size="icon"
          className="fixed bottom-6 right-6 z-40"
          title="WhatsApp support"
        >
          <a href={whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp support">
            <MessageCircle />
          </a>
        </Button>
      )}
    </footer>
  );
}
