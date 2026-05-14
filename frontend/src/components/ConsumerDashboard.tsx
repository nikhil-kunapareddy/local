"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession, getSession } from "@/lib/auth";
import { getApiBase } from "@/lib/api";
import { SiteFooter } from "@/components/SiteFooter";
import { DashboardViewTabs } from "@/components/DashboardViewTabs";

const DEFAULT_GRADIENT =
  "conic-gradient(var(--green-deep) 0deg 126deg, var(--red-alert) 126deg 234deg, #c4c4bc 234deg 360deg)";

export function ConsumerDashboard() {
  const router = useRouter();
  const username = getSession()?.username ?? "";
  const [composite, setComposite] = useState(74);
  const [donutBg, setDonutBg] = useState(DEFAULT_GRADIENT);
  const [toast, setToast] = useState<{ msg: string; error: boolean } | null>(null);
  const [manualLocation, setManualLocation] = useState("");

  function signOut() {
    clearSession();
    router.push("/login");
  }

  async function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: Number(position.coords.latitude.toFixed(6)),
            lng: Number(position.coords.longitude.toFixed(6)),
          });
        },
        (error) => {
          reject(new Error(error.message || "Failed to get current location."));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 },
      );
    });
  }

  async function loadSummary(lat?: number, lng?: number) {
    try {
      let resolvedLat = lat;
      let resolvedLng = lng;
      if (resolvedLat == null || resolvedLng == null) {
        const current = await getCurrentLocation();
        resolvedLat = current.lat;
        resolvedLng = current.lng;
      }

      const url = `${getApiBase()}/api/summary/consumer?lat=${resolvedLat}&lng=${resolvedLng}`;
      console.log("[ConsumerDashboard] Querying summary", { lat: resolvedLat, lng: resolvedLng, url });

      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as {
        composite_score: number;
        flood_pct: number;
        air_operational_pct: number;
        other_pct: number;
      };
      console.log("[ConsumerDashboard] Summary response", data);
      setComposite(data.composite_score);
      const f = (data.flood_pct / 100) * 360;
      const a = (data.air_operational_pct / 100) * 360;
      const startA = f;
      const startO = f + a;
      setDonutBg(
        `conic-gradient(var(--green-deep) 0deg ${f}deg, var(--red-alert) ${startA}deg ${startA + a}deg, #c4c4bc ${startO}deg 360deg)`,
      );
      setToast({ msg: `Loaded summary for ${resolvedLat.toFixed(4)}, ${resolvedLng.toFixed(4)}.`, error: false });
    } catch (error) {
      console.error("[ConsumerDashboard] Failed to load location-based summary", error);
      setToast({
        msg: "Unable to use current location. Please allow location access and try again.",
        error: true,
      });
    }
  }

  async function analyze() {
    const input = manualLocation.trim();
    if (!input) {
      setToast({ msg: "Enter a city name or ZIP code.", error: true });
      return;
    }
    try {
      const geocodeRes = await fetch(`${getApiBase()}/api/geocode?q=${encodeURIComponent(input)}`);
      if (!geocodeRes.ok) {
        let detail = String(geocodeRes.status);
        try {
          const err = (await geocodeRes.json()) as { detail?: string; error?: string };
          detail = err.detail || err.error || detail;
        } catch {
          // no-op
        }
        throw new Error(detail);
      }
      const geo = (await geocodeRes.json()) as { lat: number; lng: number; matchedAddress?: string };
      console.log("[ConsumerDashboard] Geocode response", geo);
      await loadSummary(geo.lat, geo.lng);
      if (geo.matchedAddress) {
        setToast({ msg: `Loaded summary for ${geo.matchedAddress}.`, error: false });
      }
    } catch (error) {
      console.error("[ConsumerDashboard] Manual location lookup failed", error);
      setToast({
        msg: `Could not resolve that city/ZIP. ${
          error instanceof Error ? error.message : "Try another location."
        }`,
        error: true,
      });
    }
  }

  useEffect(() => {
    void loadSummary();
  }, []);

  return (
    <>
      <div className="app-shell">
        <aside className="sidebar">
          <div>
            <div className="brand-serif">LoCal</div>
            <div className="brand-sub">Intelligence Platform</div>
          </div>
          <nav>
            <ul className="nav-list">
              <li className="nav-item active">
                <a href="#">
                  <span>🛡</span> Risk overview
                </a>
              </li>
              <li className="nav-item">
                <a href="#">
                  <span>🔎</span> Policy insights
                </a>
              </li>
            </ul>
          </nav>
          <div className="sidebar-cta">
            <button className="btn btn-primary btn-block" type="button">
              Generate report
            </button>
          </div>
          <div className="profile-block">
            <div className="avatar-pill" />
            <div>
              <div>{username}</div>
              <div style={{ opacity: 0.7, fontSize: "0.72rem" }}>Residential portfolio</div>
            </div>
          </div>
        </aside>
        <div className="main-area" style={{ flex: 1 }}>
          <div className="top-bar">
            <span>LoCal</span>
            <div className="avatar-pill" title={username} />
          </div>
          <DashboardViewTabs />
          <div className="main-panel">
            <header className="page-header">
              <h1 className="page-title">LoCal Intelligence Platform</h1>
              <p className="page-subtitle">
                Personal risk exposure for residential and commercial assets.
              </p>
            </header>

            <section>
              <label className="field-label" htmlFor="asset-address">
                Asset location
              </label>
              <div className="input-row">
                <input
                  className="input"
                  id="asset-address"
                  type="text"
                  placeholder="Enter city or ZIP code (e.g. Boston or 02108)"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                />
                <button className="btn btn-primary" type="button" onClick={analyze}>
                  Analyze
                </button>
              </div>
              <div className="toolbar">
                <button
                  className="btn btn-secondary btn-sm"
                  type="button"
                  onClick={() => {
                    void loadSummary();
                  }}
                >
                  Load summary (current location)
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
              ) : null}
            </section>

            <div className="grid-2">
              <section className="card">
                <h2 className="card-title">Assessment &amp; risk distribution</h2>
                <div className="donut-wrap">
                  <div
                    className="donut"
                    id="risk-donut"
                    aria-label={`Composite risk score ${composite}`}
                    style={{ background: donutBg }}
                  >
                    <div className="donut-label">
                      Composite<strong id="composite-score">{composite}</strong>
                    </div>
                  </div>
                  <ul className="legend">
                    <li>
                      <span className="legend-dot" style={{ background: "var(--green-deep)" }} />
                      Flood risk · 35%
                    </li>
                    <li>
                      <span className="legend-dot" style={{ background: "var(--red-alert)" }} />
                      Air + operational · 30%
                    </li>
                    <li>
                      <span className="legend-dot" style={{ background: "#c4c4bc" }} />
                      Other risks · 35%
                    </li>
                  </ul>
                </div>
              </section>
              <section className="card">
                <h2 className="card-title">Climate signal response time</h2>
                <div className="timeline">
                  <div className="tl-row">
                    <div className="tl-head">
                      <span>Physical risk alerts</span>
                      <span className="text-green">CW-04</span>
                    </div>
                    <div className="tl-track">
                      <div className="tl-fill bar-green" style={{ width: "88%" }} />
                    </div>
                    <div className="tl-axis">
                      <span>0hr</span>
                      <span>12hr</span>
                      <span>24hr</span>
                      <span>36hr</span>
                    </div>
                    <div className="page-subtitle" style={{ fontSize: "0.78rem", marginTop: 4 }}>
                      Active early warning
                    </div>
                  </div>
                  <div className="tl-row">
                    <div className="tl-head">
                      <span>Supply chain disruptions</span>
                      <span className="text-red">CW-12</span>
                    </div>
                    <div className="tl-track">
                      <div className="tl-fill bar-red" style={{ width: "55%" }} />
                    </div>
                    <div className="tl-axis">
                      <span>0hr</span>
                      <span>12hr</span>
                      <span>24hr</span>
                      <span>36hr</span>
                    </div>
                    <div className="page-subtitle" style={{ fontSize: "0.78rem", marginTop: 4 }}>
                      Volatility index high
                    </div>
                  </div>
                  <div className="tl-row">
                    <div className="tl-head">
                      <span>Energy cost variance</span>
                      <span>CW-36</span>
                    </div>
                    <div className="tl-track">
                      <div className="tl-fill" style={{ width: "22%", background: "#bdbdbd" }} />
                    </div>
                    <div className="tl-axis">
                      <span>0hr</span>
                      <span>12hr</span>
                      <span>24hr</span>
                      <span>36hr</span>
                    </div>
                    <div className="page-subtitle" style={{ fontSize: "0.78rem", marginTop: 4 }}>
                      Neutral range
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="split-bottom">
              <div>
                <div className="mini-metrics">
                  <article className="mini-metric">
                    <div className="mini-label">Annual insurance premium</div>
                    <div className="mini-value">$12,450</div>
                    <div className="mini-note text-green">+12% YoY</div>
                  </article>
                  <article className="mini-metric">
                    <div className="mini-label">Annual energy expenditure</div>
                    <div className="mini-value">$4,120</div>
                    <div className="mini-note text-green">−4% savings</div>
                  </article>
                  <article className="mini-metric">
                    <div className="mini-label">True cost / month</div>
                    <div className="mini-value">$1,380</div>
                    <div className="mini-note text-green">Amortized</div>
                  </article>
                  <article className="mini-metric">
                    <div className="mini-label">10-year predicted increase</div>
                    <div className="mini-value">45%</div>
                    <div className="mini-note text-red">Projected</div>
                  </article>
                </div>
              </div>
              <aside className="exec-card">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontWeight: 700 }}>ⓘ</span>
                  <span
                    style={{ letterSpacing: "0.12em", fontSize: "0.72rem", textTransform: "uppercase" }}
                  >
                    Executive summary
                  </span>
                </div>
                <p>
                  Current trajectories indicate heightened susceptibility to localized flooding events.
                  Strategic asset reinforcement is advised within the 24-month horizon to mitigate the
                  projected premium pressure shown in adjacent metrics.
                </p>
                <div className="pill-row">
                  <span className="pill">NOAA-ATLAS</span>
                  <span className="pill">ESG-CORE</span>
                  <span className="pill">RE-RISK</span>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
