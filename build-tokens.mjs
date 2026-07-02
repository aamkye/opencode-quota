import { build } from "esbuild"
import { copyFileSync, mkdirSync } from "fs"

const TUI_FILES = [
  "tui.json",
  "opencode-quota-zai.tsx",
  "opencode-quota-openai.tsx",
  "opencode-quota-shared.tsx",
]

mkdirSync(".opencode", { recursive: true })
for (const file of TUI_FILES) {
  copyFileSync(file, `.opencode/${file}`)
  console.log(`Copied .opencode/${file}`)
}

mkdirSync(".opencode/plugins", { recursive: true })

await build({
  entryPoints: ["opencode-quota-tokens.ts"],
  bundle: true,
  minify: true,
  format: "esm",
  platform: "node",
  target: "es2022",
  outfile: ".opencode/plugins/tokens.ts",
  external: ["@opencode-ai/plugin", "@opencode-ai/sdk", "bun:sqlite", "better-sqlite3", "node:sqlite"],
  logLevel: "info",
  banner: { js: "// Bundled from opencode-quota-tokens.ts — vendored from slkiser/opencode-quota (MIT)" },
})

console.log("Built .opencode/plugins/tokens.ts")
