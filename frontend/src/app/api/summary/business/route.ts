import { NextRequest, NextResponse } from "next/server";
import { fetchClimateIntelligence, toBusinessSummary } from "@/lib/server/climateIntel";

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat") ?? "42.3601");
  const lng = Number(req.nextUrl.searchParams.get("lng") ?? "-71.0589");

  try {
    const payload = await fetchClimateIntelligence({ lat, lng });
    return NextResponse.json(toBusinessSummary(payload));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Could not build business summary from climate intelligence data.",
        detail: message,
        hint: "This route now runs in-process inside Next.js. Verify API keys in your environment.",
      },
      { status: 502 },
    );
  }
}
