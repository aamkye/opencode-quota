import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { builtinModules, registerHooks } from "node:module"
import { pathToFileURL } from "node:url"
import { resolve } from "node:path"
import test, { before } from "node:test"

const root = resolve(import.meta.dirname, "..")
const runtimeModulePrefix = "opentui:runtime-module:"
const expectedArtifacts = [
  "dist/opencode-tools-shared.js",
  "dist/opencode-tools-quota.js",
  "dist/plugins/opencode-tools-tokens.js",
]

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(runtimeModulePrefix)) {
      return nextResolve(decodeURIComponent(specifier.slice(runtimeModulePrefix.length)), context)
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

test("combined TUI artifact activates from a bare config entry", async (t) => {
  const quota = await import(`${pathToFileURL(resolve(root, expectedArtifacts[1])).href}?activation=${Date.now()}`)
  const registrations = []
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({ ok: false })
  t.after(() => {
    globalThis.fetch = originalFetch
  })

  const api = {
    slots: { register(input) { registrations.push(input) } },
    theme: { current: {} },
    state: {
      provider: [],
      session: { messages() { return [] } },
      part() { return [] },
    },
    kv: { get() {}, set() {} },
  }

  await quota.default.tui(api, undefined)

  assert.deepEqual(
    registrations.map((registration) => Object.keys(registration.slots)),
    [["sidebar_content"], ["home_bottom"]],
  )
})
