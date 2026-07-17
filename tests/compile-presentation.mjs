import { build } from "esbuild"
import { mkdirSync, rmSync } from "node:fs"
import { resolve } from "node:path"

for (const name of ["presentation-types", "presentation-format", "presentation-layout", "presentation-renderer", "presentation-mounted", "compact-panel-mounted", "compact-status-row-render", "mcp-mounted", "lsp-mounted", "provider-zai", "provider-openai", "provider-opencode-go", "provider-hub", "provider-lifecycle", "quota-composition", "quota-selection", "home-feature", "home-composition", "mcp-model", "lsp-model", "token-report-feature", "token-tui", "token-tui-controlled", "plugin-adapters-quota-fixture", "plugin-adapters-home-fixture", "plugin-adapters-token-fixture", "plugin-adapters-mcp-fixture", "plugin-runtime"]) {
  rmSync(`.tmp-test/${name}.mjs`, { force: true })
}
mkdirSync(".tmp-test", { recursive: true })

for (const [entryPoint, outfile, conditions, plugins, external] of [
  ["tui/presentation/types.ts", ".tmp-test/presentation-types.mjs"],
  ["tui/presentation/format.ts", ".tmp-test/presentation-format.mjs"],
  ["tui/presentation/layout.ts", ".tmp-test/presentation-layout.mjs"],
  ["tui/presentation/renderer.tsx", ".tmp-test/presentation-renderer.mjs"],
  ["tests/presentation-mounted.fixture.ts", ".tmp-test/presentation-mounted.mjs"],
  ["tests/compact-panel-mounted.fixture.ts", ".tmp-test/compact-panel-mounted.mjs"],
  ["tests/mcp-mounted.fixture.ts", ".tmp-test/mcp-mounted.mjs", ["browser"]],
  ["tests/lsp-mounted.fixture.ts", ".tmp-test/lsp-mounted.mjs", ["browser"]],
  ["tui/providers/zai.ts", ".tmp-test/provider-zai.mjs", ["browser"]],
  ["tui/providers/openai.ts", ".tmp-test/provider-openai.mjs", ["browser"]],
  ["tui/providers/opencode-go.ts", ".tmp-test/provider-opencode-go.mjs", ["browser"]],
  ["tui/services/quota-provider-hub.ts", ".tmp-test/provider-hub.mjs", ["browser"]],
  ["tests/provider-lifecycle.fixture.ts", ".tmp-test/provider-lifecycle.mjs", ["browser"]],
  ["tui/features/quota.ts", ".tmp-test/quota-composition.mjs", ["browser"]],
  ["tests/quota-selection.fixture.ts", ".tmp-test/quota-selection.mjs", ["browser"]],
  ["tui/features/home.ts", ".tmp-test/home-feature.mjs", ["browser"]],
  ["tui/home.tsx", ".tmp-test/home-composition.mjs", ["browser"]],
  ["tui/features/mcp.ts", ".tmp-test/mcp-model.mjs", ["browser"]],
  ["tui/features/lsp.ts", ".tmp-test/lsp-model.mjs", ["browser"]],
  ["tui/features/token-report.ts", ".tmp-test/token-report-feature.mjs", ["browser"]],
  ["tui/token-report.tsx", ".tmp-test/token-tui.mjs", ["browser"], undefined, ["solid-js"]],
  ["tui/token-report.tsx", ".tmp-test/token-tui-controlled.mjs", ["browser"], [{
    name: "token-tui-controlled-compute",
    setup(build) {
      build.onResolve({ filter: /token-report-data\.js$/ }, () => ({ path: resolve("tests/token-tui-dependencies.fixture.ts") }))
    },
  }], ["solid-js"]],
  ["tui/quota.tsx", ".tmp-test/plugin-adapters-quota-fixture.mjs", ["browser"]],
  ["tui/home.tsx", ".tmp-test/plugin-adapters-home-fixture.mjs", ["browser"]],
  ["tui/token-report.tsx", ".tmp-test/plugin-adapters-token-fixture.mjs", ["browser"], undefined, ["solid-js"]],
  ["tui/mcp.tsx", ".tmp-test/plugin-adapters-mcp-fixture.mjs", ["browser"]],
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

await build({
  bundle: true,
  entryPoints: ["tests/compact-status-row-render.fixture.tsx"],
  external: ["@opentui/*", "solid-js"],
  format: "esm",
  jsx: "automatic",
  jsxImportSource: "@opentui/solid",
  outfile: ".tmp-test/compact-status-row-render.mjs",
  platform: "node",
  target: "es2022",
})
