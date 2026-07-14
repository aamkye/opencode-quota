import { build } from "esbuild"
import { cpSync, mkdirSync } from "fs"

const TUI_FILES = [
  "tui.json",
  "tui",
  "opencode-tools-tokens.ts",
]

mkdirSync(".opencode", { recursive: true })
for (const file of TUI_FILES) {
  cpSync(file, `.opencode/${file}`, { recursive: true })
  console.log(`Copied .opencode/${file}`)
}

mkdirSync(".opencode/plugins", { recursive: true })

await build({
  entryPoints: ["opencode-tools-tokens.ts"],
  bundle: true,
  minify: true,
  format: "esm",
  platform: "node",
  target: "es2022",
  outfile: ".opencode/plugins/opencode-tools-tokens.ts",
  external: ["@opencode-ai/plugin", "@opencode-ai/sdk", "bun:sqlite", "better-sqlite3", "node:sqlite"],
  logLevel: "info",
  banner: { js: "// Bundled from opencode-tools-tokens.ts" },
})

console.log("Built .opencode/plugins/opencode-tools-tokens.ts")
