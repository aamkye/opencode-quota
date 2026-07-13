import { build } from "esbuild"
import { mkdirSync, rmSync } from "node:fs"

rmSync(".tmp-test/presentation-types.mjs", { force: true })
mkdirSync(".tmp-test", { recursive: true })

await build({
  bundle: true,
  entryPoints: ["tui/presentation/types.ts"],
  format: "esm",
  outfile: ".tmp-test/presentation-types.mjs",
  platform: "node",
  target: "es2022",
})
