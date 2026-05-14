type Json = Record<string, unknown>;

const {
  NOAA_TOKEN,
  EIA_API_KEY,
  NREL_API_KEY = "DEMO_KEY",
  WAQI_TOKEN,
  ATTOM_API_KEY,
  FRED_API_KEY,
} = process.env;

async function fetchJSON(url: string, headers: HeadersInit = {}) {
  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

async function reverseGeocode(lat: number, lng: number) {
  const url =
    `https://geocoding.geo.census.gov/geocoder/geographies/coordinates` +
    `?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Vintages` +
    `&layers=Counties&format=json`;

  const data = await fetchJSON(url);
  const county = data?.result?.geographies?.Counties?.[0];
  if (!county) return null;

  return {
    state: county.STUSAB,
    stateFips: county.STATE,
    countyFips: county.COUNTY,
    countyName: county.BASENAME,
  };
}

async function getFloodRisk(lat: number, lng: number) {
  const url =
    `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query` +
    `?geometry=${lng},${lat}` +
    `&geometryType=esriGeometryPoint` +
    `&inSR=4326` +
    `&spatialRel=esriSpatialRelIntersects` +
    `&outFields=FLD_ZONE,ZONE_SUBTY,SFHA_TF,STATIC_BFE` +
    `&returnGeometry=false` +
    `&f=json`;

  const data = await fetchJSON(url);
  const feature = data?.features?.[0]?.attributes;

  if (!feature) return { zone: "Unknown", isHighRisk: false, sfha: false };

  const highRiskZones = ["A", "AE", "AH", "AO", "AR", "A99", "V", "VE"];
  const isHighRisk = highRiskZones.some((z) => String(feature.FLD_ZONE ?? "").startsWith(z));

  return {
    zone: feature.FLD_ZONE ?? "Unknown",
    zoneSubtype: feature.ZONE_SUBTY ?? null,
    sfha: feature.SFHA_TF === "T",
    isHighRisk,
    baseFloodElevation: feature.STATIC_BFE ?? null,
  };
}

async function getNationalRiskIndex(lat: number, lng: number) {
  const url =
    `https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/NRI_CT/FeatureServer/0/query` +
    `?geometry=${lng},${lat}` +
    `&geometryType=esriGeometryPoint` +
    `&inSR=4326` +
    `&spatialRel=esriSpatialRelIntersects` +
    `&outFields=RISK_SCORE,RISK_RATNG,EAL_SCORE,EAL_RATNG,WFIR_RISKS,HRCN_RISKS,TRND_RISKS,ERQK_RISKS,HWAV_RISKS,DRGT_RISKS,LNDS_RISKS,RFLD_RISKS,SWND_RISKS,CFLD_RISKS,AVLN_RISKS,VLCN_RISKS,TSUN_RISKS,LTNG_RISKS,WNTW_RISKS,HAIL_RISKS,ISTM_RISKS` +
    `&returnGeometry=false&f=json`;

  const data = await fetchJSON(url);
  const a = data?.features?.[0]?.attributes;
  if (!a) return null;

  return {
    overallRiskScore: a.RISK_SCORE,
    overallRiskRating: a.RISK_RATNG,
    expectedAnnualLoss: a.EAL_SCORE,
    expectedAnnualLossRating: a.EAL_RATNG,
    hazards: {
      wildfire: a.WFIR_RISKS,
      hurricane: a.HRCN_RISKS,
      tornado: a.TRND_RISKS,
      earthquake: a.ERQK_RISKS,
      heatWave: a.HWAV_RISKS,
      drought: a.DRGT_RISKS,
      landslide: a.LNDS_RISKS,
      riverineFlooding: a.RFLD_RISKS,
      strongWind: a.SWND_RISKS,
      coastalFlooding: a.CFLD_RISKS,
      avalanche: a.AVLN_RISKS,
      volcano: a.VLCN_RISKS,
      tsunami: a.TSUN_RISKS,
      lightning: a.LTNG_RISKS,
      winterWeather: a.WNTW_RISKS,
      hail: a.HAIL_RISKS,
      icestorm: a.ISTM_RISKS,
    },
  };
}

async function getAirQuality(lat: number, lng: number) {
  if (!WAQI_TOKEN) return { error: "WAQI_TOKEN not configured" };
  const url = `https://api.waqi.info/feed/geo:${lat};${lng}/?token=${WAQI_TOKEN}`;
  const data = await fetchJSON(url);
  if (data.status !== "ok") return { error: data.data ?? "WAQI error" };

  const d = data.data;
  const iaqi = d.iaqi ?? {};
  const pick = (key: string) => {
    const v = iaqi[key];
    if (v === undefined) return null;
    return typeof v === "object" ? v.v : v;
  };

  return {
    aqi: d.aqi,
    dominantPollutant: d.dominantpol ?? null,
    stationName: d.city?.name ?? null,
    updatedAt: d.time?.s ?? null,
    pollutants: {
      pm25: pick("pm25"),
      pm10: pick("pm10"),
      no2: pick("no2"),
      o3: pick("o3"),
      so2: pick("so2"),
      co: pick("co"),
    },
  };
}

async function getSolarPotential(lat: number, lng: number) {
  const params = new URLSearchParams({
    api_key: NREL_API_KEY,
    lat: lat.toString(),
    lon: lng.toString(),
    system_capacity: "4",
    azimuth: "180",
    tilt: "20",
    array_type: "1",
    module_type: "0",
    losses: "14",
    dataset: "nsrdb",
  });

  const data = await fetchJSON(`https://developer.nlr.gov/api/pvwatts/v8.json?${params}`);
  if (data.errors?.length) return { error: data.errors.join(", ") };

  const out = data.outputs;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return {
    annualKwh: Math.round(out.ac_annual),
    monthlyKwh: months.map((m, i) => ({ month: m, kwh: Math.round(out.ac_monthly[i]) })),
    estimatedAnnualSavings: Math.round(out.ac_annual * 0.16),
  };
}

async function getEnergyPrice(stateCode: string) {
  if (!EIA_API_KEY) return { error: "EIA_API_KEY not configured" };
  const url =
    `https://api.eia.gov/v2/electricity/retail-sales/data` +
    `?api_key=${EIA_API_KEY}&data[]=price&facets[sectorid][]=RES` +
    `&facets[stateid][]=${stateCode}&frequency=monthly` +
    `&sort[0][column]=period&sort[0][direction]=desc&length=12`;

  const data = await fetchJSON(url);
  const results = data?.response?.data ?? [];
  if (!results.length) return { error: "No EIA data for this state" };

  return {
    state: stateCode,
    latestPeriod: results[0].period,
    pricePerKwh: Number(results[0].price),
  };
}

async function getWeatherForecast(lat: number, lng: number) {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lng}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,uv_index_max,weathercode` +
    `&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch&timezone=auto&forecast_days=7`;

  const data = await fetchJSON(url);
  const d = data.daily;
  return {
    timezone: data.timezone,
    forecast: d.time.map((date: string, i: number) => ({
      date,
      tempMaxF: d.temperature_2m_max[i],
      tempMinF: d.temperature_2m_min[i],
      precipitationIn: d.precipitation_sum[i],
      maxWindMph: d.windspeed_10m_max[i],
      uvIndex: d.uv_index_max[i],
      weatherCode: d.weathercode[i],
    })),
  };
}

function unwrap(result: PromiseSettledResult<unknown>, label: string) {
  if (result.status === "fulfilled") return result.value;
  return { error: `${label} failed: ${result.reason?.message ?? "unknown"}` };
}

export async function getClimateIntelligence(lat: number, lng: number): Promise<Json> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Invalid coordinates. Provide lat/lng numbers.");
  }

  if (lat < 24 || lat > 50 || lng < -125 || lng > -66) {
    throw new Error("Coordinates appear outside contiguous United States.");
  }

  let geo: Awaited<ReturnType<typeof reverseGeocode>> = null;
  try {
    geo = await reverseGeocode(lat, lng);
  } catch {
    geo = null;
  }

  const [floodResult, riskResult, airResult, solarResult, energyResult, weatherResult] =
    await Promise.allSettled([
      getFloodRisk(lat, lng),
      getNationalRiskIndex(lat, lng),
      getAirQuality(lat, lng),
      getSolarPotential(lat, lng),
      geo?.state ? getEnergyPrice(geo.state) : Promise.resolve({ error: "No state resolved" }),
      getWeatherForecast(lat, lng),
    ]);

  const floodRisk = unwrap(floodResult, "FEMA NFHL");
  const naturalHazardRisk = unwrap(riskResult, "FEMA NRI");
  const airQuality = unwrap(airResult, "WAQI");
  const solarPotential = unwrap(solarResult, "NREL PVWatts");
  const energyPrice = unwrap(energyResult, "EIA");
  const weatherForecast = unwrap(weatherResult, "Open-Meteo");

  return {
    meta: {
      lat,
      lng,
      requestedAt: new Date().toISOString(),
      location: geo
        ? {
            state: geo.state,
            county: geo.countyName,
            stateFips: geo.stateFips,
            countyFips: geo.countyFips,
          }
        : null,
    },
    floodRisk,
    naturalHazardRisk,
    airQuality,
    climateHistory: NOAA_TOKEN ? { note: "Not yet wired in Next integrated mode" } : { error: "NOAA_TOKEN not configured" },
    solarPotential,
    energyPrice,
    weatherForecast,
    propertyPrices: ATTOM_API_KEY ? { note: "Not yet wired in Next integrated mode" } : { error: "ATTOM_API_KEY not configured" },
    housePriceIndex: FRED_API_KEY ? { note: "Not yet wired in Next integrated mode" } : { error: "FRED_API_KEY not configured" },
    costIntelligence: {},
  };
}
