import { NextRequest, NextResponse } from "next/server";
import { fetchClimateIntelligence } from "@/lib/server/climateIntel";

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat") ?? "42.3601");
  const lng = Number(req.nextUrl.searchParams.get("lng") ?? "-71.0589");
  console.log("[/api/climate-intelligence] query", { lat, lng });

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "Invalid coordinates. Provide ?lat=<number>&lng=<number>" },
      { status: 400 },
    );
  }

  try {
    const data = await fetchClimateIntelligence({ lat, lng });
    console.log("[/api/climate-intelligence] response meta", data?.meta ?? {});
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[/api/climate-intelligence] error", { lat, lng, message });
    return NextResponse.json(
      {
        error: "Failed to load climate intelligence.",
        detail: message,
        hint: "This route now runs in-process inside Next.js. Verify API keys in your environment.",
      },
      { status: 502 },
    );
  }
}
