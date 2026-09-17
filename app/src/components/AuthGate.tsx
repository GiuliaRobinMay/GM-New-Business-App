"use client";

import type { ReactNode } from "react";
import { getSupabase } from "@/lib/supabase";

/**
 * No sign-in for now (decision 2026-09-17). The only gate is "is Supabase
 * configured" — without the two env vars the app shows setup notes instead
 * of failing on every save. To bring sign-in back, see git history for the
 * email + password LoginCard this file used to hold.
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  if (!getSupabase()) return <SetupCard />;
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
