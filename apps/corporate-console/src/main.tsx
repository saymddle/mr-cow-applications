import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { authFromEnv } from "@mrcow/auth";
import { apps, applyTheme } from "@mrcow/brand-config";
import "@mrcow/ui/styles.css";
import "./app.css";
import { App } from "./App";
import { readConfig } from "./config";

applyTheme(apps.corporate.theme);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App config={readConfig(import.meta.env)} auth={authFromEnv(import.meta.env)} />
    </BrowserRouter>
  </StrictMode>,
);
