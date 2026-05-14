import type { Metadata } from "next";
import { AuthGate } from "@/components/AuthGate";
import { BusinessDashboard } from "@/components/BusinessDashboard";

export const metadata: Metadata = {
  title: "Business dashboard · LoCal",
};

export default function BusinessPage() {
  return (
    <AuthGate>
      <BusinessDashboard />
    </AuthGate>
  );
}
