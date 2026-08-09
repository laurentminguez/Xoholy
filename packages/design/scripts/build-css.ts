/**
 * Generates dist/tokens.css from the TypeScript token definitions.
 * Run via `pnpm --filter @xoholy/design build`.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { tokensCss } from "../src/css.ts";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "dist");
const outFile = join(outDir, "tokens.css");

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, tokensCss(), "utf8");

console.log(`Wrote ${outFile}`);
