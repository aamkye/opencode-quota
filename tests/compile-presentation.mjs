import { build } from "esbuild"
import { mkdirSync, rmSync } from "node:fs"

for (const name of ["presentation-types", "presentation-format", "presentation-layout", "presentation-renderer", "presentation-mounted", "provider-zai", "provider-openai", "quota-composition", "quota-selection", "home-composition"]) {
  rmSync(`.tmp-test/${name}.mjs`, { force: true })
}
mkdirSync(".tmp-test", { recursive: true })

for (const [entryPoint, outfile, conditions] of [
  ["tui/presentation/types.ts", ".tmp-test/presentation-types.mjs"],
  ["tui/presentation/format.ts", ".tmp-test/presentation-format.mjs"],
  ["tui/presentation/layout.ts", ".tmp-test/presentation-layout.mjs"],
  ["tui/presentation/renderer.tsx", ".tmp-test/presentation-renderer.mjs"],
  ["tests/presentation-mounted.fixture.ts", ".tmp-test/presentation-mounted.mjs"],
  ["tui/providers/zai.ts", ".tmp-test/provider-zai.mjs", ["browser"]],
  ["tui/providers/openai.ts", ".tmp-test/provider-openai.mjs", ["browser"]],
  ["tui/quota.tsx", ".tmp-test/quota-composition.mjs", ["browser"]],
  ["tests/quota-selection.fixture.ts", ".tmp-test/quota-selection.mjs", ["browser"]],
  ["tui/home.tsx", ".tmp-test/home-composition.mjs", ["browser"]],
]) {
  await build({
    bundle: true,
    entryPoints: [entryPoint],
    format: "esm",
    outfile,
    platform: "node",
    target: "es2022",
    conditions,
    external: ["bun:sqlite", "better-sqlite3", "node:sqlite"],
  })
}
