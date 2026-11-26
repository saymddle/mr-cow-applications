import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const doc = JSON.parse(readFileSync(new URL("../openapi/v1.json", import.meta.url), "utf8"));
const generated = readFileSync(new URL("../src/generated/schema.ts", import.meta.url), "utf8");

describe("vendored TOGIVA Core contract", () => {
  it("is an OpenAPI v1 document", () => {
    expect(doc.openapi).toMatch(/^3\./);
    expect(doc.info.version).toMatch(/^1\./);
  });
  it("generated types include every operation (run `pnpm api:generate` after syncing)", () => {
    const ids = Object.values(doc.paths).flatMap((p) => Object.values(p as Record<string, { operationId: string }>).map((o) => o.operationId));
    for (const id of ids) expect(generated).toContain(`    ${id}: {`);
  });
});
