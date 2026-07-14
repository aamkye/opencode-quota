import { mkdir } from "node:fs/promises"
import { builtinModules } from "node:module"
import { dirname, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { build } from "esbuild"

const projectRoot = dirname(fileURLToPath(import.meta.url))
const distRoot = resolve(projectRoot, "dist")

const hostDependencies = [
  "solid-js",
  "solid-js/*",
  "@opentui/*",
  "@opencode-ai/plugin",
  "@opencode-ai/plugin/*",
  "@opencode-ai/sdk",
  "@opencode-ai/sdk/*",
  "bun:*",
  "better-sqlite3",
  ...builtinModules,
  ...builtinModules.filter((name) => !name.startsWith("node:")).map((name) => `node:${name}`),
]

const common = {
  absWorkingDir: projectRoot,
  bundle: true,
  external: hostDependencies,
  format: "esm",
  jsx: "automatic",
  jsxImportSource: "@opentui/solid",
  metafile: true,
  minify: true,
  platform: "node",
  target: "es2022",
}

function sharedImport(path) {
  return {
    name: "external-shared-artifact",
    setup(buildApi) {
      buildApi.onResolve({ filter: /(?:^|\/)shared\/opencode-tools-shared(?:\.js)?$/ }, () => ({
        external: true,
        path,
      }))
    },
  }
}

function hostRuntimeImports() {
  return {
    name: "opencode-host-runtime",
    setup(buildApi) {
      buildApi.onResolve({ filter: /^(?:solid-js|@opentui\/solid\/jsx-runtime)$/ }, (args) => ({
        external: true,
        path: `opentui:runtime-module:${encodeURIComponent(args.path)}`,
      }))
    },
  }
}

export async function buildPlugins({ logLevel = "info" } = {}) {
  await mkdir(resolve(distRoot, "plugins"), { recursive: true })

  const shared = await build({
    ...common,
    entryPoints: ["shared/opencode-tools-shared.ts"],
    logLevel,
    outfile: resolve(distRoot, "opencode-tools-shared.js"),
    plugins: [hostRuntimeImports()],
  })

  const quota = await build({
    ...common,
    stdin: {
      contents: [
        'import quota from "./tui/quota.tsx"',
        'import home from "./tui/home.tsx"',
        "const plugin = {",
        '  id: "aamkye/opencode-tools",',
        "  async tui(api, options) {",
        "    const disposeQuota = await quota.tui(api, options)",
        "    const disposeHome = await home.tui(api, options)",
        "    return () => { disposeHome?.(); disposeQuota?.() }",
        "  },",
        "}",
        "export default plugin",
      ].join("\n"),
      loader: "js",
      resolveDir: projectRoot,
      sourcefile: "opencode-tools-quota-entry.js",
    },
    logLevel,
    outfile: resolve(distRoot, "opencode-tools-quota.js"),
    plugins: [hostRuntimeImports(), sharedImport("./opencode-tools-shared.js")],
  })

  const tokens = await build({
    ...common,
    stdin: {
      contents: [
        'import plugin from "./opencode-tools-tokens.ts"',
        "export default plugin.server",
      ].join("\n"),
      loader: "js",
      resolveDir: projectRoot,
      sourcefile: "opencode-tools-tokens-entry.js",
    },
    logLevel,
    outfile: resolve(distRoot, "plugins/opencode-tools-tokens.js"),
    plugins: [sharedImport("../opencode-tools-shared.js")],
  })

  return { shared, quota, tokens }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await buildPlugins()
}
