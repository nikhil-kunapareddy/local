import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the dev server to be opened from this machine’s LAN IP (e.g. phone / another device).
  allowedDevOrigins: ["10.211.9.153", "127.0.0.1", "localhost"],
};

export default nextConfig;
