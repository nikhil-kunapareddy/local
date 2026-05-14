# LoCal Data Overview

## Data Sources

### No API key required
- **US Census Geocoder**: text location and lat/lng geography lookup.
- **FEMA NFHL**: flood zone classification and SFHA flag.
- **FEMA National Risk Index (NRI)**: composite and per-hazard risk scores.
- **Open-Meteo Forecast API**: 7-day weather forecast.

### API key required
- **WAQI** (`WAQI_TOKEN`): real-time AQI and pollutant measurements.
- **NREL PVWatts** (`NREL_API_KEY`): modeled solar generation potential.
- **EIA Retail Sales API** (`EIA_API_KEY`): electricity price by state.
- **NOAA CDO** (`NOAA_TOKEN`): climate history (currently partial in integrated mode).
- **ATTOM** (`ATTOM_API_KEY`): property/AVM data (currently partial in integrated mode).
- **FRED** (`FRED_API_KEY`): house-price trends (currently partial in integrated mode).

## API/Data Structure

### Manual location flow
1. User enters city or ZIP in consumer/business input.
2. `GET /api/geocode?q=<text>` resolves to coordinates.
3. Dashboard calls summary routes with `lat/lng`.

### Core integrated route
- `GET /api/climate-intelligence?lat=<number>&lng=<number>`
- Returns:
  - `meta`: request coordinates/time and resolved county/state.
  - `floodRisk`: zone, SFHA flag, high-risk flag.
  - `naturalHazardRisk`: overall risk + hazard breakdown.
  - `airQuality`: AQI and pollutant values.
  - `solarPotential`: annual + monthly output estimates.
  - `energyPrice`: latest state residential electricity price.
  - `weatherForecast`: 7-day daily weather points.

### Summary routes used by dashboards
- `GET /api/summary/consumer?lat=<number>&lng=<number>`
- `GET /api/summary/business?lat=<number>&lng=<number>`

## Real-Time Derived Metrics

These are derived directly from live upstream responses at request time.

### Consumer
Computed in `src/lib/server/climateIntel.ts`:
- `meta.flood_zone`: from FEMA `floodRisk.zone`.
- `meta.aqi`: from WAQI `airQuality.aqi`.
- `meta.hazard_score`: from FEMA NRI `naturalHazardRisk.overallRiskScore`.
- `composite_score`: weighted function of current flood, AQI, and NRI score:
  - `round(floodScore*0.4 + airScore*0.3 + hazardScore*0.3)`.

### Business
Computed in `src/lib/server/climateIntel.ts`:
- `risk_tier`: from FEMA NRI `overallRiskRating`.
- `infra_stress_score`: from FEMA NRI `expectedAnnualLoss`, scaled to `1..10`:
  - `clamp(expectedAnnualLoss / 10, 1, 10)`.

## Not Real-Time (Current Placeholders / Heuristics)

The fields below are not yet sourced from a live insurance/property feed in integrated mode:
- Consumer: `flood_pct`, `air_operational_pct`, `other_pct`.
- Business: `properties_at_risk_pct`, `flood_zone_pct`, `rate_increase_5y_pct`, `carriers_reducing`.

## Notes
- If external geocoding providers are unreachable in the runtime environment, `/api/geocode` can fall back to local predefined mappings for known locations.
- NOAA/ATTOM/FRED are configured but still partial in the integrated Next.js route implementation.
