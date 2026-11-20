import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/site/header";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — SplitFlix" },
      {
        name: "description",
        content: "Sign in or create your SplitFlix account to buy and manage OTT subscriptions.",
      },
      { property: "og:title", content: "Sign in — SplitFlix" },
      { property: "og:description", content: "Access your SplitFlix account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up" | "code">("in");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "code") {
      if (codeSent) {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token: code.trim(),
          type: "email",
        });
        setBusy(false);
        if (error) {
          toast.error(error.message);
          return;
        }
        navigate({ to: "/account" });
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false, emailRedirectTo: window.location.origin },
        });
        setBusy(false);
        if (error) {
          toast.error(error.message);
          return;
        }
        setCodeSent(true);
        toast.success("Check your email for a sign-in link or access code.");
      }
      return;
    }
    if (mode === "up") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
      });
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      if (!data.session) {
        toast.success("Check your email to confirm your account.");
        return;
      }
      navigate({ to: "/account" });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      navigate({ to: "/account" });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero bg-background px-4 font-sans">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-8"
      >
        <Logo />
        <Tabs
          value={mode}
          onValueChange={(v) => {
            setMode(v as "in" | "up" | "code");
            setCodeSent(false);
          }}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="in">Sign in</TabsTrigger>
            <TabsTrigger value="up">Sign up</TabsTrigger>
            <TabsTrigger value="code">Email access</TabsTrigger>
          </TabsList>
        </Tabs>
        {mode === "up" && (
          <div className="space-y-1">
            <Label htmlFor="n">Full name</Label>
            <Input id="n" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        )}
        <div className="space-y-1">
          <Label htmlFor="e">Email</Label>
          <Input
            id="e"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {mode !== "code" && (
          <div className="space-y-1">
            <Label htmlFor="p">Password</Label>
            <Input
              id="p"
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        )}
        {mode === "code" && codeSent && (
          <div className="space-y-1">
            <Label htmlFor="access-code">Email access code</Label>
            <Input
              id="access-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              required
            />
            <p className="text-xs text-muted-foreground">
              If your email has a sign-in link instead, open that link.
            </p>
          </div>
        )}
        <Button type="submit" disabled={busy} className="w-full bg-gradient-primary">
          {mode === "code"
            ? codeSent
              ? "Verify code"
              : "Send access email"
            : mode === "in"
              ? "Sign in"
              : "Create account"}
        </Button>
      </form>
    </div>
  );
}
