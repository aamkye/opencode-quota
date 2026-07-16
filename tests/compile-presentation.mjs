import { build } from "esbuild"
import { mkdirSync, rmSync } from "node:fs"
import { resolve } from "node:path"

for (const name of ["presentation-types", "presentation-format", "presentation-layout", "presentation-renderer", "presentation-mounted", "provider-zai", "provider-openai", "provider-opencode-go", "provider-hub", "provider-lifecycle", "quota-composition", "quota-selection", "home-composition", "token-tui", "token-tui-controlled", "plugin-runtime"]) {
  rmSync(`.tmp-test/${name}.mjs`, { force: true })
}
mkdirSync(".tmp-test", { recursive: true })

for (const [entryPoint, outfile, conditions, plugins, external] of [
  ["tui/presentation/types.ts", ".tmp-test/presentation-types.mjs"],
  ["tui/presentation/format.ts", ".tmp-test/presentation-format.mjs"],
  ["tui/presentation/layout.ts", ".tmp-test/presentation-layout.mjs"],
  ["tui/presentation/renderer.tsx", ".tmp-test/presentation-renderer.mjs"],
  ["tests/presentation-mounted.fixture.ts", ".tmp-test/presentation-mounted.mjs"],
  ["tui/providers/zai.ts", ".tmp-test/provider-zai.mjs", ["browser"]],
  ["tui/providers/openai.ts", ".tmp-test/provider-openai.mjs", ["browser"]],
  ["tui/providers/opencode-go.ts", ".tmp-test/provider-opencode-go.mjs", ["browser"]],
  ["tui/services/quota-provider-hub.ts", ".tmp-test/provider-hub.mjs", ["browser"]],
  ["tests/provider-lifecycle.fixture.ts", ".tmp-test/provider-lifecycle.mjs", ["browser"]],
  ["tui/quota.tsx", ".tmp-test/quota-composition.mjs", ["browser"]],
  ["tests/quota-selection.fixture.ts", ".tmp-test/quota-selection.mjs", ["browser"]],
  ["tui/home.tsx", ".tmp-test/home-composition.mjs", ["browser"]],
  ["tui/token-report.tsx", ".tmp-test/token-tui.mjs", ["browser"], undefined, ["solid-js"]],
  ["tui/token-report.tsx", ".tmp-test/token-tui-controlled.mjs", ["browser"], [{
    name: "token-tui-controlled-compute",
    setup(build) {
      build.onResolve({ filter: /opencode-tools-shared\.js$/ }, () => ({ path: resolve("tests/token-tui-dependencies.fixture.ts") }))
    },
  }], ["solid-js"]],
  ["tui/runtime/plugin.ts", ".tmp-test/plugin-runtime.mjs"],
]) {
  await build({
    bundle: true,
    entryPoints: [entryPoint],
    format: "esm",
    outfile,
    platform: "node",
    target: "es2022",
    conditions,
    plugins,
    external: ["bun:sqlite", "better-sqlite3", "node:sqlite", ...(external ?? [])],
  })
}
