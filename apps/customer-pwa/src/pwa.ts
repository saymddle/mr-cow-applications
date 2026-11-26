import { registerSW } from "virtual:pwa-register";

/** Registers the service worker that provides the offline shell. Updates apply on the next launch. */
export function registerServiceWorker() {
  if (import.meta.env.DEV) return;
  registerSW({ immediate: true });
}
