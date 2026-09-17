"use client";

import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { getSupabase } from "@/lib/supabase";

/**
 * Wraps the page content. Three states besides "signed in": Supabase not
 * configured (show setup notes), session still loading (show nothing), and
 * signed out (show the login card).
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const supabase = getSupabase();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  if (!supabase) return <SetupCard />;
  if (session === undefined) return null;
  if (!session) return <LoginCard supabase={supabase} />;
  return <>{children}</>;
}

function SetupCard() {
  return (
    <section className="card card--pad accent-orange">
      <p className="eyebrow">Setup</p>
      <p className="section-title mt-2">Supabase is not connected yet</p>
      <p className="muted mt-2" style={{ maxWidth: 560 }}>
        The app needs <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> — locally in{" "}
        <code>app/.env.local</code>, on a host in its environment settings. Step by step in{" "}
        <code>supabase/README.md</code>.
      </p>
    </section>
  );
}

function LoginCard({ supabase }: { supabase: SupabaseClient }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setMessage(error.message);
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) setMessage(error.message);
        else if (!data.session) setMessage("Account created. Check your email to confirm, then sign in.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card card--pad accent-violet" style={{ maxWidth: 420 }}>
      <p className="eyebrow">Backbone</p>
      <p className="section-title mt-2">{mode === "signin" ? "Sign in" : "Create your account"}</p>
      <form onSubmit={submit} className="mt-4 stack-sm">
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="field"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mt-3">
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="field"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {message && (
          <p className="help mt-3" style={{ color: "var(--ink-soft)" }}>
            {message}
          </p>
        )}
        <div className="row mt-4">
          <button className="btn btn--primary" type="submit" disabled={busy}>
            {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
          <button
            className="btn btn--quiet"
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setMessage(null);
            }}
          >
            {mode === "signin" ? "First time? Create account" : "Have an account? Sign in"}
          </button>
        </div>
      </form>
    </section>
  );
}

/** Renders nothing until there is a session to sign out of. */
export function SignOutButton({ className = "btn btn--quiet" }: { className?: string }) {
  const supabase = getSupabase();
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSignedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, [supabase]);
  if (!supabase || !signedIn) return null;
  return (
    <button className={className} onClick={() => supabase.auth.signOut()}>
      Sign out
    </button>
  );
}
