export function getApiBase(): string {
  const base = (process.env.NEXT_PUBLIC_API_BASE ?? "").trim();
  if (!base) return "";
  if (base === "http://localhost:8000" || base === "https://localhost:8000") return "";
  return base;
}
