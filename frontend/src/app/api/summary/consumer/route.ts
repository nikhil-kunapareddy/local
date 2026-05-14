import { NextRequest, NextResponse } from "next/server";
import { fetchClimateIntelligence, toConsumerSummary } from "@/lib/server/climateIntel";

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat") ?? "42.3601");
  const lng = Number(req.nextUrl.searchParams.get("lng") ?? "-71.0589");
  console.log("[/api/summary/consumer] query", { lat, lng });

  try {
    const payload = await fetchClimateIntelligence({ lat, lng });
    const summary = toConsumerSummary(payload);
    console.log("[/api/summary/consumer] response", summary);
    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[/api/summary/consumer] error", { lat, lng, message });
    return NextResponse.json(
      {
        error: "Could not build consumer summary from climate intelligence data.",
        detail: message,
        hint: "This route now runs in-process inside Next.js. Verify API keys in your environment.",
      },
      { status: 502 },
    );
  }
}
