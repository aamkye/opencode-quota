import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

const legacyIdentifier = ["opencode", "quota"].join("-")

test("publishes and typechecks the standalone plugins", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"))
  const lock = JSON.parse(readFileSync("package-lock.json", "utf8"))
  const tsconfig = JSON.parse(readFileSync("tsconfig.json", "utf8"))

  assert.deepEqual(pkg.exports, {
    "./quota": "./tui/quota.tsx",
    "./home": "./tui/home.tsx",
    "./token-report": "./tui/token-report.tsx",
    "./mcp": "./tui/mcp.tsx",
  })
  assert.deepEqual(pkg.files, ["dist", "plugin-manifest.json", "tui", "shared", "README.md"])
  assert.deepEqual(tsconfig.include, [
    "opencode-plugin-tui.d.ts",
    "lib/session-title.ts",
    "session-title.ts",
    "tui/**/*.ts",
    "tui/**/*.tsx",
    "shared/**/*.ts",
  ])
  assert.equal(pkg.engines.opencode, ">=1.18.1")
  assert.equal(lock.packages[""].engines.opencode, ">=1.18.1")
})

test("source modules own the TUI slots without root-config activation", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"))
  const tui = JSON.parse(readFileSync("tui.json", "utf8"))
  const tsconfig = JSON.parse(readFileSync("tsconfig.json", "utf8"))

  assert.equal(pkg.name, "@aamkye/opencode-tools")
  assert.equal(pkg.files.includes("tui"), true)
  assert.equal(tui.$schema, "https://opencode.ai/tui.json")
  assert.equal(tui.plugin, undefined)
  assert.equal(readFileSync("tui/quota.tsx", "utf8").includes("sidebar_content"), true)
  assert.equal(readFileSync("tui/quota.tsx", "utf8").includes("home_bottom"), false)
  assert.equal(readFileSync("tui/home.tsx", "utf8").includes("home_bottom"), true)
  assert.equal(readFileSync("tui/home.tsx", "utf8").includes("sidebar_content"), false)
  assert.equal(tsconfig.include.some((entry) => entry.includes(legacyIdentifier)), false)
  assert.equal(existsSync(`${legacyIdentifier}-home.tsx`), false)
})

test("tracked project files contain no active legacy identifier", () => {
  const trackedFiles = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
    .split("\0")
    .filter(Boolean)
    .filter((file) => !file.startsWith("openspec/") && !file.startsWith("docs/superpowers/"))
    .filter((file) => existsSync(file))
    .filter((file) => /(?:^|\/)(?:README\.md|package(?:-lock)?\.json|tsconfig\.json|tui\.json|[^/]+\.(?:[cm]?[jt]sx?|json|md))$/.test(file))

  for (const file of trackedFiles) {
    const content = readFileSync(file, "utf8")
      .replaceAll(`https://github.com/slkiser/${legacyIdentifier}`, "")
    assert.equal(content.includes(legacyIdentifier), false, `${file} retains a legacy project identifier`)
  }
})

test("documents secret-safe OpenCode Go configuration", () => {
  const readme = readFileSync("README.md", "utf8")
  for (const text of [
    "quota.opencodego.workspaceId",
    "quota.opencodego.workspaceToken",
    "workspaceToken is the plaintext auth cookie value",
    "rolling 5H",
    "weekly 7D",
    "subscription month 1M",
    "must not be committed",
    "rotate",
  ]) assert.equal(readme.includes(text), true, `missing README text: ${text}`)

  assert.doesNotMatch(readme, /private (?:JSON|query) endpoint/iu)
  assert.doesNotMatch(readme, /[".]openCodeGo[".]/u)
  assert.doesNotMatch(readme, /(?:copy|save|export).{0,40}(?:full HTML|response body|HAR)/iu)
  const tokenValues = [...readme.matchAll(/"workspaceToken"\s*:\s*"([^"]+)"/gu)].map((match) => match[1])
  assert.deepEqual(tokenValues, ["TOKEN_TEST_ONLY_DO_NOT_USE"])
})

test("documents OpenCode Go provider semantics without exhausted backoff", () => {
  const readme = readFileSync("README.md", "utf8")
  const configuration = readme.match(/`quota\.opencodego\.workspaceId` identifies[\s\S]*?(?=\nPolling defaults to)/u)?.[0]
  const openCodeGoFeatures = readme.match(/### OpenCode Go\n\n([\s\S]*?)(?=\n### Shared)/u)?.[1]
  const sharedFeatures = readme.match(/### Shared\n\n([\s\S]*?)(?=\n## Local-only usage)/u)?.[1]

  assert.ok(configuration, "missing OpenCode Go configuration guidance")
  assert.ok(openCodeGoFeatures, "missing OpenCode Go feature guidance")
  assert.ok(sharedFeatures, "missing shared feature guidance")
  assert.match(
    configuration,
    /The provider sends these workspace credentials only to the fixed\s+`https:\/\/opencode\.ai` origin; they do not replace the OpenCode-managed\s+inference API key\./u,
  )
  assert.match(
    configuration,
    /OpenCode Go reads the\s+undocumented Solid hydration contract from the\s+authenticated page and fails\s+closed if that contract changes\./u,
  )
  assert.match(
    configuration,
    /OpenCode Go uses the shared default\/custom polling interval, one-second\s+countdowns, reset-boundary refresh, and a ten-minute stale horizon without\s+exhausted backoff\./u,
  )
  assert.match(
    openCodeGoFeatures,
    /\*\*Shared refresh behavior\*\*[^.]*ten-minute stale horizon\s+without exhausted backoff\./u,
  )
  assert.match(sharedFeatures, /\*\*Smart polling \(Z\.AI and OpenAI\)\*\*[^.]*backing off to 5min[^.]*exhausted\./u)
  assert.doesNotMatch(readme, /OpenCode Go[^.]{0,200}(?:backs? off|backing off)[^.]{0,100}exhaust/iu)
})
