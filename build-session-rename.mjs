import { build } from "esbuild"
import { mkdirSync } from "node:fs"

export async function buildSessionRename({ logLevel = "info" } = {}) {
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
    logLevel,
  })
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  await buildSessionRename()
  console.log("Built dist/session-rename.ts")
}
