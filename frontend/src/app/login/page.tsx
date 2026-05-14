import type { Metadata } from "next";
import { LoginScreen } from "@/components/LoginScreen";

export const metadata: Metadata = {
  title: "Sign in · LoCal",
  description: "Demo login for LoCal climate risk dashboards",
};

export default function LoginPage() {
  return <LoginScreen />;
}
