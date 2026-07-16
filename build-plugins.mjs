import { mkdir, readFile, rm } from "node:fs/promises"
import { builtinModules } from "node:module"
import { dirname, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { build } from "esbuild"
import { transformAsync } from "@babel/core"

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
  metafile: true,
  minify: true,
  platform: "node",
  target: "es2022",
}

async function transformSolid(code, filename) {
  const solidPreset = (await import("babel-preset-solid")).default
  const tsPreset = (await import("@babel/preset-typescript")).default
  const presets = [[solidPreset, { moduleName: "@opentui/solid", generate: "universal" }]]
  if (/\.[cm]?tsx?$/.test(filename)) {
    presets.push([tsPreset])
  }
  const result = await transformAsync(code, { filename, configFile: false, babelrc: false, presets })
  return result?.code ?? code
}

function solidTransformPlugin() {
  return {
    name: "solid-jsx-transform",
    setup(buildApi) {
      buildApi.onLoad({ filter: /\.[cm]?tsx?$/ }, async (args) => {
        const code = await readFile(args.path, "utf8")
        const transformed = await transformSolid(code, args.path)
        return { contents: transformed, loader: "js" }
      })
    },
  }
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
      buildApi.onResolve({ filter: /^(?:solid-js|@opentui\/solid|@opentui\/solid\/jsx-runtime)$/ }, (args) => ({
        external: true,
        path: `opentui:runtime-module:${encodeURIComponent(args.path)}`,
      }))
    },
  }
}

export async function buildPlugins({ logLevel = "info" } = {}) {
  await mkdir(distRoot, { recursive: true })
  await rm(resolve(distRoot, "plugins/opencode-tools-tokens.js"), { force: true })

  const shared = await build({
    ...common,
    entryPoints: ["shared/opencode-tools-shared.ts"],
    logLevel,
    outfile: resolve(distRoot, "opencode-tools-shared.js"),
    plugins: [solidTransformPlugin(), hostRuntimeImports()],
  })

  const quota = await build({
    ...common,
    stdin: {
      contents: [
        'import quota from "./tui/quota.tsx"',
        'import home from "./tui/home.tsx"',
        'import { registerTokenReportTui } from "./tui/token-report.tsx"',
        "const plugin = {",
        '  id: "aamkye/opencode-tools",',
        "  async tui(api, options) {",
        "    await quota.tui(api, options)",
        "    await home.tui(api, options)",
        "    await registerTokenReportTui(api)",
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
    plugins: [solidTransformPlugin(), hostRuntimeImports(), sharedImport("./opencode-tools-shared.js")],
  })

  return { shared, quota }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await buildPlugins()
}
