import { describe, expect, it } from "vitest";
import { apps, consumerTheme, operationsTheme, palette, themeToCssVariables } from "../src/index.js";

// WCAG relative luminance contrast.
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x! + 0.05) / (y! + 0.05);
};

describe("brand tokens", () => {
  it("match the Mr. Cow website palette exactly", () => {
    expect(palette).toEqual({ orange: "#E2592A", yellow: "#F2C83D", gold: "#E8A83A", cream: "#FAE8D2", ink: "#15100D", ink2: "#2A211B", white: "#FFFDF8" });
  });

  for (const [name, t] of Object.entries({ consumer: consumerTheme, operations: operationsTheme })) {
    it(`${name} theme text pairings meet WCAG AA (4.5:1)`, () => {
      const pairs: [string, string][] = [
        [t.text, t.bg], [t.text, t.surface], [t.muted, t.bg], [t.muted, t.surface], [t.primaryText, t.primary],
        [t.accentText, t.accent], [t.inverseText, t.inverse], [t.success, t.successSoft], [t.warning, t.warningSoft], [t.danger, t.dangerSoft],
      ];
      for (const [fg, bg] of pairs) expect(contrast(fg, bg), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
    });
  }

  it("produces CSS variables for every token", () => {
    const vars = themeToCssVariables(consumerTheme);
    expect(vars["--t-primary"]).toBe(palette.orange);
    expect(vars["--t-primary-text"]).toBe(palette.ink);
    expect(Object.keys(vars)).toHaveLength(Object.keys(consumerTheme).length);
  });

  it("defines all three applications", () => {
    expect(Object.keys(apps).sort()).toEqual(["corporate", "customer", "franchise"]);
  });
});
