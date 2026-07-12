import { build } from "esbuild"
import { mkdirSync } from "node:fs"

mkdirSync("dist", { recursive: true })

await build({
  entryPoints: ["session-title.ts"],
  bundle: true,
  minify: true,
  format: "esm",
  platform: "node",
  target: "es2022",
  outfile: "dist/session-title.ts",
  external: ["@opencode-ai/plugin", "@opencode-ai/sdk"],
  banner: { js: "// Bundled from session-title.ts" },
  logLevel: "info",
})

console.log("Built dist/session-title.ts")
