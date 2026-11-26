/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { apps, palette } from "@mrcow/brand-config";

const app = apps.customer;

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.png", "apple-touch-icon.png"],
      manifest: {
        name: app.name,
        short_name: app.shortName,
        description: app.description,
        theme_color: app.themeColor,
        background_color: palette.cream,
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Offline shell: the app's own files are precached and every
        // navigation falls back to index.html. API responses are never cached,
        // so balances and codes are always live.
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,webp,png,svg,woff2}"],
        runtimeCaching: [
          { urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/, handler: "StaleWhileRevalidate", options: { cacheName: "fonts" } },
        ],
      },
    }),
  ],
  test: { environment: "jsdom", setupFiles: ["./test/setup.ts"] },
});
