import type { Metadata } from "next";
import { AuthGate } from "@/components/AuthGate";
import { ConsumerDashboard } from "@/components/ConsumerDashboard";

export const metadata: Metadata = {
  title: "Consumer dashboard · LoCal",
};

export default function ConsumerPage() {
  return (
    <AuthGate>
      <ConsumerDashboard />
    </AuthGate>
  );
}
