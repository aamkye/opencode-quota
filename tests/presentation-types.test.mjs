import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import test from "node:test"

const { sortByOrderThenId } = await import("../.tmp-test/presentation-types.mjs")

test("sorts equal-order presentation records by stable ID", () => {
  assert.deepEqual(sortByOrderThenId([{ id: "zeta", order: 10 }, { id: "alpha", order: 10 }]), [
    { id: "alpha", order: 10 },
    { id: "zeta", order: 10 },
  ])
})

test("typechecks a semantic panel model fixture", () => {
  execFileSync(
    "./node_modules/.bin/tsc",
    [
      "--noEmit",
      "--ignoreConfig",
      "--strict",
      "--target", "ES2022",
      "--module", "ESNext",
      "--moduleResolution", "bundler",
      "tests/presentation-types.fixture.ts",
    ],
    { stdio: "pipe" },
  )
})

test("rejects invalid timer states during typechecking", () => {
  const result = spawnSync(
    "./node_modules/.bin/tsc",
    [
      "--noEmit",
      "--ignoreConfig",
      "--strict",
      "--target", "ES2022",
      "--module", "ESNext",
      "--moduleResolution", "bundler",
      "tests/presentation-types.invalid-timer.fixture.ts",
    ],
    { encoding: "utf8" },
  )

  assert.notEqual(result.status, 0)
  assert.match(result.stdout, /Type '"running"' is not assignable to type 'TimerState'/)
})
