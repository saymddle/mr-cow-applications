export interface AppConfig {
  apiUrl: string;
  organizationSlug: string;
  /** Names of required settings that are missing. */
  missing: string[];
}

export function readConfig(env: Record<string, string | boolean | undefined>): AppConfig {
  const apiUrl = String(env.VITE_TOGIVA_API_URL ?? "").replace(/\/+$/, "");
  const organizationSlug = String(env.VITE_TOGIVA_ORGANIZATION_SLUG ?? "");
  const missing = [!apiUrl && "VITE_TOGIVA_API_URL", !organizationSlug && "VITE_TOGIVA_ORGANIZATION_SLUG"].filter(Boolean) as string[];
  return { apiUrl, organizationSlug, missing };
}
