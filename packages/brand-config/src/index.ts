/**
 * Mr. Cow brand configuration.
 *
 * Source of truth: the Mr. Cow marketing website (repository saymddle/Mr-Cow,
 * website/src/style.css and website/index.html). Colours, fonts, radius and
 * the offset "menu board" shadow are copied from there. Status colours
 * (success/warning/danger) are functional additions the website does not
 * define; they are chosen for contrast, not as brand colours.
 *
 * Shared UI components never import this file directly. They read CSS custom
 * properties, and each app applies a theme from here with `applyTheme`.
 */

export const palette = {
  orange: "#E2592A", // menu board orange
  yellow: "#F2C83D", // filling banner yellow
  gold: "#E8A83A", // price pill
  cream: "#FAE8D2", // menu card cream
  ink: "#15100D", // warm black
  ink2: "#2A211B",
  white: "#FFFDF8",
} as const;

export const fonts = {
  display: '"Archivo", "Arial Black", "Helvetica Neue", Arial, sans-serif',
  body: '"Bricolage Grotesque", "Archivo", "Helvetica Neue", Arial, sans-serif',
  ui: '"Archivo", "Helvetica Neue", Arial, sans-serif',
  script: '"Sacramento", "Brush Script MT", cursive',
  /** Same Google Fonts request as the website. */
  stylesheetUrl:
    "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Sacramento&display=swap",
} as const;

/** Tokens every shared UI component reads (as `--t-<name>` CSS variables). */
export interface ThemeTokens {
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  line: string;
  primary: string;
  primaryText: string;
  accent: string;
  accentText: string;
  inverse: string;
  inverseText: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  focus: string;
  fontDisplay: string;
  fontBody: string;
  fontUi: string;
  fontScript: string;
  displayStretch: string;
  displayTransform: string;
  radius: string;
  radiusSm: string;
  borderWidth: string;
  shadow: string;
  shadowHover: string;
  shadowPressed: string;
}

const status = {
  success: "#1F6B43",
  successSoft: "#DDF1E4",
  warning: "#7A4E00",
  warningSoft: "#FBEBC4",
  danger: "#A8261B",
  dangerSoft: "#FBE0DC",
};

/**
 * Consumer theme for the customer PWA: the website's look translated to an
 * app. Cream ground, ink outlines, orange and yellow accents, heavy uppercase
 * Archivo headlines and the hard offset shadow.
 */
export const consumerTheme: ThemeTokens = {
  bg: palette.cream,
  surface: palette.white,
  surfaceAlt: palette.yellow,
  text: palette.ink,
  muted: "#5A4A3F",
  line: palette.ink,
  primary: palette.orange,
  primaryText: palette.ink,
  accent: palette.yellow,
  accentText: palette.ink,
  inverse: palette.ink,
  inverseText: palette.cream,
  ...status,
  focus: palette.ink,
  fontDisplay: fonts.display,
  fontBody: fonts.body,
  fontUi: fonts.ui,
  fontScript: fonts.script,
  displayStretch: "125%",
  displayTransform: "uppercase",
  radius: "28px",
  radiusSm: "16px",
  borderWidth: "3px",
  shadow: `6px 6px 0 ${palette.ink}`,
  shadowHover: `8px 8px 0 ${palette.ink}`,
  shadowPressed: `2px 2px 0 ${palette.ink}`,
};

/**
 * Operations theme for the franchise portal and corporate console: the same
 * palette and type family, toned down for dense, all-day operational use.
 */
export const operationsTheme: ThemeTokens = {
  bg: "#F6F1EA",
  surface: palette.white,
  surfaceAlt: "#F3E6D4",
  text: palette.ink,
  muted: "#62554B",
  line: "#E2D6C6",
  primary: palette.orange,
  primaryText: palette.ink,
  accent: palette.yellow,
  accentText: palette.ink,
  inverse: palette.ink,
  inverseText: palette.cream,
  ...status,
  focus: palette.ink,
  fontDisplay: fonts.ui,
  fontBody: fonts.ui,
  fontUi: fonts.ui,
  fontScript: fonts.script,
  displayStretch: "112%",
  displayTransform: "none",
  radius: "12px",
  radiusSm: "8px",
  borderWidth: "1px",
  shadow: "0 1px 2px rgba(21,16,13,.06), 0 1px 1px rgba(21,16,13,.04)",
  shadowHover: "0 4px 12px rgba(21,16,13,.10)",
  shadowPressed: "0 1px 1px rgba(21,16,13,.08)",
};

export type AppKey = "customer" | "franchise" | "corporate";

export const apps: Record<AppKey, { name: string; shortName: string; description: string; theme: ThemeTokens; themeColor: string }> = {
  customer: {
    name: "Mr. Cow Rewards",
    shortName: "Mr. Cow",
    description: "Corn dogs by Mr. Cow: membership, rewards and stores.",
    theme: consumerTheme,
    themeColor: palette.orange,
  },
  franchise: {
    name: "Mr. Cow Franchise",
    shortName: "Franchise",
    description: "Store operations for Mr. Cow franchise owners, managers and staff.",
    theme: operationsTheme,
    themeColor: palette.ink,
  },
  corporate: {
    name: "Mr. Cow Corporate",
    shortName: "Corporate",
    description: "Network management and reporting for Mr. Cow corporate.",
    theme: operationsTheme,
    themeColor: palette.ink,
  },
};

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** CSS custom property declarations for a theme, e.g. `--t-primary: #E2592A;`. */
export function themeToCssVariables(theme: ThemeTokens): Record<string, string> {
  return Object.fromEntries(Object.entries(theme).map(([k, v]) => [`--t-${kebab(k)}`, v]));
}

/** Applies a theme to the document root (call once at app start). */
export function applyTheme(theme: ThemeTokens, root: HTMLElement = document.documentElement): void {
  for (const [name, value] of Object.entries(themeToCssVariables(theme))) root.style.setProperty(name, value);
}
