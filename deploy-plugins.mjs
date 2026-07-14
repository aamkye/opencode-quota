import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { dirname, isAbsolute, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { buildPlugins } from "./build-plugins.mjs"

const projectRoot = dirname(fileURLToPath(import.meta.url))
const obsoleteNamespace = ["opencode", "quota"].join("-")

const obsoleteFiles = [
  `${obsoleteNamespace}.js`,
  `${obsoleteNamespace}.ts`,
  "opencode-tools-tokens.ts",
  "plugins/opencode-tools-tokens.ts",
  `plugins/${obsoleteNamespace}-tokens.js`,
  `plugins/${obsoleteNamespace}-tokens.ts`,
  "plugins/tokens.js",
  "plugins/tokens.ts",
]

const managedConfigPaths = [
  "opencode-tools-quota.js",
  "opencode-tools-tokens.ts",
  "plugins/opencode-tools-tokens.js",
  "plugins/opencode-tools-tokens.ts",
  `${obsoleteNamespace}.js`,
  `${obsoleteNamespace}.ts`,
  `${obsoleteNamespace}-zai.tsx`,
  `${obsoleteNamespace}-openai.tsx`,
  `${obsoleteNamespace}-shared.tsx`,
  `plugins/${obsoleteNamespace}-tokens.js`,
  `plugins/${obsoleteNamespace}-tokens.ts`,
  "tokens.js",
  "tokens.ts",
  "plugins/tokens.js",
  "plugins/tokens.ts",
  "tui/quota.tsx",
  "tui/home.tsx",
]

function entrySpec(entry) {
  if (typeof entry === "string") return entry
  return Array.isArray(entry) && typeof entry[0] === "string" ? entry[0] : undefined
}

function specPath(spec, targetRoot) {
  if (/^file:/i.test(spec)) {
    try {
      return resolve(fileURLToPath(new URL(spec)))
    } catch {
      return undefined
    }
  }

  const path = spec.replaceAll("\\", "/").replace(/[?#].*$/, "")
  if (isAbsolute(path)) return resolve(path)
  if (/^\.\.?\//.test(path)) return resolve(targetRoot, path)
  return undefined
}

function managedConfigPath(spec, targetRoot) {
  const path = specPath(spec, targetRoot)
  return path && managedConfigPaths.find((candidate) => path === resolve(targetRoot, candidate))
}

function isManagedSpec(spec, targetRoot) {
  const normalized = spec.toLowerCase().replace(/[?#].*$/, "")
  return /^(?:@aamkye\/)?opencode-(?:tools|quota)(?:\/.*)?$/.test(normalized)
    || managedConfigPath(spec, targetRoot) !== undefined
}

function optionsPriority(spec, targetRoot) {
  const path = managedConfigPath(spec, targetRoot)
  if (path === "opencode-tools-quota.js") return 0
  if (path === "tui/quota.tsx") return 1
  if (/^(?:@aamkye\/)?opencode-(?:tools|quota)(?:\/.*)?$/i.test(spec)) return 2
  if (path === `${obsoleteNamespace}-zai.tsx` || path === `${obsoleteNamespace}-openai.tsx`) return 3
  return Infinity
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
  const unrelated = []
  let options
  let priority = Infinity
  for (const entry of Array.isArray(config.plugin) ? config.plugin : []) {
    const spec = entrySpec(entry)
    if (!spec || !isManagedSpec(spec, targetRoot)) {
      unrelated.push(entry)
      continue
    }

    const candidatePriority = Array.isArray(entry) && entry.length > 1
      ? optionsPriority(spec, targetRoot)
      : Infinity
    if (candidatePriority < priority) {
      options = entry[1]
      priority = candidatePriority
    }
  }
  const quotaEntry = priority < Infinity ? ["./opencode-tools-quota.js", options] : "./opencode-tools-quota.js"
  config.plugin = [...unrelated, quotaEntry]
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
