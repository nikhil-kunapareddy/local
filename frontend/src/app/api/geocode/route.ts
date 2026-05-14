import { NextRequest, NextResponse } from "next/server";

const OFFLINE_LOCATION_FALLBACKS: Record<
  string,
  { lat: number; lng: number; matchedAddress: string }
> = {
  denver: { lat: 39.7392, lng: -104.9903, matchedAddress: "Denver, CO" },
  "denver, co": { lat: 39.7392, lng: -104.9903, matchedAddress: "Denver, CO" },
  "80112": { lat: 39.5792, lng: -104.8792, matchedAddress: "Centennial, CO 80112" },
  boston: { lat: 42.3601, lng: -71.0589, matchedAddress: "Boston, MA" },
  "02108": { lat: 42.357, lng: -71.0637, matchedAddress: "Boston, MA 02108" },
  miami: { lat: 25.7617, lng: -80.1918, matchedAddress: "Miami, FL" },
  "33101": { lat: 25.7751, lng: -80.1947, matchedAddress: "Miami, FL 33101" },
};

async function fetchJSON(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response from provider`);
  }
}

export async function GET(req: NextRequest) {
  const query = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (!query) {
    return NextResponse.json({ error: "Missing query. Use ?q=<city or zip>" }, { status: 400 });
  }

  const errors: string[] = [];
  const normalized = query.toLowerCase();

  // Offline fallback first so city/ZIP works even when outbound geocoding is blocked.
  const localHit = OFFLINE_LOCATION_FALLBACKS[normalized];
  if (localHit) {
    return NextResponse.json({
      query,
      lat: localHit.lat,
      lng: localHit.lng,
      matchedAddress: localHit.matchedAddress,
      source: "offline-fallback",
    });
  }
  try {
    const zipOnly = /^\d{5}$/.test(query);
    if (zipOnly) {
      try {
        // ZIP-specific resolver with no API key required.
        const zipData = await fetchJSON(`https://api.zippopotam.us/us/${query}`);
        const place = zipData?.places?.[0];
        if (place?.latitude && place?.longitude) {
          return NextResponse.json({
            query,
            lat: Number(place.latitude),
            lng: Number(place.longitude),
            matchedAddress: `${place["place name"]}, ${place["state abbreviation"]} ${query}`,
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "ZIP resolver failed";
        errors.push(`zippopotam: ${message}`);
      }
    }

    try {
      const url =
        "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress" +
        `?address=${encodeURIComponent(query)}` +
        "&benchmark=Public_AR_Current&format=json";
      const data = await fetchJSON(url);
      const match = data?.result?.addressMatches?.[0];
      if (match?.coordinates) {
        return NextResponse.json({
          query,
          lat: Number(match.coordinates.y),
          lng: Number(match.coordinates.x),
          matchedAddress: match.matchedAddress ?? null,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Census resolver failed";
      errors.push(`census: ${message}`);
    }

    try {
      // City-name fallback (free, no key): Open-Meteo geocoding.
      const openMeteoUrl =
        "https://geocoding-api.open-meteo.com/v1/search" +
        `?name=${encodeURIComponent(query)}` +
        "&count=1&language=en&countryCode=US&format=json";
      const om = await fetchJSON(openMeteoUrl);
      const hit = om?.results?.[0];
      if (typeof hit?.latitude === "number" && typeof hit?.longitude === "number") {
        const admin = [hit?.admin1, hit?.country_code].filter(Boolean).join(", ");
        return NextResponse.json({
          query,
          lat: Number(hit.latitude),
          lng: Number(hit.longitude),
          matchedAddress: [hit?.name, admin].filter(Boolean).join(", "),
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Open-Meteo resolver failed";
      errors.push(`open-meteo: ${message}`);
    }

    if (errors.length) {
      return NextResponse.json(
        { error: "Geocoding failed across providers", detail: errors.join(" | ") },
        { status: 502 },
      );
    }
    return NextResponse.json({ error: "No match found for that city/ZIP." }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[/api/geocode] error", { query, message });
    return NextResponse.json({ error: "Geocoding failed", detail: message }, { status: 502 });
  }
}
