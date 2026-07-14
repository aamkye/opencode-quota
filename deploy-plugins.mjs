import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { buildPlugins } from "./build-plugins.mjs"

const projectRoot = dirname(fileURLToPath(import.meta.url))

const obsoleteFiles = [
  "opencode-quota.js",
  "opencode-quota.ts",
  "opencode-tools-tokens.ts",
  "plugins/opencode-tools-tokens.ts",
  "plugins/opencode-quota-tokens.js",
  "plugins/opencode-quota-tokens.ts",
  "plugins/tokens.js",
  "plugins/tokens.ts",
]

function isManagedEntry(entry) {
  if (typeof entry !== "string") return false
  const normalized = entry.toLowerCase().replaceAll("\\", "/").replace(/[?#].*$/, "")
  const name = normalized.slice(normalized.lastIndexOf("/") + 1)
  return /^(?:@aamkye\/)?opencode-(?:tools|quota)(?:\/.*)?$/.test(normalized)
    || normalized.endsWith("/tui/quota.tsx")
    || normalized.endsWith("/tui/home.tsx")
    || /^opencode-(?:tools|quota)(?:[-.].*)?$/.test(name)
    || /^tokens\.(?:[cm]?js|tsx?)$/.test(name)
}

async function readTuiConfig(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"))
  } catch (error) {
    if (error?.code === "ENOENT") return { $schema: "https://opencode.ai/tui.json" }
    throw error
  }
}

export function resolveGlobalConfigRoot(env = process.env, home = homedir()) {
  return join(env.XDG_CONFIG_HOME?.trim() || join(home, ".config"), "opencode")
}

export async function deployPlugins(targetRoot, { logLevel = "info" } = {}) {
  await buildPlugins({ logLevel })
  await mkdir(join(targetRoot, "plugins"), { recursive: true })

  await Promise.all([
    copyFile(resolve(projectRoot, "dist/opencode-tools-shared.js"), join(targetRoot, "opencode-tools-shared.js")),
    copyFile(resolve(projectRoot, "dist/opencode-tools-quota.js"), join(targetRoot, "opencode-tools-quota.js")),
    copyFile(resolve(projectRoot, "dist/plugins/opencode-tools-tokens.js"), join(targetRoot, "plugins/opencode-tools-tokens.js")),
  ])

  await Promise.all(obsoleteFiles.map((file) => rm(join(targetRoot, file), { force: true })))

  const configPath = join(targetRoot, "tui.json")
  const config = await readTuiConfig(configPath)
  const unrelated = Array.isArray(config.plugin) ? config.plugin.filter((entry) => !isManagedEntry(entry)) : []
  config.plugin = [...unrelated, "./opencode-tools-quota.js"]
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`)
}

async function main(mode) {
  if (mode !== "local" && mode !== "global") {
    throw new Error("Usage: node deploy-plugins.mjs <local|global>")
  }

  const targetRoot = mode === "local"
    ? resolve(projectRoot, ".opencode")
    : resolveGlobalConfigRoot()
  await deployPlugins(targetRoot)
  console.log(`Deployed opencode-tools plugins to ${targetRoot}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main(process.argv[2])
}
