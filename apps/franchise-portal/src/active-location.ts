import { useCallback, useState } from "react";

const KEY = "mrcow.franchise.active-location";

function read(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** The store the user is working in. Remembered per browser; falls back to their first store. */
export function useActiveLocation(available: string[]) {
  const [stored, setStored] = useState<string | null>(read);
  const active = stored && available.includes(stored) ? stored : (available[0] ?? null);
  const set = useCallback((id: string) => {
    setStored(id);
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* storage unavailable: keep in memory only */
    }
  }, []);
  return [active, set] as const;
}
