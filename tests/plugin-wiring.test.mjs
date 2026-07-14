import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import test from "node:test"

const legacyIdentifier = ["opencode", "quota"].join("-")

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
