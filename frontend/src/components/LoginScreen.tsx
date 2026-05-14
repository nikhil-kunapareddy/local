"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";
import { SiteFooter } from "@/components/SiteFooter";

export function LoginScreen() {
  const router = useRouter();
  const [nativeSubmitWarning, setNativeSubmitWarning] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (s) {
      router.replace(s.accountType === "business" ? "/business" : "/consumer");
    }
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.has("username") || params.has("password") || params.has("accountType")) {
      window.history.replaceState({}, "", "/login");
      setNativeSubmitWarning(true);
    }
  }, []);

  return (
    <>
      <div className="login-page">
        <div className="login-card">
          <div className="login-brand">
            <div className="brand-serif">LoCal</div>
            <div className="brand-sub">Intelligence Platform</div>
          </div>
          <p className="page-subtitle" style={{ textAlign: "center", marginBottom: 18 }}>
            Sign in to open your institutional or personal risk workspace.
          </p>
          {nativeSubmitWarning ? (
            <div className="login-error" style={{ marginBottom: 14 }}>
              The form was sent as a plain browser request (credentials appeared in the URL). Use the
              green <strong>Continue</strong> button after the page finishes loading so sign-in runs in
              the app.
            </div>
          ) : null}
          <LoginForm />
          <p className="page-subtitle" style={{ marginTop: 16, fontSize: "0.8rem" }}>
            Demo mode: any non-empty credentials are accepted. Choose Business for the LoCal-style
            dashboard or Consumer for the residential view.
          </p>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
