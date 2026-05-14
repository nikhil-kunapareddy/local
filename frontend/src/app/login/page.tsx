import type { Metadata } from "next";
import { LoginScreen } from "@/components/LoginScreen";

export const metadata: Metadata = {
  title: "Sign in · Climate Risk Intelligence",
  description: "Demo login for Climate Risk Intelligence dashboards",
};

export default function LoginPage() {
  return <LoginScreen />;
}
