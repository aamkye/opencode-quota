import assert from "node:assert/strict"
import { copyFile, mkdtemp, readFile, rm } from "node:fs/promises"
import { builtinModules, registerHooks } from "node:module"
import { tmpdir } from "node:os"
import { pathToFileURL } from "node:url"
import { resolve } from "node:path"
import test, { before } from "node:test"
import { createEffect, createRoot } from "solid-js/dist/solid.js"

const root = resolve(import.meta.dirname, "..")
const runtimeModulePrefix = "opentui:runtime-module:"
const hostRuntimeUrls = {
  "solid-js": import.meta.resolve("solid-js/dist/solid.js"),
  "@opentui/solid/jsx-runtime": import.meta.resolve("@opentui/solid/jsx-runtime"),
}
const expectedArtifacts = [
  "dist/opencode-tools-shared.js",
  "dist/opencode-tools-quota.js",
  "dist/plugins/opencode-tools-tokens.js",
]

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(runtimeModulePrefix)) {
      const hostModule = decodeURIComponent(specifier.slice(runtimeModulePrefix.length))
      return nextResolve(hostRuntimeUrls[hostModule] ?? hostModule, context)
    }
    return nextResolve(specifier, context)
  },
})

let buildResults
let contents

before(async () => {
  const { buildPlugins } = await import(pathToFileURL(resolve(root, "build-plugins.mjs")))
  buildResults = await buildPlugins({ logLevel: "silent" })
  contents = Object.fromEntries(await Promise.all(expectedArtifacts.map(async (file) => [
    file,
    await readFile(resolve(root, file), "utf8"),
  ])))
})

test("build:plugins emits the exact minified ESM artifact layout", async () => {
  const pkg = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"))
  assert.equal(pkg.scripts["build:plugins"], "node build-plugins.mjs")

  assert.deepEqual(Object.keys(buildResults).sort(), ["quota", "shared", "tokens"])
  for (const file of expectedArtifacts) {
    const output = contents[file]
    assert.ok(output.length > 0, `${file} is empty`)
    assert.doesNotMatch(output, /\brequire\s*\(/, `${file} is not ESM`)
    assert.doesNotMatch(output, /\n\s{2,}(?:const|let|function|return|if)\b/, `${file} is not minified`)
    assert.doesNotMatch(output, /sourceMappingURL/, `${file} contains a source map reference`)
  }
})

test("loadable entries keep explicit relative imports to the shared artifact", () => {
  assert.match(contents["dist/opencode-tools-quota.js"], /from["']\.\/opencode-tools-shared\.js["']/)
  assert.match(contents["dist/plugins/opencode-tools-tokens.js"], /from["']\.\.\/opencode-tools-shared\.js["']/)
  assert.doesNotMatch(contents["dist/opencode-tools-shared.js"], /opencode-tools-(?:quota|tokens)/)
})

test("shared reactivity and the combined TUI use OpenCode's host-owned Solid runtime", () => {
  for (const file of ["dist/opencode-tools-shared.js", "dist/opencode-tools-quota.js"]) {
    const output = contents[file]
    assert.match(output, /from["']opentui:runtime-module:solid-js["']/, `${file} does not use host Solid`)
    assert.doesNotMatch(output, /from["']solid-js(?:\/[^"']*)?["']/, `${file} imports a separate Solid runtime`)
  }

  const quota = contents["dist/opencode-tools-quota.js"]
  assert.match(quota, /from["']opentui:runtime-module:%40opentui%2Fsolid%2Fjsx-runtime["']/)
  assert.doesNotMatch(quota, /from["']@opentui\/solid\/jsx-runtime["']/)
  assert.doesNotMatch(quota, /\bReact\s*(?:\.|\[)/)
})

test("shared owns computation while loadable entries contain presentation and registration only", () => {
  const inputNames = (result) => Object.keys(result.metafile.inputs).map((file) => `/${file.replaceAll("\\", "/")}`)
  const sharedInputs = inputNames(buildResults.shared)
  const quotaInputs = inputNames(buildResults.quota)
  const tokenInputs = inputNames(buildResults.tokens)

  assert.ok(sharedInputs.some((file) => file.endsWith("/tui/providers/zai.ts")))
  assert.ok(sharedInputs.some((file) => file.endsWith("/tui/providers/openai.ts")))
  assert.ok(sharedInputs.some((file) => file.endsWith("/lib/tokens/token-report-data.ts")))

  assert.ok(quotaInputs.some((file) => file.endsWith("/tui/quota.tsx")))
  assert.ok(quotaInputs.some((file) => file.endsWith("/tui/home.tsx")))
  assert.ok(tokenInputs.some((file) => file.endsWith("/lib/tokens/token-report-presenter.ts")))

  for (const file of [...quotaInputs, ...tokenInputs]) {
    assert.doesNotMatch(file, /\/tui\/providers\/(?:zai|openai)\.ts$/)
    assert.doesNotMatch(file, /\/lib\/tokens\/(?:token-report-data|opencode-storage|quota-stats)\.ts$/)
  }
})

test("all host and built-in dependencies remain external", () => {
  const builtins = new Set(builtinModules.flatMap((name) => [name, name.replace(/^node:/, "")]))

  for (const result of Object.values(buildResults)) {
    assert.ok(Object.keys(result.metafile.inputs).every((file) => !file.includes("node_modules")))
    for (const output of Object.values(result.metafile.outputs)) {
      for (const dependency of output.imports) {
        const bare = dependency.path.replace(/^node:/, "").split("/")[0]
        const host = dependency.path.startsWith(runtimeModulePrefix)
          || dependency.path === "solid-js"
          || dependency.path.startsWith("solid-js/")
          || dependency.path.startsWith("@opentui/")
          || dependency.path.startsWith("@opencode-ai/")
          || dependency.path.startsWith("bun:")
          || builtins.has(bare)
          || dependency.path === "better-sqlite3"
        if (host) assert.equal(dependency.external, true, `${dependency.path} was bundled`)
      }
    }
  }
})

test("artifacts expose one combined TUI plugin, one regular plugin function, and no shared default", async () => {
  const nonce = `?test=${Date.now()}`
  const shared = await import(`${pathToFileURL(resolve(root, expectedArtifacts[0])).href}${nonce}`)
  const quota = await import(`${pathToFileURL(resolve(root, expectedArtifacts[1])).href}${nonce}`)
  const tokens = await import(`${pathToFileURL(resolve(root, expectedArtifacts[2])).href}${nonce}`)

  assert.equal("default" in shared, false)
  assert.equal(typeof shared.createZaiProvider, "function")
  assert.equal(typeof shared.computeTokenReport, "function")
  assert.equal(typeof quota.default, "object")
  assert.equal(typeof quota.default.tui, "function")
  assert.equal(typeof tokens.default, "function")
})

test("combined TUI artifact activates hermetically and shares provider reactivity", async () => {
  const isolatedRoot = await mkdtemp(resolve(tmpdir(), "opencode-tools-artifact-"))
  const isolatedShared = resolve(isolatedRoot, "opencode-tools-shared.js")
  const isolatedQuota = resolve(isolatedRoot, "opencode-tools-quota.js")
  await Promise.all([
    copyFile(resolve(root, expectedArtifacts[0]), isolatedShared),
    copyFile(resolve(root, expectedArtifacts[1]), isolatedQuota),
  ])

  const originalEnvironment = {
    HOME: process.env.HOME,
    XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME,
    XDG_DATA_HOME: process.env.XDG_DATA_HOME,
  }
  process.env.HOME = isolatedRoot
  process.env.XDG_CONFIG_HOME = isolatedRoot
  process.env.XDG_DATA_HOME = isolatedRoot

  const registrations = []
  const originalFetch = globalThis.fetch
  const fetchCalls = []
  globalThis.fetch = async (url, options) => {
    fetchCalls.push({ url: String(url), authorization: options?.headers?.Authorization })
    return {
      ok: true,
      status: 200,
      json: async () => ({
        plan_type: "plus",
        rate_limit: {
          primary_window: { used_percent: 25, reset_after_seconds: 3_600 },
          secondary_window: null,
          limit_reached: false,
        },
        code_review_rate_limit: { primary_window: null },
        credits: { balance: null, unlimited: false },
      }),
    }
  }

  const api = {
    slots: { register(input) { registrations.push(input) } },
    theme: { current: {} },
    state: {
      provider: [{ id: "openai", key: "artifact-test-token" }],
      session: { messages() { return [] } },
      part() { return [] },
    },
    kv: { get() {}, set() {} },
  }

  let disposeActivation
  let disposeProbeRoot
  let provider
  const freshness = []
  try {
    const shared = await import(`${pathToFileURL(isolatedShared).href}?activation=${Date.now()}`)
    const quota = await import(`${pathToFileURL(isolatedQuota).href}?activation=${Date.now()}`)
    provider = shared.createOpenAiProvider(api)
    createRoot((dispose) => {
      disposeProbeRoot = dispose
      createEffect(() => freshness.push(provider.freshness()))
    })

    disposeActivation = await quota.default.tui(api, undefined)
    for (let attempt = 0; attempt < 50 && freshness.at(-1) !== "ready"; attempt += 1) {
      await new Promise((resolve) => setImmediate(resolve))
    }

    assert.deepEqual(freshness, ["loading", "ready"])
    assert.equal(typeof provider.dispose, "function")
    assert.equal(typeof disposeActivation, "function")
    assert.ok(fetchCalls.length >= 3)
    assert.ok(fetchCalls.every((call) => call.url === "https://chatgpt.com/backend-api/wham/usage"))
    assert.ok(fetchCalls.every((call) => call.authorization === "Bearer artifact-test-token"))
    assert.deepEqual(
      registrations.map((registration) => Object.keys(registration.slots)),
      [["sidebar_content"], ["home_bottom"]],
    )
  } finally {
    disposeActivation?.()
    provider?.dispose?.()
    disposeProbeRoot?.()
    await new Promise((resolve) => setImmediate(resolve))
    globalThis.fetch = originalFetch
    for (const [key, value] of Object.entries(originalEnvironment)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    await rm(isolatedRoot, { recursive: true, force: true })
  }
})
