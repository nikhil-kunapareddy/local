"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clearSession, getSession } from "@/lib/auth";
import { getApiBase } from "@/lib/api";
import { SiteFooter } from "@/components/SiteFooter";
import { DashboardViewTabs } from "@/components/DashboardViewTabs";

const BostonRiskMap = dynamic(
  () => import("@/components/BostonRiskMap").then((m) => m.BostonRiskMap),
  {
    ssr: false,
    loading: () => <div className="boston-map-loading">Loading Boston risk map…</div>,
  },
);

export function BusinessDashboard() {
  const router = useRouter();
  const username = getSession()?.username ?? "";
  const [toast, setToast] = useState<{ msg: string; error: boolean } | null>(null);

  function signOut() {
    clearSession();
    router.push("/login");
  }

  async function pingApi() {
    try {
      const res = await fetch(`${getApiBase()}/api/health`);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { status: string; service: string };
      setToast({ msg: `API: ${data.status} · ${data.service}`, error: false });
    } catch {
      setToast({
        msg: "Could not reach Python API. Start backend on port 8000.",
        error: true,
      });
    }
  }

  function generateReport() {
    const panel = document.getElementById("business-panel");
    if (panel) {
      panel.animate(
        [
          { transform: "translateY(0)" },
          { transform: "translateY(-4px)" },
          { transform: "translateY(0)" },
        ],
        { duration: 420, easing: "ease-out" },
      );
    }
    const loc = (document.getElementById("asset-location") as HTMLInputElement | null)?.value?.trim();
    const suffix = loc ? ` for “${loc}”` : "";
    window.alert(`Report generation queued${suffix} (demo).`);
  }

  function generateLocation() {
    const input = document.getElementById("asset-location") as HTMLInputElement | null;
    if (input && !input.value.trim()) {
      input.focus();
      input.placeholder = "Add a county or city to personalize the narrative.";
    } else {
      window.alert("Location captured for downstream models (demo).");
    }
  }

  return (
    <>
      <div className="app-shell">
        <aside className="sidebar">
          <div>
            <div className="brand-serif">LoCal</div>
            <div className="brand-sub">Intelligence Platform</div>
          </div>
          <div className="sidebar-cta">
            <button className="btn btn-primary btn-block" type="button" onClick={generateReport}>
              Generate Report
            </button>
          </div>
        </aside>
        <div className="main-area" style={{ flex: 1 }}>
          <div className="top-bar">
            <span>Climate Risk Intelligence</span>
            <div className="avatar-pill" title={username} />
          </div>
          <DashboardViewTabs />
          <div className="main-panel" id="business-panel">
            <header className="page-header">
              <h1 className="page-title">Climate Risk Intelligence Platform</h1>
              <p className="page-subtitle">
                Aggregate exposure and infrastructure stress signals for institutional stakeholders and
                municipal planning.
              </p>
            </header>

            <section>
              <label className="field-label" htmlFor="asset-location">
                Target asset location
              </label>
              <div className="input-row">
                <input
                  className="input"
                  id="asset-location"
                  type="text"
                  placeholder="e.g. Suffolk County, MA"
                />
                <button className="btn btn-primary" type="button" onClick={generateLocation}>
                  Generate
                </button>
              </div>
              <div className="toolbar">
                <button className="btn btn-secondary btn-sm" type="button" onClick={pingApi}>
                  Check Python API
                </button>
                <button className="btn btn-secondary btn-sm" type="button" onClick={signOut}>
                  Sign out
                </button>
              </div>
              {toast ? (
                <div
                  className={`api-toast${toast.error ? " error" : ""}`}
                  style={{ display: "block" }}
                  role="status"
                >
                  {toast.msg}
                </div>
              ) : (
                <div className="api-toast" id="api-toast" />
              )}
            </section>

            <div className="grid-2">
              <section className="card">
                <h2 className="card-title">Neighborhood Aggregate Risk</h2>
                <div className="metric-grid">
                  <article className="metric-card">
                    <div className="metric-label">Risk tier</div>
                    <div className="metric-value">Critical</div>
                    <div className="metric-bar">
                      <span className="bar-red" style={{ width: "92%" }} />
                    </div>
                  </article>
                  <article className="metric-card">
                    <div className="metric-label">Properties at risk %</div>
                    <div className="metric-value">42.5%</div>
                    <div className="metric-bar">
                      <span className="bar-green" style={{ width: "42.5%" }} />
                    </div>
                  </article>
                  <article className="metric-card">
                    <div className="metric-label">Flood zone %</div>
                    <div className="metric-value">18.2%</div>
                    <div className="metric-bar">
                      <span className="bar-green" style={{ width: "18.2%" }} />
                    </div>
                  </article>
                  <article className="metric-card">
                    <div className="metric-label">Infra stress score</div>
                    <div className="metric-value">7.8/10</div>
                    <div className="metric-bar">
                      <span className="bar-red" style={{ width: "78%" }} />
                    </div>
                  </article>
                </div>
              </section>

              <section className="card">
                <h2 className="card-title">Insurance Market Signals</h2>
                <div className="insurance-row">
                  <span>5-year projected rate increase</span>
                  <span className="text-red">+114%</span>
                </div>
                <div className="insurance-row">
                  <span>Carriers reducing exposure</span>
                  <span>12 of 18</span>
                </div>
                <div style={{ margin: "12px 0" }}>
                  <span className="badge badge-danger">Elevated concern</span>
                </div>
                <div className="insurance-row">
                  <span>Reinsurance delta</span>
                  <span className="text-green">Stable</span>
                </div>
                <p className="page-subtitle" style={{ fontSize: "0.75rem", marginTop: 16 }}>
                  Sources: MA Division of Insurance, carrier filings (demo).
                </p>
              </section>
            </div>

            <section className="card map-card">
              <h2 className="card-title">Civic infrastructure &amp; regional risk heatmap</h2>
              <p className="page-subtitle" style={{ marginTop: 0, marginBottom: 12 }}>
                Hover a Boston neighborhood to inspect flood, heat, and infrastructure exposure.
              </p>
              <BostonRiskMap />
            </section>

            <section className="card policy-card">
              <h2 className="card-title">Strategic policy recommendation</h2>
              <p className="policy-body">
                Signals across flood exposure and carrier withdrawal risk support prioritizing a{" "}
                <strong>coastal resilience zoning overlay</strong> paired with infrastructure hardening in
                high-density corridors. Consider staged capital plans over 24–36 months, aligning municipal
                bond issuance with measurable risk reduction milestones.
              </p>
            </section>
          </div>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
