import type { Metadata } from "next";
import { AuthGate } from "@/components/AuthGate";
import { ConsumerDashboard } from "@/components/ConsumerDashboard";

export const metadata: Metadata = {
  title: "Consumer dashboard · ClimateHome",
};

export default function ConsumerPage() {
  return (
    <AuthGate>
      <ConsumerDashboard />
    </AuthGate>
  );
}
