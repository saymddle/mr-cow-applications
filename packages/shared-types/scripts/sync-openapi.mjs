// Copies the TOGIVA Core OpenAPI document into this package. The source is a
// path to a togiva-core checkout's openapi/v1.json, or an https URL.
//   TOGIVA_OPENAPI_SOURCE=../togiva-core/packages/api-contracts/openapi/v1.json pnpm api:sync
// Then run `pnpm api:generate` and commit both files.
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const source = process.env.TOGIVA_OPENAPI_SOURCE ?? "../../../togiva-core/packages/api-contracts/openapi/v1.json";
const text = source.startsWith("https://")
  ? await (await fetch(source)).text()
  : await readFile(resolve(process.env.INIT_CWD ?? process.cwd(), source), "utf8");
const doc = JSON.parse(text);
if (!doc.openapi || !doc.info?.version) throw new Error("Not an OpenAPI document");
await writeFile(new URL("../openapi/v1.json", import.meta.url), JSON.stringify(doc, null, 2) + "\n");
console.log(`synced TOGIVA Core API ${doc.info.version} from ${source}`);
