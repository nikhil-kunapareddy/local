"use client";

import { useState } from "react";
import { MapContainer, Polygon, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  BOSTON_CENTER,
  BOSTON_NEIGHBORHOODS,
  type NeighborhoodRisk,
  TIER_COLOR,
} from "@/lib/bostonRiskData";

function RiskPanel({ data }: { data: NeighborhoodRisk | null }) {
  if (!data) {
    return (
      <div className="boston-risk-panel empty">
        <strong>Hover a neighborhood</strong>
        <span>Live exposure, heat stress, and infrastructure risk will appear here.</span>
      </div>
    );
  }
  return (
    <div className="boston-risk-panel">
      <div className="boston-risk-header">
        <strong>{data.name}</strong>
        <span className="boston-risk-tier" style={{ background: TIER_COLOR[data.tier] }}>
          {data.tier}
        </span>
      </div>
      <p className="boston-risk-note">{data.note}</p>
      <dl className="boston-risk-stats">
        <div>
          <dt>Flood zone %</dt>
          <dd>{data.floodPct.toFixed(1)}%</dd>
        </div>
        <div>
          <dt>Heat stress</dt>
          <dd>{data.heatStress}</dd>
        </div>
        <div>
          <dt>Infra score</dt>
          <dd>{data.infraScore.toFixed(1)}/10</dd>
        </div>
        <div>
          <dt>Properties at risk</dt>
          <dd>{data.propertiesAtRiskPct.toFixed(1)}%</dd>
        </div>
      </dl>
    </div>
  );
}

export function BostonRiskMap() {
  const [hovered, setHovered] = useState<NeighborhoodRisk | null>(null);

  return (
    <div className="boston-map-wrap">
      <div className="boston-map">
        <MapContainer
          center={BOSTON_CENTER}
          zoom={12}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {BOSTON_NEIGHBORHOODS.map((n) => (
            <Polygon
              key={n.name}
              positions={n.polygon}
              pathOptions={{
                color: TIER_COLOR[n.tier],
                weight: hovered?.name === n.name ? 3 : 1,
                fillColor: TIER_COLOR[n.tier],
                fillOpacity: hovered?.name === n.name ? 0.7 : 0.45,
              }}
              eventHandlers={{
                mouseover: () => setHovered(n),
                mouseout: () => setHovered((cur) => (cur?.name === n.name ? null : cur)),
              }}
            />
          ))}
        </MapContainer>
      </div>
      <RiskPanel data={hovered} />
    </div>
  );
}
