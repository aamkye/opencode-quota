import { build } from "esbuild"
import { mkdirSync } from "node:fs"

mkdirSync("dist", { recursive: true })

await build({
  entryPoints: ["session-rename.ts"],
  bundle: true,
  minify: true,
  format: "esm",
  platform: "node",
  target: "es2022",
  outfile: "dist/session-rename.ts",
  external: ["@opencode-ai/plugin", "@opencode-ai/sdk"],
  banner: { js: "// Bundled from session-rename.ts" },
  logLevel: "info",
})

console.log("Built dist/session-rename.ts")
