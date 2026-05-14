"use client";

import { useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";

/** Requires any valid demo session; both dashboard routes are allowed after login. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [phase, setPhase] = useState<"checking" | "ok" | "redirect">("checking");

  useLayoutEffect(() => {
    const s = getSession();
    if (!s) {
      setPhase("redirect");
      router.replace("/login");
      return;
    }
    setPhase("ok");
  }, [router]);

  if (phase === "ok") {
    return <>{children}</>;
  }

  if (phase === "redirect") {
    return null;
  }

  return (
    <div className="auth-loading" role="status" aria-live="polite">
      <p>Loading workspace…</p>
    </div>
  );
}
