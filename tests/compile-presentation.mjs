import { build } from "esbuild"
import { mkdirSync, rmSync } from "node:fs"

for (const name of ["presentation-types", "presentation-format", "presentation-layout"]) {
  rmSync(`.tmp-test/${name}.mjs`, { force: true })
}
mkdirSync(".tmp-test", { recursive: true })

for (const [entryPoint, outfile] of [
  ["tui/presentation/types.ts", ".tmp-test/presentation-types.mjs"],
  ["tui/presentation/format.ts", ".tmp-test/presentation-format.mjs"],
  ["tui/presentation/layout.ts", ".tmp-test/presentation-layout.mjs"],
]) {
  await build({
    bundle: true,
    entryPoints: [entryPoint],
    format: "esm",
    outfile,
    platform: "node",
    target: "es2022",
  })
}
