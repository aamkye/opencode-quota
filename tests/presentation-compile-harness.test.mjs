import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const presentationTests = [
  "tests/presentation-types.test.mjs",
  "tests/presentation-format.test.mjs",
  "tests/presentation-layout.test.mjs",
  "tests/presentation-render-model.test.mjs",
  "tests/presentation-mounted.test.mjs",
]

test("precompiles presentation modules before concurrent test workers start", () => {
  for (const testFile of presentationTests) {
    const source = readFileSync(testFile, "utf8")
    assert.doesNotMatch(source, /await import\("\.\/compile-presentation\.mjs"\)/)
  }

  const packageJson = JSON.parse(readFileSync("package.json", "utf8"))
  assert.match(packageJson.scripts.test, /node tests\/compile-presentation\.mjs && node --test tests\/\*\.test\.mjs/)
})
