export type AccountType = "business" | "consumer";

export interface DemoSession {
  username: string;
  accountType: AccountType;
}

const STORAGE_KEY = "climateintel_demo_session";

function readRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    // Purge any stale entry written by a previous build that also used localStorage,
    // otherwise old demos auto-resume and skip the login screen.
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function isValidSession(value: unknown): value is DemoSession {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.username === "string" &&
    o.username.length > 0 &&
    (o.accountType === "business" || o.accountType === "consumer")
  );
}

export function getSession(): DemoSession | null {
  const raw = readRaw();
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isValidSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function setSession(session: DemoSession): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Use after login so the dashboard always loads with storage already committed. */
export function navigateToDashboard(accountType: AccountType): void {
  const path = accountType === "business" ? "/business" : "/consumer";
  if (typeof window !== "undefined") {
    window.location.assign(path);
  }
}
