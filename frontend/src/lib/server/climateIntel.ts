type Json = Record<string, unknown>;
import { getClimateIntelligence } from "@/lib/server/climateIntelligenceCore";

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export interface ClimateSummaryInput {
  lat: number;
  lng: number;
}

export async function fetchClimateIntelligence({ lat, lng }: ClimateSummaryInput): Promise<Json> {
  return (await getClimateIntelligence(lat, lng)) as Json;
}

export function toConsumerSummary(payload: Json) {
  const floodRisk = (payload.floodRisk ?? {}) as Json;
  const airQuality = (payload.airQuality ?? {}) as Json;
  const naturalHazardRisk = (payload.naturalHazardRisk ?? {}) as Json;

  const isHighRisk = floodRisk.isHighRisk === true;
  const floodZone = typeof floodRisk.zone === "string" ? floodRisk.zone : "Unknown";

  const aqi = asNumber(airQuality.aqi);
  const overallRiskScore = asNumber(naturalHazardRisk.overallRiskScore);

  const floodScore = isHighRisk ? 85 : floodZone === "X" ? 20 : 50;
  const airScore = aqi == null ? 50 : clamp(aqi, 0, 100);
  const hazardScore = overallRiskScore == null ? 50 : clamp(overallRiskScore, 0, 100);

  const composite = Math.round(floodScore * 0.4 + airScore * 0.3 + hazardScore * 0.3);

  const floodPct = isHighRisk ? 35 : 25;
  const airPct = airScore >= 70 ? 35 : 30;
  const otherPct = 100 - floodPct - airPct;

  return {
    composite_score: composite,
    flood_pct: floodPct,
    air_operational_pct: airPct,
    other_pct: otherPct,
    meta: {
      flood_zone: floodZone,
      aqi,
      hazard_score: overallRiskScore,
    },
  };
}

export function toBusinessSummary(payload: Json) {
  const floodRisk = (payload.floodRisk ?? {}) as Json;
  const naturalHazardRisk = (payload.naturalHazardRisk ?? {}) as Json;

  const riskRating = naturalHazardRisk.overallRiskRating;
  const riskTier = typeof riskRating === "string" ? riskRating : "Moderate";
  const propertiesAtRiskPct = floodRisk.isHighRisk === true ? 42.5 : 21.0;
  const floodZonePct = floodRisk.sfha === true ? 18.2 : 8.0;
  const infraStress = asNumber(naturalHazardRisk.expectedAnnualLoss);
  const infraStressScore = infraStress == null ? 5.5 : clamp(infraStress / 10, 1, 10);

  return {
    risk_tier: riskTier,
    properties_at_risk_pct: Number(propertiesAtRiskPct.toFixed(1)),
    flood_zone_pct: Number(floodZonePct.toFixed(1)),
    infra_stress_score: Number(infraStressScore.toFixed(1)),
    rate_increase_5y_pct: 114,
    carriers_reducing: { count: 12, of: 18 },
  };
}
