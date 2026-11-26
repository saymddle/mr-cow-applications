import { useCallback, useEffect, useState } from "react";
import { TogivaApiError } from "@mrcow/api-client";
import { useSession } from "@mrcow/auth";
import type { LocationSummary } from "@mrcow/shared-types";

export type Load<T> = { status: "loading" } | { status: "ready"; data: T } | { status: "error"; error: TogivaApiError };

const asError = (e: unknown) => (e instanceof TogivaApiError ? e : new TogivaApiError(0, "client_error", String(e)));

/** All participating stores the customer can see (TOGIVA returns active, loyalty-participating ones to customers). */
export function useStores(organizationId: string | null | undefined) {
  const { api } = useSession();
  const [state, setState] = useState<Load<LocationSummary[]>>({ status: "loading" });
  const load = useCallback(async () => {
    if (!organizationId) return;
    setState({ status: "loading" });
    try {
      const all: LocationSummary[] = [];
      let cursor: string | null | undefined;
      // Stores are a short list; page through up to 10 pages defensively.
      for (let i = 0; i < 10; i++) {
        const page = await api.listLocations(organizationId, { limit: 100, ...(cursor ? { cursor } : {}) });
        all.push(...page.items);
        cursor = page.nextCursor;
        if (!cursor) break;
      }
      setState({ status: "ready", data: all.filter((l) => l.status === "active" && l.loyaltyParticipating) });
    } catch (e) {
      setState({ status: "error", error: asError(e) });
    }
  }, [api, organizationId]);
  useEffect(() => {
    void load();
  }, [load]);
  return [state, load] as const;
}

const STORE_KEY = "mrcow.customer.my-store";

/** The store the customer last chose, remembered on this device. */
export function useMyStore(fallback: string | null | undefined) {
  const [stored, setStored] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORE_KEY);
    } catch {
      return null;
    }
  });
  const set = useCallback((id: string) => {
    setStored(id);
    try {
      localStorage.setItem(STORE_KEY, id);
    } catch {
      /* private mode: keep in memory */
    }
  }, []);
  return [stored ?? fallback ?? null, set] as const;
}

export function formatAddress(l: LocationSummary): string {
  const a = l.address;
  return [a.line1, a.line2, [a.city, a.regionCode].filter(Boolean).join(", "), a.postalCode].filter(Boolean).join(", ");
}

/** A maps link the phone opens in its default maps app. */
export function directionsUrl(l: LocationSummary): string | null {
  if (l.latitude != null && l.longitude != null) return `https://www.google.com/maps/dir/?api=1&destination=${l.latitude},${l.longitude}`;
  const q = [l.name, formatAddress(l)].filter(Boolean).join(", ");
  return formatAddress(l) ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
}

export type LoyaltyLoad<T> = Load<T> | { status: "unavailable" };

/**
 * Loads a loyalty read. "unavailable" means the organization has not launched
 * its rewards program in TOGIVA yet, which the screens say plainly instead of
 * showing placeholder numbers.
 */
export function useLoyalty<T>(organizationId: string | null | undefined, enabled: boolean, fetcher: (orgId: string) => Promise<T>) {
  const [state, setState] = useState<LoyaltyLoad<T>>({ status: "loading" });
  const load = useCallback(async () => {
    if (!organizationId || !enabled) return;
    try {
      setState({ status: "ready", data: await fetcher(organizationId) });
    } catch (e) {
      if (e instanceof TogivaApiError && e.code === "loyalty_program_unavailable") setState({ status: "unavailable" });
      else setState({ status: "error", error: asError(e) });
    }
    // fetcher is expected to be stable (wrap in useCallback).
  }, [organizationId, enabled, fetcher]);
  useEffect(() => {
    void load();
  }, [load]);
  return [state, load] as const;
}

/** Formats a qualification amount for its metric (spend is minor units of the org currency). */
export function formatProgress(metric: "qualifying_spend" | "qualifying_visits" | "qualifying_points", value: number, currency: string): string {
  if (metric === "qualifying_spend") {
    const digits = new Intl.NumberFormat("en-US", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
    const whole = value % 10 ** digits === 0;
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: whole ? 0 : digits, maximumFractionDigits: whole ? 0 : digits }).format(value / 10 ** digits);
  }
  if (metric === "qualifying_visits") return `${value} ${value === 1 ? "visit" : "visits"}`;
  return `${value.toLocaleString("en-US")} pts`;
}
